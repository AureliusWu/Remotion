import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const [input, secondsArg, fpsArg, widthArg, heightArg] = args;
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
const positiveInteger = (value) =>
  positive(value) && Number.isSafeInteger(Number(value));
if (
  !input ||
  !positive(secondsArg) ||
  !positive(fpsArg) ||
  ![3, 5].includes(args.length) ||
  (args.length === 5 &&
    (!positiveInteger(widthArg) || !positiveInteger(heightArg)))
)
  throw new Error(
    "Usage: node scripts/verify-export.mjs FILE SECONDS FPS [WIDTH HEIGHT]; dimensions must be positive integers",
  );
const file = path.resolve(root, input);
const seconds = Number(secondsArg);
const fps = Number(fpsArg);
const width = widthArg === undefined ? 1920 : Number(widthArg);
const height = heightArg === undefined ? 1080 : Number(heightArg);
const binaries = path.join(
  root,
  "node_modules/@remotion/compositor-win32-x64-msvc",
);
const info = JSON.parse(
  execFileSync(
    path.join(binaries, "ffprobe.exe"),
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
    { encoding: "utf8", windowsHide: true },
  ),
);
const video = info.streams.find((stream) => stream.codec_type === "video");
const audio = info.streams.find((stream) => stream.codec_type === "audio");
const rational = (value) => {
  const [a, b = 1] = value.split("/").map(Number);
  return a / b;
};
if (
  !video ||
  video.width !== width ||
  video.height !== height ||
  video.codec_name !== "h264" ||
  rational(video.avg_frame_rate) !== fps ||
  Number(video.nb_frames) !== seconds * fps ||
  Math.abs(Number(video.duration) - seconds) > 1 / fps
)
  throw new Error(
    `Exported video does not match the requested ${width}x${height} H.264 frame rate, frame count or duration`,
  );
if (
  !audio ||
  audio.codec_name !== "aac" ||
  Math.abs(Number(audio.duration) - seconds) > 0.1
)
  throw new Error("Exported AAC audio is missing or has the wrong duration");
console.log(`Decoding the complete ${seconds}s MP4...`);
execFileSync(
  path.join(binaries, "ffmpeg.exe"),
  [
    "-v",
    "error",
    "-xerror",
    "-i",
    file,
    "-c:v",
    "rawvideo",
    "-c:a",
    "pcm_s16le",
    "-f",
    "null",
    "-",
  ],
  { stdio: "pipe", windowsHide: true },
);
const hash = createHash("sha256");
for await (const chunk of createReadStream(file)) hash.update(chunk);
const report = {
  file: path.basename(file),
  checkedAt: new Date().toISOString(),
  status: "passed",
  video: {
    width: video.width,
    height: video.height,
    codec: video.codec_name,
    fps: rational(video.avg_frame_rate),
    frames: Number(video.nb_frames),
    durationSeconds: Number(video.duration),
    pixelFormat: video.pix_fmt,
    colorRange: video.color_range,
  },
  audio: {
    codec: audio.codec_name,
    durationSeconds: Number(audio.duration),
    sampleRate: Number(audio.sample_rate),
    channels: audio.channels,
  },
  sizeBytes: Number(info.format.size),
  sha256: hash.digest("hex"),
  fullDecode: "passed",
};
await writeFile(
  `${file}.validation.json`,
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
