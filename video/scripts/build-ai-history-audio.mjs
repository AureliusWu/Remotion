import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, open, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, "out/ai-history-render");
const output = path.join(root, "public/ai-history");
const hashFile = async (file) => {
  const hash = createHash("sha256");
  for await (const block of createReadStream(file)) hash.update(block);
  return hash.digest("hex");
};
const ffmpeg = path.join(
  root,
  "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe",
);
await mkdir(work, { recursive: true });
await mkdir(output, { recursive: true });
const header = (samples, rate) => {
  const b = Buffer.alloc(44);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + samples * 2, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(rate, 24);
  b.writeUInt32LE(rate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(samples * 2, 40);
  return b;
};
const pcmFromWav = (wav) => {
  if (
    wav.toString("ascii", 0, 4) !== "RIFF" ||
    wav.toString("ascii", 8, 12) !== "WAVE"
  )
    throw Error("Expected RIFF WAV");
  let format = false,
    pcm;
  for (let p = 12; p + 8 <= wav.length; ) {
    const n = wav.readUInt32LE(p + 4),
      id = wav.toString("ascii", p, p + 4);
    if (id === "fmt ") {
      format =
        wav.readUInt16LE(p + 8) === 1 &&
        wav.readUInt16LE(p + 10) === 1 &&
        wav.readUInt16LE(p + 22) === 16;
    }
    if (id === "data")
      pcm = wav.subarray(p + 8, Math.min(p + 8 + n, wav.length));
    p += 8 + n + (n % 2);
  }
  if (!format || !pcm || pcm.length % 2)
    throw Error("Expected mono PCM16 WAV data");
  return pcm;
};
const levels = (pcm) => {
  let peak = 0,
    sum = 0;
  for (let i = 0; i < pcm.length; i += 2) {
    const v = pcm.readInt16LE(i) / 32768;
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  return {
    peakDbfs: 20 * Math.log10(peak),
    rmsDbfs: 10 * Math.log10(sum / (pcm.length / 2)),
  };
};
const decode = (file, rate) =>
  pcmFromWav(
    execFileSync(
      ffmpeg,
      [
        "-v",
        "error",
        "-xerror",
        "-i",
        file,
        "-c:a",
        "pcm_s16le",
        "-ar",
        String(rate),
        "-ac",
        "1",
        "-f",
        "wav",
        "pipe:1",
      ],
      { windowsHide: true, maxBuffer: 300 * 1024 * 1024 },
    ),
  );

if (process.argv.includes("--music-only")) {
  const rate = 24000,
    seconds = 1800,
    count = rate * seconds;
  const samples = new Float32Array(count);
  const chords = [
    [48, 55, 60, 64],
    [45, 52, 57, 60],
    [41, 48, 53, 57],
    [43, 50, 55, 59],
  ];
  const hz = (m) => 440 * 2 ** ((m - 69) / 12),
    tau = 2 * Math.PI;
  for (let event = 0; event < 590; event++) {
    const start = 3 + event * 3;
    const chord = chords[Math.floor(event / 8) % chords.length];
    const f = hz(chord[[2, 1, 3, 1, 2, 3, 1, 0][event % 8]] + 12);
    const first = Math.floor(start * rate),
      last = Math.min(count, first + rate * 7);
    for (let n = first; n < last; n++) {
      const t = (n - first) / rate;
      const env =
        (1 - Math.exp(-30 * t)) *
        Math.exp(-t / 1.9) *
        Math.min(1, (7 - t) / 0.8);
      samples[n] +=
        0.55 * env * (Math.sin(tau * f * t) + 0.15 * Math.sin(tau * f * 2 * t));
    }
  }
  for (let event = 0; event < 90; event++) {
    const first = event * 20 * rate,
      last = Math.min(count, first + 32 * rate),
      chord = chords[event % 4];
    for (let n = first; n < last; n++) {
      const t = (n - first) / rate;
      const env = Math.min(1, t / 6) * Math.min(1, (32 - t) / 10);
      samples[n] +=
        0.06 *
        env *
        (Math.sin(tau * hz(chord[0]) * t) +
          0.45 * Math.sin(tau * hz(chord[1]) * t));
    }
  }
  let sum = 0,
    peak = 0;
  for (let n = 0; n < count; n++) {
    const t = n / rate;
    samples[n] *= Math.min(1, t / 4) * Math.min(1, (seconds - t) / 8);
    sum += samples[n] ** 2;
    peak = Math.max(peak, Math.abs(samples[n]));
  }
  const gain = Math.min(
    10 ** (-45 / 20) / Math.sqrt(sum / count),
    10 ** (-31 / 20) / peak,
  );
  const pcm = Buffer.alloc(count * 2);
  for (let n = 0; n < count; n++)
    pcm.writeInt16LE(Math.round(samples[n] * gain * 32767), n * 2);
  const wav = path.join(work, "music-original.wav"),
    mp3 = path.join(output, "music.mp3");
  await writeFile(wav, Buffer.concat([header(count, rate), pcm]));
  execFileSync(
    ffmpeg,
    [
      "-v",
      "error",
      "-y",
      "-i",
      wav,
      "-c:a",
      "libmp3lame",
      "-b:a",
      "128k",
      "-ar",
      "44100",
      mp3,
    ],
    { windowsHide: true },
  );
  const measured = levels(decode(mp3, 24000));
  const report = {
    title: "Questions Across Time",
    original: true,
    deterministic: true,
    externalSamples: [],
    durationSeconds: seconds,
    ...measured,
    source: "scripts/build-ai-history-audio.mjs --music-only",
    sha256: createHash("sha256")
      .update(await readFile(mp3))
      .digest("hex"),
  };
  await writeFile(
    path.join(output, "music-manifest.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
} else {
  const film = JSON.parse(
    await readFile(
      path.join(root, "effects/ai-history/film-data.json"),
      "utf8",
    ),
  );
  if (
    film.status !== "final" ||
    film.durationInFrames !== 108000 ||
    film.fps !== 60 ||
    film.shots.length !== 60
  )
    throw Error("Final 1800-second film data required");
  const rate = 48000,
    total = 1800 * rate;
  const inputFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        film,
        sourceAudio: await Promise.all(
          film.shots.map(async (s) => [
            s.audioFile,
            await hashFile(path.join(root, "public", s.audioFile)),
          ]),
        ),
        builder: await hashFile(fileURLToPath(import.meta.url)),
      }),
    )
    .digest("hex");
  try {
    const cached = JSON.parse(
      await readFile(path.join(work, "audio-master-validation.json"), "utf8"),
    );
    if (
      cached.status === "passed" &&
      cached.inputFingerprint === inputFingerprint &&
      (await stat(path.join(work, "narration.wav"))).size === 44 + total * 2 &&
      cached.wavSha256 === (await hashFile(path.join(work, "narration.wav")))
    ) {
      console.log("Reused verified 1800-second narration master");
      process.exit(0);
    }
  } catch {
    /* A missing or changed master is rebuilt from the checked source clips. */
  }
  const file = await open(path.join(work, "narration.tmp.wav"), "w");
  const report = {
    checkedAt: new Date().toISOString(),
    status: "running",
    sampleRate: rate,
    durationSeconds: 1800,
    inputFingerprint,
    scenes: [],
  };
  let sampleCursor = 0;
  try {
    await file.write(header(total, rate));
    for (const shot of film.shots) {
      const pcm = decode(path.join(root, "public", shot.audioFile), rate);
      const prefix = Math.round(shot.fromSeconds * rate),
        slot = (shot.durationInFrames * rate) / 60;
      if (!Number.isInteger(slot) || prefix + pcm.length / 2 > slot)
        throw Error(`Audio exceeds shot ${shot.id}`);
      if ((shot.startFrame * rate) / 60 !== sampleCursor)
        throw Error(`Timeline gap in ${shot.id}`);
      const measured = levels(pcm);
      if (!(measured.rmsDbfs > -45 && measured.peakDbfs < 0))
        throw Error(`Audio level out of bounds: ${shot.id}`);
      await file.write(Buffer.alloc(prefix * 2));
      await file.write(pcm);
      await file.write(Buffer.alloc((slot - prefix - pcm.length / 2) * 2));
      sampleCursor += slot;
      report.scenes.push({
        id: shot.id,
        audioDurationSeconds: pcm.length / 2 / rate,
        slotSeconds: slot / rate,
        prefixSeconds: prefix / rate,
        tailSeconds: (slot - prefix - pcm.length / 2) / rate,
        ...measured,
      });
      console.log(`Master audio ${report.scenes.length}/60: ${shot.id}`);
    }
    if (sampleCursor !== total)
      throw Error("Master audio does not cover exactly 1800 seconds");
    report.status = "passed";
  } finally {
    await file.close();
  }
  const { rename } = await import("node:fs/promises");
  await rename(
    path.join(work, "narration.tmp.wav"),
    path.join(work, "narration.wav"),
  );
  report.wavSha256 = await hashFile(path.join(work, "narration.wav"));
  report.sizeBytes = (await stat(path.join(work, "narration.wav"))).size;
  await writeFile(
    path.join(work, "audio-master-validation.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log("Exact 1800-second narration master ready");
}
