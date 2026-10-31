import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { before, test } from "node:test";
import { getMediaTools, mediaPackageFor } from "../lib/media-tools.mjs";
import {
  assertAtmosEvidence,
  assertAudioProfile,
  compressedAudioTrackSha256,
} from "../lib/media-profiles.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const { ffmpeg, ffprobe } = getMediaTools();
let work, pcm16, pcm24, standard;
const probe = (file) =>
  JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8", windowsHide: true, shell: false },
    ),
  );
const run = (args) =>
  execFileSync(ffmpeg, ["-v", "error", "-xerror", "-nostdin", "-y", ...args], {
    stdio: "pipe",
    windowsHide: true,
    shell: false,
  });
const verify = (file, seconds, fps, extra = []) =>
  spawnSync(
    process.execPath,
    [
      path.join(root, "scripts/verify-export.mjs"),
      file,
      String(seconds),
      String(fps),
      ...extra,
    ],
    { encoding: "utf8", windowsHide: true, shell: false },
  );

const tone = (file, bits, seconds) => {
  const rate = 48000,
    channels = 2,
    bytesPerSample = bits / 8;
  const pcmBytes = rate * seconds * channels * bytesPerSample;
  const wav = Buffer.alloc(44 + pcmBytes);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + pcmBytes, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * channels * bytesPerSample, 28);
  wav.writeUInt16LE(channels * bytesPerSample, 32);
  wav.writeUInt16LE(bits, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(pcmBytes, 40);
  for (let sample = 0; sample < rate * seconds; sample++) {
    const value = Math.round(
      Math.sin((sample * Math.PI * 2 * 440) / rate) *
        0.08 *
        (2 ** (bits - 1) - 1),
    );
    for (let channel = 0; channel < channels; channel++)
      wav.writeIntLE(
        value,
        44 + (sample * channels + channel) * bytesPerSample,
        bytesPerSample,
      );
  }
  writeFileSync(file, wav);
};

before(() => {
  mkdirSync(path.join(root, "out/media-profile-tests"), { recursive: true });
  work = mkdtempSync(path.join(root, "out/media-profile-tests/run-"));
  const tone16 = path.join(work, "tone16.wav"),
    tone24 = path.join(work, "tone24.wav");
  tone(tone16, 16, 6);
  tone(tone24, 24, 1);
  const source = path.join(root, "../examples/smoke-test.mp4");
  standard = path.join(work, "legacy-standard.mp4");
  run([
    "-i",
    source,
    "-i",
    tone16,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-t",
    "6",
    standard,
  ]);
  for (const [bits, audio] of [
    [16, tone16],
    [24, tone24],
  ]) {
    const output = path.join(work, `pcm${bits}.mov`);
    run([
      "-i",
      source,
      "-i",
      audio,
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-t",
      "1",
      "-vf",
      "scale=320:180",
      "-r",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-c:a",
      `pcm_s${bits}le`,
      output,
    ]);
    if (bits === 16) pcm16 = output;
    else pcm24 = output;
  }
});

test("installed binary resolution and all renderer-supported platform package names", () => {
  assert.match(ffmpeg, /ffmpeg(?:\.exe)?$/);
  assert.match(ffprobe, /ffprobe(?:\.exe)?$/);
  for (const [platform, arch, libc, name] of [
    ["win32", "x64", undefined, "win32-x64-msvc"],
    ["darwin", "x64", undefined, "darwin-x64"],
    ["darwin", "arm64", undefined, "darwin-arm64"],
    ["linux", "x64", "gnu", "linux-x64-gnu"],
    ["linux", "x64", "musl", "linux-x64-musl"],
    ["linux", "arm64", "gnu", "linux-arm64-gnu"],
    ["linux", "arm64", "musl", "linux-arm64-musl"],
  ])
    assert.equal(
      mediaPackageFor(platform, arch, libc),
      `@remotion/compositor-${name}`,
    );
  assert.throws(() => mediaPackageFor("win32", "arm64"), /Unsupported/);
  assert.throws(() => mediaPackageFor("linux", "x64"), /unknown libc/);
});

test("legacy three-positional CLI still validates standard AAC and decodes the full small fixture", () => {
  const result = verify(standard, 6, 30);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const report = JSON.parse(
    readFileSync(`${standard}.validation.json`, "utf8"),
  );
  assert.equal(report.profile, "standard");
  assert.equal(report.fullDecode, "passed");
  assert.equal(report.video.width, 1920);
  assert.equal(report.audio.codec, "aac");
});

test("real PCM16 MOV is rejected by the 24-bit profile", () => {
  const result = verify(pcm16, 1, 30, ["320", "180", "--profile=hires-pcm"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /hires-pcm requires pcm_s24le/);
});

test("real stereo 48kHz PCM24 MOV passes metadata and complete decode", () => {
  const result = verify(pcm24, 1, 30, ["320", "180", "--profile=hires-pcm"]);
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const report = JSON.parse(readFileSync(`${pcm24}.validation.json`, "utf8"));
  assert.equal(report.status, "passed");
  assert.equal(report.fullDecode, "passed");
  assert.equal(report.audio.codec, "pcm_s24le");
  assert.equal(report.audio.bitsPerSample, 24);
  assert.equal(report.audio.sampleRate, 48000);
  assert.equal(report.audio.channels, 2);
});

test("the same otherwise-valid PCM24 media fails the wrong requested dimensions", () => {
  const result = verify(pcm24, 1, 30, ["180", "320", "--profile=hires-pcm"]);
  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /180x320 H\.264/);
  assert.equal(
    JSON.parse(readFileSync(`${pcm24}.validation.json`, "utf8")).status,
    "failed",
  );
});

test("Atmos cannot be inferred from an AAC mix or EAC3 channel labels alone", () => {
  assert.throws(
    () =>
      assertAudioProfile(
        probe(standard).streams.find((s) => s.codec_type === "audio"),
        { seconds: 6, profile: "atmos" },
      ),
    /atmos requires E-AC-3/,
  );
  const eac3 = {
    index: 1,
    codec_name: "eac3",
    duration: "1",
    channels: 6,
    bit_rate: "640000",
  };
  assertAudioProfile(eac3, { seconds: 1, profile: "atmos" });
  assert.throws(
    () =>
      assertAtmosEvidence({ audio: eac3, audioTrackSha256: "a".repeat(64) }),
    /JOC is NOT VERIFIED/,
  );
  const evidenceFile = path.join(work, "self-claimed-atmos.json");
  writeFileSync(
    evidenceFile,
    JSON.stringify({
      schema: "remotion-atmos-qc/v1",
      audioStreamIndex: 1,
      audioTrackSha256: "a".repeat(64),
      joc: true,
    }),
  );
  assert.throws(
    () =>
      assertAtmosEvidence({
        evidenceFile,
        audio: eac3,
        audioTrackSha256: "a".repeat(64),
      }),
    /self-declared joc flag/,
  );
  assert.throws(
    () =>
      assertAtmosEvidence({
        evidenceFile,
        audio: eac3,
        audioTrackSha256: "b".repeat(64),
      }),
    /SHA256 mismatch/,
  );
});

test("compressed audio SHA is based on actual demuxed bytes and survives remuxing", () => {
  const sourceAudio = probe(standard).streams.find(
    (s) => s.codec_type === "audio",
  );
  const beforeHash = compressedAudioTrackSha256(standard, sourceAudio, ffprobe);
  const remux = path.join(work, "audio-only.mov");
  run(["-i", standard, "-map", "0:a:0", "-vn", "-c:a", "copy", remux]);
  const audio = probe(remux).streams.find((s) => s.codec_type === "audio");
  assert.equal(compressedAudioTrackSha256(remux, audio, ffprobe), beforeHash);
});

test("a passed external-QC label does not hide an original report explicitly saying No JOC", () => {
  const originalFile = path.join(work, "not-atmos-qc.txt");
  const original = Buffer.from(
    "Dolby Stream Validator 1.2\nAudio Track: Codec: EC3, Channels: 6, Language: und, No JOC\nValidation result: PASSED\n",
  );
  writeFileSync(originalFile, original);
  const evidenceFile = path.join(work, "mislabelled-atmos.json");
  writeFileSync(
    evidenceFile,
    JSON.stringify({
      schema: "remotion-atmos-qc/v1",
      audioStreamIndex: 1,
      audioTrackSha256: "a".repeat(64),
      qc: {
        tool: "Dolby Stream Validator",
        version: "1.2",
        status: "passed",
        originalReportFile: path.basename(originalFile),
        originalReportSha256: createHash("sha256")
          .update(original)
          .digest("hex"),
      },
    }),
  );
  assert.throws(
    () =>
      assertAtmosEvidence({
        evidenceFile,
        audio: { index: 1 },
        audioTrackSha256: "a".repeat(64),
      }),
    /missing JOC/,
  );
});
