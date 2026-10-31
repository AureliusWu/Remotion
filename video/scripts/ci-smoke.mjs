import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderMedia } from "@remotion/renderer";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMediaTools } from "./lib/media-tools.mjs";

// Real cross-platform render smoke test; requires no GPU, Python or TTS model.
// Browser installation is explicit in CI: npm run browser:ensure.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "out/workflow-ci");
const outputFile = path.join(outputDir, "smoke.mp4");
const reportFile = path.join(outputDir, "report.json");
const expected = {
  composition: "EnvironmentTest",
  width: 1920,
  height: 1080,
  fps: 60,
  frames: 240,
  durationSeconds: 4,
};
const options = {
  codec: "h264",
  audioCodec: "aac",
  hardwareAcceleration: "disable",
  concurrency: 2,
  crf: 23,
  x264Preset: "veryfast",
  pixelFormat: "yuv420p",
  audioBitrate: "128k",
  sampleRate: 48000,
  imageFormat: "jpeg",
  jpegQuality: 90,
};
const report = {
  status: "running",
  startedAt: new Date().toISOString(),
  environment: {
    platform: process.platform,
    arch: process.arch,
    node: process.version,
    ci: process.env.CI === "true",
  },
  expected,
  options,
  file: path.relative(root, outputFile),
  browserErrors: [],
  render: { status: "pending" },
  fullDecode: { status: "pending" },
};
const save = () =>
  writeFile(reportFile, JSON.stringify(report, null, 2) + "\n");
const rational = (value) => {
  const [numerator, denominator = 1] = String(value).split("/").map(Number);
  return numerator / denominator;
};
const sha256 = async (file) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};
const onBrowserLog = (entry) => {
  if (entry.type === "error") report.browserErrors.push(entry.text);
};
await mkdir(outputDir, { recursive: true });
let browser;
try {
  await save();
  assert.equal(process.argv.length, 2, "Usage: node scripts/ci-smoke.mjs");
  const { ffmpeg, ffprobe } = getMediaTools();
  report.mediaTools = { ffmpeg, ffprobe };
  console.log(
    "Bundling EnvironmentTest for the real 4-second CPU smoke render...",
  );
  const serveUrl = await bundle({
    entryPoint: path.join(root, "src/index.ts"),
    outDir: path.join(outputDir, "bundle"),
    rspack: true,
  });
  browser = await openBrowser("chrome", { logLevel: "error" });
  const compositions = await getCompositions({
    serveUrl,
    inputProps: {},
    puppeteerInstance: browser,
    onBrowserLog,
  });
  const composition = compositions.find(
    (item) => item.id === expected.composition,
  );
  assert(composition, "EnvironmentTest composition is missing");
  for (const [property, value] of Object.entries({
    width: expected.width,
    height: expected.height,
    fps: expected.fps,
    durationInFrames: expected.frames,
  }))
    assert.equal(
      composition[property],
      value,
      `Unexpected composition ${property}`,
    );
  report.render = { status: "running" };
  await save();
  let bucket = -1;
  await renderMedia({
    ...options,
    composition,
    serveUrl,
    inputProps: {},
    outputLocation: outputFile,
    overwrite: true,
    puppeteerInstance: browser,
    onBrowserLog,
    logLevel: "error",
    onProgress: (progress) => {
      const next = Math.floor(progress.renderedFrames / 60);
      if (next !== bucket) {
        bucket = next;
        console.log(
          `CPU smoke: ${progress.renderedFrames}/${expected.frames} frames; encoded ${progress.encodedFrames}`,
        );
      }
    },
  });
  report.render = { status: "passed", completedAt: new Date().toISOString() };
  await save();
  console.log("Probing the actual smoke MP4 streams...");
  const probe = JSON.parse(
    execFileSync(
      ffprobe,
      [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        outputFile,
      ],
      { encoding: "utf8", windowsHide: true, timeout: 30000 },
    ),
  );
  const videoStreams = probe.streams.filter(
    (stream) => stream.codec_type === "video",
  );
  const audioStreams = probe.streams.filter(
    (stream) => stream.codec_type === "audio",
  );
  assert.equal(
    videoStreams.length,
    1,
    "Smoke output must contain one video stream",
  );
  assert.equal(
    audioStreams.length,
    1,
    "Smoke output must contain one audio stream",
  );
  const video = videoStreams[0];
  const audio = audioStreams[0];
  assert.equal(video.codec_name, "h264");
  assert.equal(video.width, expected.width);
  assert.equal(video.height, expected.height);
  assert.equal(rational(video.avg_frame_rate), expected.fps);
  assert.equal(Number(video.nb_frames), expected.frames);
  assert(
    Number.isFinite(Number(video.duration)) &&
      Math.abs(Number(video.duration) - expected.durationSeconds) <=
        1 / expected.fps,
  );
  assert.equal(audio.codec_name, "aac");
  assert(
    Number.isFinite(Number(audio.duration)) &&
      Math.abs(Number(audio.duration) - expected.durationSeconds) <= 0.1,
  );
  assert.equal(Number(audio.sample_rate), options.sampleRate);
  assert(audio.channels >= 1, "AAC stream has no channels");
  report.video = {
    width: video.width,
    height: video.height,
    codec: video.codec_name,
    fps: rational(video.avg_frame_rate),
    frames: Number(video.nb_frames),
    durationSeconds: Number(video.duration),
    pixelFormat: video.pix_fmt,
  };
  report.audio = {
    codec: audio.codec_name,
    durationSeconds: Number(audio.duration),
    sampleRate: Number(audio.sample_rate),
    channels: audio.channels,
  };
  report.fullDecode = { status: "running" };
  await save();
  console.log(
    "Fully decoding all 240 video frames and the complete AAC track...",
  );
  execFileSync(
    ffmpeg,
    [
      "-v",
      "error",
      "-xerror",
      "-nostdin",
      "-i",
      outputFile,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0",
      "-c:v",
      "rawvideo",
      "-c:a",
      "pcm_s16le",
      "-f",
      "null",
      "-",
    ],
    { windowsHide: true, timeout: 180000, stdio: "pipe" },
  );
  report.fullDecode = {
    status: "passed",
    completedAt: new Date().toISOString(),
  };
  assert.equal(
    report.browserErrors.length,
    0,
    "Smoke render logged browser errors",
  );
  report.sizeBytes = (await stat(outputFile)).size;
  report.sha256 = await sha256(outputFile);
  report.status = "passed";
  report.completedAt = new Date().toISOString();
} catch (error) {
  report.status = "failed";
  report.error = error.stack ?? String(error);
  if (error.stderr) report.commandStderr = String(error.stderr);
  if (error.stdout) report.commandStdout = String(error.stdout);
  if (report.render.status === "running") report.render.status = "failed";
  if (report.fullDecode.status === "running")
    report.fullDecode.status = "failed";
  process.exitCode = 1;
} finally {
  if (browser) {
    try {
      await browser.close({ silent: true });
    } catch (error) {
      report.browserCloseError = error.stack ?? String(error);
      report.status = "failed";
      process.exitCode = 1;
    }
  }
  await save();
}
console.log(
  JSON.stringify(
    {
      status: report.status,
      report: path.relative(root, reportFile),
      file: report.file,
      render: report.render.status,
      fullDecode: report.fullDecode.status,
      error: report.error ?? report.browserCloseError ?? null,
    },
    null,
    2,
  ),
);
