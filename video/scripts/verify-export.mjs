import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { getMediaTools } from "./lib/media-tools.mjs";
import {
  AUDIO_PROFILES,
  assertAudioProfile,
  assertAtmosEvidence,
  assertVideoProfile,
  compressedAudioTrackSha256,
  rational,
} from "./lib/media-profiles.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    profile: { type: "string", default: "standard" },
    "atmos-evidence": { type: "string" },
  },
});
const [input, secondsArg, fpsArg, widthArg, heightArg] = positionals;
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const positiveInteger = (value) =>
  positive(value) && Number.isSafeInteger(Number(value));
if (
  !input ||
  !positive(secondsArg) ||
  !positive(fpsArg) ||
  ![3, 5].includes(positionals.length) ||
  (positionals.length === 5 &&
    (!positiveInteger(widthArg) || !positiveInteger(heightArg))) ||
  !AUDIO_PROFILES.includes(values.profile)
) {
  throw new Error(
    "Usage: node scripts/verify-export.mjs FILE SECONDS FPS [WIDTH HEIGHT] [--profile=standard|hires-pcm|atmos] [--atmos-evidence=JSON]; dimensions must be positive integers",
  );
}
if (values["atmos-evidence"] && values.profile !== "atmos")
  throw new Error("--atmos-evidence is only valid with --profile=atmos");
const file = path.resolve(root, input);
const expected = {
  seconds: Number(secondsArg),
  fps: Number(fpsArg),
  width: widthArg === undefined ? 1920 : Number(widthArg),
  height: heightArg === undefined ? 1080 : Number(heightArg),
};
const report = {
  file: path.basename(file),
  checkedAt: new Date().toISOString(),
  status: "running",
  profile: values.profile,
  expected,
  fullDecode: "pending",
};
try {
  const { ffmpeg, ffprobe } = getMediaTools();
  const info = JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8", windowsHide: true, shell: false },
    ),
  );
  const video = info.streams?.find((stream) => stream.codec_type === "video");
  const audio = info.streams?.find((stream) => stream.codec_type === "audio");
  assertVideoProfile(video, expected);
  assertAudioProfile(audio, {
    seconds: expected.seconds,
    profile: values.profile,
  });
  if (values.profile === "atmos") {
    if (!values["atmos-evidence"])
      throw new Error(
        "Atmos JOC is NOT VERIFIED: --atmos-evidence=JSON with original external Dolby QC is required; codec/channel labels are insufficient",
      );
    const audioTrackSha256 = compressedAudioTrackSha256(file, audio, ffprobe);
    report.atmosEvidence = assertAtmosEvidence({
      evidenceFile: path.resolve(root, values["atmos-evidence"]),
      audio,
      audioTrackSha256,
    });
  }
  console.log(
    `Decoding the complete ${expected.seconds}s media (${values.profile})...`,
  );
  execFileSync(
    ffmpeg,
    [
      "-v",
      "error",
      "-xerror",
      "-nostdin",
      "-i",
      file,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0",
      "-c:v",
      "rawvideo",
      "-c:a",
      values.profile === "hires-pcm" ? "pcm_s24le" : "pcm_s16le",
      "-f",
      "null",
      "-",
    ],
    { stdio: "pipe", windowsHide: true, shell: false },
  );
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  report.video = {
    width: video.width,
    height: video.height,
    codec: video.codec_name,
    fps: rational(video.avg_frame_rate),
    frames: Number(video.nb_frames),
    durationSeconds: Number(video.duration),
    pixelFormat: video.pix_fmt,
    colorRange: video.color_range,
  };
  report.audio = {
    codec: audio.codec_name,
    durationSeconds: Number(audio.duration),
    sampleRate: Number(audio.sample_rate),
    channels: audio.channels,
    bitsPerSample:
      Number(audio.bits_per_raw_sample) ||
      Number(audio.bits_per_sample) ||
      null,
    bitRate: Number(audio.bit_rate) || null,
  };
  if (values.profile === "hires-pcm")
    report.audio.precisionScope =
      "Declared delivered PCM precision; this does not establish the effective resolution of source recordings or a Hi-Res certification.";
  report.sizeBytes = Number(info.format.size);
  report.sha256 = hash.digest("hex");
  report.fullDecode = "passed";
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.message;
  if (report.fullDecode === "pending") report.fullDecode = "not_passed";
  process.exitCode = 1;
}
await writeFile(
  `${file}.validation.json`,
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
