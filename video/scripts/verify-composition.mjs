import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { getMediaTools } from "./lib/media-tools.mjs";

// Exercise the real bundler, Chromium renderer and local audio files.
// This command creates QA stills and a report, not an MP4 export.
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    seconds: { type: "string" },
    fps: { type: "string" },
    frames: { type: "string" },
    voiceover: { type: "string" },
    width: { type: "string" },
    height: { type: "string" },
  },
});
const id = positionals[0];
const seconds = Number(values.seconds);
const fps = Number(values.fps);
const width = values.width === undefined ? 1920 : Number(values.width);
const height = values.height === undefined ? 1080 : Number(values.height);
if (!id || !/^[a-zA-Z0-9_-]+$/.test(id) || !(seconds > 0) || !(fps > 0)) {
  throw new Error(
    "Usage: node scripts/verify-composition.mjs ID --seconds=60 --fps=60 [--width=1080 --height=1920] [--frames=180,1080] [--voiceover=china-genai/voiceover-manifest.json]",
  );
}
if (
  !Number.isInteger(width) ||
  !Number.isInteger(height) ||
  width <= 0 ||
  height <= 0
) {
  throw new Error("Expected positive integer --width and --height");
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "out", `${id}-validation`);
if (!outputDir.startsWith(`${root}${path.sep}out${path.sep}`))
  throw new Error("Invalid QA output path");
await mkdir(outputDir, { recursive: true });
const report = {
  composition: id,
  checkedAt: new Date().toISOString(),
  expected: { width, height, fps, durationInFrames: seconds * fps },
  frames: [],
  audio: [],
  browserErrors: [],
  status: "running",
};
let browser;
const onBrowserLog = (entry) => {
  if (entry.type === "error") report.browserErrors.push(entry.text);
};

try {
  console.log(`Bundling ${id} once for all QA frames...`);
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
  const composition = compositions.find((item) => item.id === id);
  if (!composition) throw new Error(`Unknown composition: ${id}`);
  for (const [key, expected] of Object.entries(report.expected)) {
    if (composition[key] !== expected)
      throw new Error(`${key}: expected ${expected}, got ${composition[key]}`);
  }
  report.actual = Object.fromEntries(
    Object.keys(report.expected).map((key) => [key, composition[key]]),
  );
  const frames = values.frames
    ? values.frames.split(",").map(Number)
    : [
        0,
        Math.floor(composition.durationInFrames / 2),
        composition.durationInFrames - 1,
      ];
  for (const frame of frames) {
    if (
      !Number.isInteger(frame) ||
      frame < 0 ||
      frame >= composition.durationInFrames
    )
      throw new Error(`Invalid QA frame ${frame}`);
    const output = path.join(
      outputDir,
      `frame-${String(frame).padStart(4, "0")}.png`,
    );
    await renderStill({
      composition,
      serveUrl,
      frame,
      output,
      imageFormat: "png",
      puppeteerInstance: browser,
      onBrowserLog,
      logLevel: "error",
    });
    const png = await readFile(output);
    if (
      png.subarray(1, 4).toString() !== "PNG" ||
      png.readUInt32BE(16) !== width ||
      png.readUInt32BE(20) !== height
    )
      throw new Error(`Invalid ${width}x${height} PNG at frame ${frame}`);
    report.frames.push({
      frame,
      file: path.basename(output),
      bytes: png.length,
      sha256: createHash("sha256").update(png).digest("hex"),
    });
    console.log(`Verified ${width}x${height} frame ${frame}`);
  }
  if (values.voiceover) {
    const manifestFile = path.resolve(root, "public", values.voiceover);
    if (!manifestFile.startsWith(`${root}${path.sep}public${path.sep}`))
      throw new Error("Invalid voiceover manifest path");
    const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
    const { ffmpeg, ffprobe } = getMediaTools();
    let totalSeconds = 0;
    for (const scene of manifest.scenes) {
      const file = path.resolve(path.dirname(manifestFile), scene.file);
      if (!file.startsWith(`${path.dirname(manifestFile)}${path.sep}`))
        throw new Error("Invalid audio asset path");
      const metadata = JSON.parse(
        execFileSync(
          ffprobe,
          [
            "-v",
            "error",
            "-show_entries",
            "format=duration:stream=codec_type,sample_rate,channels",
            "-of",
            "json",
            file,
          ],
          { encoding: "utf8", windowsHide: true, shell: false },
        ),
      );
      const duration = Number(metadata.format.duration);
      if (!metadata.streams.some((stream) => stream.codec_type === "audio"))
        throw new Error(`Missing audio stream: ${scene.file}`);
      if (
        !(duration > 0) ||
        duration + scene.fromSeconds > scene.sceneDurationSeconds
      )
        throw new Error(`Audio overruns scene: ${scene.file}`);
      if (Math.abs(duration - scene.durationSeconds) > 0.1)
        throw new Error(`Audio manifest is stale: ${scene.file}`);
      execFileSync(
        ffmpeg,
        [
          "-v",
          "error",
          "-xerror",
          "-i",
          file,
          "-map",
          "0:a:0",
          "-vn",
          "-c:a",
          "pcm_s16le",
          "-f",
          "null",
          "-",
        ],
        {
          stdio: "pipe",
          windowsHide: true,
          shell: false,
        },
      );
      let captionEnd = 0;
      for (const caption of scene.captions ?? []) {
        if (
          !caption.text?.trim() ||
          !Number.isFinite(caption.startSeconds) ||
          !Number.isFinite(caption.endSeconds) ||
          caption.startSeconds < captionEnd - 0.0001 ||
          caption.endSeconds <= caption.startSeconds ||
          caption.endSeconds > scene.sceneDurationSeconds
        ) {
          throw new Error(
            `Invalid, overlapping or out-of-scene subtitle: ${scene.file}`,
          );
        }
        captionEnd = caption.endSeconds;
      }
      report.audio.push({
        file: scene.file,
        durationSeconds: duration,
        tailRoomSeconds: Number(
          (scene.sceneDurationSeconds - scene.fromSeconds - duration).toFixed(
            3,
          ),
        ),
        fullDecode: "passed",
        captionCount: scene.captions?.length ?? 0,
      });
      totalSeconds += scene.sceneDurationSeconds;
    }
    if (totalSeconds !== seconds)
      throw new Error(
        `Narration scene durations total ${totalSeconds}s instead of ${seconds}s`,
      );
    console.log(
      `Verified ${report.audio.length} complete audio files, ${totalSeconds}s timeline`,
    );
  }
  if (report.browserErrors.length)
    throw new Error(`Browser errors: ${report.browserErrors.join("; ")}`);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.message;
  process.exitCode = 1;
} finally {
  if (browser) await browser.close({ silent: true });
  await writeFile(
    path.join(outputDir, "report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
}
console.log(
  `${report.status.toUpperCase()}: ${path.join(outputDir, "report.json")}`,
);
if (report.error) console.error(report.error);
