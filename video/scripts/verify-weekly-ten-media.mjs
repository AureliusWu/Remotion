import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getMediaTools } from "./lib/media-tools.mjs";
import { resolveNewsCount } from "./lib/news-contract.mjs";

// Measures the actual exported mix, never the source MP3s. Keeps decoded PCM.
// Usage: node scripts/verify-weekly-ten-media.mjs FILE [EDITION]
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [input, edition = "weekly-ten", ...extra] = process.argv.slice(2);
if (!input || extra.length || !/^[a-z0-9-]+$/.test(edition))
  throw new Error(
    "Usage: node scripts/verify-weekly-ten-media.mjs FILE [EDITION]; edition must match [a-z0-9-]+",
  );
const file = path.resolve(root, input);
const reportPath = `${file}.audio-validation.json`;
const { ffmpeg, ffprobe } = getMediaTools();
const storyboardPath = path.join(root, `effects/${edition}/storyboard.json`);
const manifestPath = path.join(
  root,
  `public/${edition}/voiceover-manifest.json`,
);
const expected = {
  scenes: null,
  seconds: 180,
  sampleRate: 48000,
  channels: 1,
  bitsPerSample: 16,
  durationToleranceSeconds: 0.1,
  // Narration is normalized near -23 dBFS; a low background bed alone should
  // not satisfy this speech-window check. This is RMS, not loudness / LUFS.
  windowRmsMinimumDbfs: -36,
  sampleNonSilentThresholdDbfs: -60,
  allowedClippedSamples: 0,
};
const report = {
  checkedAt: new Date().toISOString(),
  script: "scripts/verify-weekly-ten-media.mjs",
  edition,
  input: file,
  status: "running",
  expected,
  measurement: {
    source: "actual exported MP4 first audio track, decoded in full",
    units: "RMS and sample peak in dBFS; not LUFS or true peak",
    normalizationReference: "PCM16 sample / 32768",
    clippingDefinition: "PCM samples equal to -32768 or +32767",
    silenceDefinition:
      "exact digital zero and samples below -60 dBFS reported separately",
    limits:
      "Window energy validates audible mix presence, not speech identity, intelligibility or subjective naturalness. Mono downmix may reduce stereo peaks; this is not a per-channel true-peak measurement.",
  },
  inputs: {},
  decode: { status: "pending" },
  windows: [],
  errors: [],
};
const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};
const finite = (value) => typeof value === "number" && Number.isFinite(value);
const near = (a, b, tolerance = 0.000001) =>
  finite(a) && finite(b) && Math.abs(a - b) <= tolerance;
const sha256 = async (filename) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
};
const loadJson = async (name, filename) => {
  const bytes = await readFile(filename);
  report.inputs[name] = {
    file: path.relative(root, filename),
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  return JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
};

const pcmFromWav = (wav) => {
  requireCondition(
    wav.length >= 12 &&
      wav.toString("ascii", 0, 4) === "RIFF" &&
      wav.toString("ascii", 8, 12) === "WAVE",
    "Decoded file is not RIFF WAVE",
  );
  let format;
  let pcm;
  for (let offset = 12; offset + 8 <= wav.length; ) {
    const id = wav.toString("ascii", offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const start = offset + 8;
    requireCondition(size <= wav.length - start, `Truncated WAV ${id} chunk`);
    if (id === "fmt ") {
      requireCondition(size >= 16, "Truncated WAV format");
      const tag = wav.readUInt16LE(start);
      const pcmTag =
        tag === 1 ||
        (tag === 0xfffe && size >= 40 && wav.readUInt32LE(start + 24) === 1);
      format = {
        pcm: pcmTag,
        channels: wav.readUInt16LE(start + 2),
        sampleRate: wav.readUInt32LE(start + 4),
        blockAlign: wav.readUInt16LE(start + 12),
        bitsPerSample: wav.readUInt16LE(start + 14),
      };
    }
    if (id === "data") {
      requireCondition(!pcm, "Multiple WAV data chunks are not supported");
      pcm = wav.subarray(start, start + size);
    }
    offset = start + size + (size % 2);
  }
  requireCondition(
    format?.pcm &&
      format.channels === expected.channels &&
      format.sampleRate === expected.sampleRate &&
      format.bitsPerSample === expected.bitsPerSample &&
      format.blockAlign === 2,
    "Expected decoded mono 48kHz PCM16 WAV",
  );
  requireCondition(
    pcm && pcm.length > 0 && pcm.length % 2 === 0,
    "Decoded WAV has missing or partial PCM samples",
  );
  return { pcm, format };
};

const levels = (pcm, startSample, endSample) => {
  requireCondition(
    Number.isSafeInteger(startSample) &&
      Number.isSafeInteger(endSample) &&
      startSample >= 0 &&
      endSample > startSample &&
      endSample * 2 <= pcm.length,
    "Measurement window is outside decoded audio",
  );
  let peak = 0;
  let sumSquares = 0;
  let clippedSamples = 0;
  let nonZeroSamples = 0;
  let nonSilentSamples = 0;
  const sampleThreshold = 10 ** (expected.sampleNonSilentThresholdDbfs / 20);
  for (let i = startSample; i < endSample; i++) {
    const sample = pcm.readInt16LE(i * 2);
    const value = sample / 32768;
    const absolute = Math.abs(value);
    peak = Math.max(peak, absolute);
    sumSquares += value * value;
    if (sample === -32768 || sample === 32767) clippedSamples++;
    if (sample !== 0) nonZeroSamples++;
    if (absolute > sampleThreshold) nonSilentSamples++;
  }
  const sampleCount = endSample - startSample;
  const rms = Math.sqrt(sumSquares / sampleCount);
  return {
    sampleCount,
    rmsDbfs: rms > 0 ? 20 * Math.log10(rms) : null,
    peakDbfs: peak > 0 ? 20 * Math.log10(peak) : null,
    digitalSilence: nonZeroSamples === 0,
    nonZeroSamples,
    nonSilentSamples,
    nonSilentSampleFraction: nonSilentSamples / sampleCount,
    clippedSamples,
    clippedSampleFraction: clippedSamples / sampleCount,
  };
};

try {
  const inputInfo = await stat(file);
  requireCondition(inputInfo.isFile() && inputInfo.size > 0, "MP4 is empty");
  requireCondition(
    path.extname(file).toLowerCase() === ".mp4",
    "Input must be MP4",
  );
  report.inputs.export = {
    file: path.relative(root, file),
    bytes: inputInfo.size,
    sha256: await sha256(file),
  };
  const storyboard = await loadJson("storyboard", storyboardPath);
  const manifest = await loadJson("manifest", manifestPath);
  requireCondition(
    Array.isArray(storyboard.shots) && storyboard.shots.length >= 3,
    "Storyboard must contain an introduction, news scenes and an outro",
  );
  expected.scenes = storyboard.shots.length;
  expected.newsCount = resolveNewsCount(storyboard, edition);
  requireCondition(
    storyboard.shots[0].id === "intro" &&
      storyboard.shots.at(-1).id === "outro" &&
      storyboard.shots[0].durationSeconds === 10 &&
      storyboard.shots.at(-1).durationSeconds === 10,
    "Storyboard must start and finish with 10-second intro/outro scenes",
  );
  requireCondition(
    manifest.status === "passed",
    "Voiceover manifest must be passed",
  );
  requireCondition(
    manifest.storyboardSha256 === report.inputs.storyboard.sha256,
    "Voiceover manifest does not match the current storyboard SHA256",
  );
  requireCondition(
    Array.isArray(storyboard.shots) &&
      storyboard.shots.length === expected.scenes &&
      Array.isArray(manifest.scenes) &&
      manifest.scenes.length === expected.scenes,
    `Storyboard and voiceover manifest must each contain ${expected.scenes} scenes`,
  );
  requireCondition(
    new Set(storyboard.shots.map((shot) => shot.id)).size === expected.scenes &&
      new Set(manifest.scenes.map((scene) => scene.id)).size ===
        expected.scenes,
    "Scene IDs must be unique",
  );
  let cursor = 0;
  for (const [i, shot] of storyboard.shots.entries()) {
    const scene = manifest.scenes[i];
    requireCondition(
      typeof shot.id === "string" && scene.id === shot.id,
      "Scene order differs",
    );
    requireCondition(
      finite(shot.durationSeconds) && shot.durationSeconds > 0,
      `${shot.id}: invalid scene duration`,
    );
    requireCondition(
      finite(scene.fromSeconds) && scene.fromSeconds >= 0,
      `${shot.id}: missing or invalid narration fromSeconds`,
    );
    requireCondition(
      finite(scene.durationSeconds) && scene.durationSeconds > 0,
      `${shot.id}: invalid narration duration`,
    );
    requireCondition(
      near(scene.sceneDurationSeconds, shot.durationSeconds),
      `${shot.id}: storyboard and manifest scene duration disagree`,
    );
    requireCondition(
      shot.fromSeconds === undefined ||
        near(shot.fromSeconds, scene.fromSeconds),
      `${shot.id}: storyboard and manifest narration start disagree`,
    );
    requireCondition(
      Array.isArray(shot.narration) && scene.text === shot.narration.join(""),
      `${shot.id}: voiceover manifest text differs from storyboard`,
    );
    requireCondition(
      scene.fromSeconds + scene.durationSeconds <=
        shot.durationSeconds + 0.000001,
      `${shot.id}: narration extends beyond its scene`,
    );
    const startSeconds = cursor + scene.fromSeconds;
    const endSeconds = startSeconds + scene.durationSeconds;
    report.windows.push({
      id: shot.id,
      sceneStartSeconds: cursor,
      sceneDurationSeconds: shot.durationSeconds,
      fromSeconds: scene.fromSeconds,
      narrationDurationSeconds: scene.durationSeconds,
      startSeconds,
      endSeconds,
      startSample: Math.round(startSeconds * expected.sampleRate),
      endSampleExclusive: Math.round(endSeconds * expected.sampleRate),
      status: "pending",
    });
    cursor += shot.durationSeconds;
  }
  requireCondition(
    near(cursor, expected.seconds),
    "Storyboard is not 180 seconds",
  );
  const info = JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8", windowsHide: true, shell: false, timeout: 30000 },
    ),
  );
  const audioStreams =
    info.streams?.filter((stream) => stream.codec_type === "audio") ?? [];
  requireCondition(
    audioStreams.length === 1 && audioStreams[0].codec_name === "aac",
    "Export must contain exactly one AAC audio track",
  );
  const audio = audioStreams[0];
  requireCondition(
    near(
      Number(audio.duration),
      expected.seconds,
      expected.durationToleranceSeconds,
    ),
    "AAC audio duration differs from the 180-second storyboard",
  );
  const workRoot = path.join(root, `out/${edition}-media-validation`);
  await mkdir(workRoot, { recursive: true });
  const name = path
    .basename(file, path.extname(file))
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const work = await mkdtemp(path.join(workRoot, `${name}-`));
  const wavFile = path.join(work, "export-mono-pcm16.wav");
  report.decode = {
    status: "running",
    wavFile: path.relative(root, wavFile),
    sourceCodec: audio.codec_name,
    sourceSampleRate: Number(audio.sample_rate),
    sourceChannels: audio.channels,
    sourceDurationSeconds: Number(audio.duration),
  };
  console.log(
    "Decoding the complete exported AAC track to mono 48kHz PCM16 WAV...",
  );
  execFileSync(
    ffmpeg,
    [
      "-v",
      "error",
      "-xerror",
      "-nostdin",
      "-n",
      "-i",
      file,
      "-map",
      "0:a:0",
      "-vn",
      "-c:a",
      "pcm_s16le",
      "-ar",
      String(expected.sampleRate),
      "-ac",
      "1",
      "-f",
      "wav",
      wavFile,
    ],
    { windowsHide: true, shell: false, stdio: "pipe", timeout: 300000 },
  );
  const wav = await readFile(wavFile);
  const { pcm, format } = pcmFromWav(wav);
  const decodedDurationSeconds = pcm.length / 2 / format.sampleRate;
  requireCondition(
    near(
      decodedDurationSeconds,
      expected.seconds,
      expected.durationToleranceSeconds,
    ),
    "Fully decoded audio duration differs from the 180-second storyboard",
  );
  report.decode = {
    ...report.decode,
    status: "passed",
    fullTrackDecoded: true,
    format,
    wavBytes: wav.length,
    wavSha256: createHash("sha256").update(wav).digest("hex"),
    pcmBytes: pcm.length,
    decodedDurationSeconds,
  };
  report.fullTrackLevels = levels(pcm, 0, pcm.length / 2);
  if (report.fullTrackLevels.clippedSamples !== expected.allowedClippedSamples)
    report.errors.push({
      section: "fullTrackLevels",
      message:
        "Complete decoded mono track contains full-scale clipped samples",
    });
  for (const window of report.windows) {
    try {
      Object.assign(
        window,
        levels(pcm, window.startSample, window.endSampleExclusive),
      );
      requireCondition(
        !window.digitalSilence &&
          window.nonSilentSamples > 0 &&
          window.rmsDbfs !== null &&
          window.rmsDbfs > expected.windowRmsMinimumDbfs,
        `${window.id}: exported narration window is silent or below the RMS threshold`,
      );
      requireCondition(
        window.clippedSamples === expected.allowedClippedSamples,
        `${window.id}: exported narration window contains full-scale clipped samples`,
      );
      window.status = "passed";
    } catch (error) {
      window.status = "failed";
      window.error = error.message;
      report.errors.push({
        section: "window",
        id: window.id,
        message: error.message,
      });
    }
  }
} catch (error) {
  report.errors.push({ section: "inputs_or_decode", message: error.message });
  if (report.decode.status === "running") report.decode.status = "failed";
}
report.status =
  report.errors.length === 0 &&
  report.decode.status === "passed" &&
  report.windows.length === expected.scenes &&
  report.windows.every((window) => window.status === "passed")
    ? "passed"
    : "failed";
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: report.status,
      report: path.relative(root, reportPath),
      decode: report.decode.status,
      retainedWav: report.decode.wavFile,
      narrationWindows: report.windows.length,
      passedWindows: report.windows.filter(
        (window) => window.status === "passed",
      ).length,
      rmsDbfsRange: report.windows.some((window) => finite(window.rmsDbfs))
        ? [
            Math.min(
              ...report.windows
                .filter((window) => finite(window.rmsDbfs))
                .map((window) => window.rmsDbfs),
            ),
            Math.max(
              ...report.windows
                .filter((window) => finite(window.rmsDbfs))
                .map((window) => window.rmsDbfs),
            ),
          ]
        : null,
      errors: report.errors,
    },
    null,
    2,
  ),
);
if (report.status !== "passed") process.exitCode = 1;
