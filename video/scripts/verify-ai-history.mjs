import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Verifies existing assets only. No rendering, synthesis, or asset modification.
// Usage: node scripts/verify-ai-history.mjs [--export=out/ai-history-1080p60.mp4]
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const filenames = {
  film: path.join(root, "effects/ai-history/film-data.json"),
  storyboard: path.join(root, "effects/ai-history/storyboard.json"),
  manifest: path.join(root, "public/ai-history/voiceover-manifest.json"),
};
const reportPath = path.join(
  root,
  "out/ai-history-render/content-audio-validation.json",
);
const binaries = path.join(
  root,
  "node_modules/@remotion/compositor-win32-x64-msvc",
);
const ffprobe = path.join(binaries, "ffprobe.exe");
const ffmpeg = path.join(binaries, "ffmpeg.exe");
const expected = {
  fps: 60,
  frames: 108000,
  seconds: 1800,
  chapters: 15,
  framesPerChapter: 7200,
  scenes: 60,
  scenesPerChapter: 4,
  captionsPerScene: 4,
  sources: 61,
  mp3DurationToleranceSeconds: 0.01,
  exportDurationToleranceSeconds: 0.1,
  // Speech sources measure about -23.45 dBFS; this excludes music-only windows (~-45 dBFS).
  rmsMinimumDbfs: -36,
  peakMaximumExclusiveDbfs: 0,
};
const report = {
  checkedAt: new Date().toISOString(),
  script: "scripts/verify-ai-history.mjs",
  status: "running",
  expected,
  inputs: {},
  content: { status: "pending" },
  voiceover: { status: "pending", scenes: [] },
  exportAudio: { status: "not_requested" },
  errors: [],
};

const requireCondition = (condition, message) => {
  if (!condition) throw new Error(message);
};
const finite = (n) => typeof n === "number" && Number.isFinite(n);
const near = (a, b, tolerance = 0.00001) =>
  finite(a) && finite(b) && Math.abs(a - b) <= tolerance;
const equalArray = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length === b.length &&
  a.every((item, i) => item === b[i]);
const sha256 = async (file) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};
const loadJson = async (name) => {
  const bytes = await readFile(filenames[name]);
  report.inputs[name] = {
    file: path.relative(root, filenames[name]),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  return JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
};
const probe = (file) =>
  JSON.parse(
    execFileSync(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      {
        encoding: "utf8",
        windowsHide: true,
        timeout: 30000,
        maxBuffer: 4 * 1024 * 1024,
      },
    ),
  );
const probeDuration = (audio, info) => {
  const streamDuration = Number(audio.duration);
  const containerDuration = Number(info.format?.duration);
  const duration =
    Number.isFinite(streamDuration) && streamDuration > 0
      ? streamDuration
      : containerDuration;
  requireCondition(
    Number.isFinite(duration) && duration > 0,
    "ffprobe has no positive audio duration",
  );
  return {
    durationSeconds: duration,
    streamDurationSeconds: Number.isFinite(streamDuration)
      ? streamDuration
      : null,
    containerDurationSeconds: Number.isFinite(containerDuration)
      ? containerDuration
      : null,
  };
};

const checkCaptions = (captions, narration, limit, label) => {
  requireCondition(
    Array.isArray(captions) && captions.length === expected.captionsPerScene,
    `${label}: exactly four captions required`,
  );
  requireCondition(
    Array.isArray(narration) && narration.length === expected.captionsPerScene,
    `${label}: exactly four narration lines required`,
  );
  let previousEnd = 0;
  for (const [i, caption] of captions.entries()) {
    requireCondition(
      caption.text === narration[i],
      `${label}: caption ${i + 1} does not exactly match the original narration`,
    );
    requireCondition(
      finite(caption.startSeconds) && finite(caption.endSeconds),
      `${label}: caption ${i + 1} has invalid timestamps`,
    );
    requireCondition(
      caption.startSeconds >= 0 && caption.endSeconds > caption.startSeconds,
      `${label}: caption ${i + 1} has an invalid interval`,
    );
    requireCondition(
      caption.startSeconds + 0.000001 >= previousEnd,
      `${label}: caption ${i + 1} overlaps its predecessor`,
    );
    requireCondition(
      caption.endSeconds <= limit + 0.000001,
      `${label}: caption ${i + 1} exceeds its scene`,
    );
    previousEnd = caption.endSeconds;
  }
};

const validateContent = (film, storyboard) => {
  requireCondition(
    film.status === "final",
    `film-data status must be final, got ${film.status}`,
  );
  requireCondition(
    film.fps === expected.fps && film.durationInFrames === expected.frames,
    "film-data must be exactly 108000 frames at 60fps",
  );
  requireCondition(
    storyboard.fps === expected.fps &&
      storyboard.requestedSeconds === expected.seconds,
    "storyboard must request 1800 seconds at 60fps",
  );
  requireCondition(
    Array.isArray(storyboard.chapters) &&
      storyboard.chapters.length === expected.chapters,
    "storyboard must contain 15 chapters",
  );
  requireCondition(
    Array.isArray(storyboard.sources) &&
      storyboard.sources.length === expected.sources,
    `storyboard must contain ${expected.sources} sources`,
  );
  const sources = new Set(storyboard.sources.map((s) => s.id));
  requireCondition(
    sources.size === expected.sources && !sources.has(undefined),
    "source IDs must be present and unique",
  );
  requireCondition(
    Array.isArray(film.shots) && film.shots.length === expected.scenes,
    "film-data must contain 60 shots",
  );
  requireCondition(
    Array.isArray(storyboard.shots) &&
      storyboard.shots.length === expected.scenes,
    "storyboard must contain 60 flat shots",
  );
  const chapterIds = Array.from({ length: expected.chapters }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );
  requireCondition(
    equalArray(
      storyboard.chapters.map((c) => c.id),
      chapterIds,
    ),
    "storyboard chapter IDs must run from 01 through 15 in order",
  );
  if (film.readyChapters !== undefined)
    requireCondition(
      equalArray(film.readyChapters, chapterIds),
      "final film must mark all 15 chapters ready",
    );
  const chapterScenes = storyboard.chapters.flatMap((chapter) => {
    requireCondition(
      Array.isArray(chapter.scenes) &&
        chapter.scenes.length === expected.scenesPerChapter,
      `${chapter.id}: exactly four storyboard scenes required`,
    );
    return chapter.scenes;
  });
  const ids = new Set();
  let cursor = 0;
  const chapters = [];
  const scenes = [];
  for (const [i, shot] of film.shots.entries()) {
    const chapterId = chapterIds[Math.floor(i / expected.scenesPerChapter)];
    const expectedId = `${chapterId}-${String((i % expected.scenesPerChapter) + 1).padStart(2, "0")}`;
    const original = storyboard.shots[i];
    requireCondition(
      shot.id === expectedId &&
        original.id === expectedId &&
        chapterScenes[i].id === expectedId,
      `${expectedId}: scene IDs or sequence disagree`,
    );
    requireCondition(!ids.has(shot.id), `${shot.id}: duplicate scene ID`);
    ids.add(shot.id);
    requireCondition(
      shot.chapterId === chapterId && original.chapterId === chapterId,
      `${shot.id}: wrong chapter association`,
    );
    requireCondition(
      equalArray(original.narration, chapterScenes[i].narration),
      `${shot.id}: nested and flat storyboard narration disagree`,
    );
    requireCondition(
      equalArray(shot.narration, original.narration),
      `${shot.id}: film narration differs from storyboard`,
    );
    requireCondition(
      Array.isArray(original.sourceIds) && original.sourceIds.length > 0,
      `${shot.id}: source references required`,
    );
    requireCondition(
      equalArray(shot.sourceIds, original.sourceIds),
      `${shot.id}: film and storyboard source references differ`,
    );
    for (const id of original.sourceIds)
      requireCondition(sources.has(id), `${shot.id}: unknown source ${id}`);
    requireCondition(
      equalArray(chapterScenes[i].sourceIds, original.sourceIds),
      `${shot.id}: nested source references disagree`,
    );
    requireCondition(
      Number.isInteger(shot.startFrame) && shot.startFrame === cursor,
      `${shot.id}: startFrame ${shot.startFrame} is not continuous with ${cursor}`,
    );
    requireCondition(
      Number.isInteger(shot.durationInFrames) && shot.durationInFrames > 0,
      `${shot.id}: invalid frame duration`,
    );
    requireCondition(
      finite(shot.fromSeconds) && shot.fromSeconds >= 0,
      `${shot.id}: invalid audio start offset`,
    );
    requireCondition(
      finite(shot.audioDurationSeconds) && shot.audioDurationSeconds > 0,
      `${shot.id}: invalid audio metadata duration`,
    );
    const slotSeconds = shot.durationInFrames / film.fps;
    requireCondition(
      shot.fromSeconds + shot.audioDurationSeconds <= slotSeconds + 0.000001,
      `${shot.id}: audio exceeds its scene`,
    );
    requireCondition(
      shot.audioReady === true && typeof shot.audioFile === "string",
      `${shot.id}: final audio is not ready`,
    );
    checkCaptions(shot.captions, original.narration, slotSeconds, shot.id);
    cursor += shot.durationInFrames;
    scenes.push({
      id: shot.id,
      chapterId,
      startFrame: shot.startFrame,
      endFrameExclusive: cursor,
      durationInFrames: shot.durationInFrames,
      captionCount: shot.captions.length,
      captionTextExact: true,
      captionsNonoverlappingAndWithinScene: true,
      sourceIds: shot.sourceIds,
    });
    if ((i + 1) % expected.scenesPerChapter === 0) {
      const chapterStart =
        Number(chapterId) * expected.framesPerChapter -
        expected.framesPerChapter;
      const chapterEnd = Number(chapterId) * expected.framesPerChapter;
      requireCondition(
        film.shots[i - 3].startFrame === chapterStart && cursor === chapterEnd,
        `${chapterId}: chapter must cover exactly 7200 continuous frames`,
      );
      chapters.push({
        id: chapterId,
        startFrame: chapterStart,
        endFrameExclusive: cursor,
        durationInFrames: expected.framesPerChapter,
      });
    }
  }
  requireCondition(
    cursor === expected.frames,
    "last shot does not end at frame 108000",
  );
  report.content = {
    status: "passed",
    fps: film.fps,
    durationInFrames: cursor,
    sourceCount: sources.size,
    chapters,
    scenes,
  };
};

const validateVoiceover = async (film, storyboard, manifest) => {
  requireCondition(
    manifest.status === "passed",
    `voiceover manifest status must be passed, got ${manifest.status}`,
  );
  requireCondition(
    Array.isArray(manifest.scenes) &&
      manifest.scenes.length === expected.scenes,
    "voiceover manifest must contain 60 scenes",
  );
  requireCondition(
    manifest.storyboardSha256 === report.inputs.storyboard.sha256,
    "voiceover manifest storyboard SHA256 does not match current storyboard bytes",
  );
  const metadata = new Map(manifest.scenes.map((s) => [s.id, s]));
  requireCondition(
    metadata.size === expected.scenes,
    "voiceover scene IDs are not unique",
  );
  requireCondition(
    equalArray(
      manifest.scenes.map((s) => s.id).sort(),
      film.shots.map((s) => s.id).sort(),
    ),
    "voiceover scene IDs do not match the final film",
  );
  report.voiceover = {
    status: "running",
    metadataStatus: manifest.status,
    scenes: [],
  };
  for (const [i, shot] of film.shots.entries()) {
    const item = { id: shot.id, status: "running" };
    report.voiceover.scenes.push(item);
    try {
      const meta = metadata.get(shot.id);
      const original = storyboard.shots[i];
      requireCondition(
        meta.text === original.narration.join(""),
        `${shot.id}: manifest text differs from original narration`,
      );
      requireCondition(
        finite(meta.durationSeconds) && meta.durationSeconds > 0,
        `${shot.id}: invalid manifest duration`,
      );
      requireCondition(
        near(shot.audioDurationSeconds, meta.durationSeconds),
        `${shot.id}: film and manifest audio durations disagree`,
      );
      requireCondition(
        meta.file === `${shot.id}.mp3`,
        `${shot.id}: unexpected voiceover asset filename`,
      );
      const file = path.resolve(path.dirname(filenames.manifest), meta.file);
      const filmFile = path.resolve(root, "public", shot.audioFile);
      requireCondition(
        file === filmFile && path.extname(file).toLowerCase() === ".mp3",
        `${shot.id}: film and manifest must reference the same MP3`,
      );
      requireCondition(
        meta.fullDecodePassed === true &&
          meta.audioMeasurement?.fullDecodePassed === true,
        `${shot.id}: prior full-decode evidence missing from manifest`,
      );
      // Manifest timestamps are audio-local; film captions include fromSeconds.
      // Their tail may intentionally remain visible after speech, but never beyond the scene.
      checkCaptions(
        meta.captions,
        original.narration,
        shot.durationInFrames / film.fps - shot.fromSeconds,
        `${shot.id} manifest`,
      );
      for (const [j, caption] of shot.captions.entries()) {
        requireCondition(
          near(
            caption.startSeconds,
            meta.captions[j].startSeconds + shot.fromSeconds,
          ) &&
            near(
              caption.endSeconds,
              meta.captions[j].endSeconds + shot.fromSeconds,
            ),
          `${shot.id}: caption ${j + 1} does not match manifest plus timeline offset`,
        );
      }
      const fileInfo = await stat(file);
      requireCondition(
        fileInfo.isFile() && fileInfo.size > 0,
        `${shot.id}: MP3 is missing or empty`,
      );
      requireCondition(
        fileInfo.size === meta.bytes,
        `${shot.id}: MP3 byte count differs from manifest`,
      );
      const digest = await sha256(file);
      requireCondition(
        typeof meta.sha256 === "string" &&
          /^[a-f\d]{64}$/i.test(meta.sha256) &&
          digest === meta.sha256.toLowerCase(),
        `${shot.id}: MP3 SHA256 mismatch`,
      );
      const info = probe(file);
      const audioStreams =
        info.streams?.filter((s) => s.codec_type === "audio") ?? [];
      requireCondition(
        audioStreams.length === 1,
        `${shot.id}: exactly one actual audio stream required`,
      );
      const audio = audioStreams[0];
      requireCondition(
        audio.codec_name === "mp3" &&
          Number(audio.sample_rate) > 0 &&
          audio.channels > 0,
        `${shot.id}: ffprobe did not identify a valid MP3 audio stream`,
      );
      const measured = probeDuration(audio, info);
      requireCondition(
        near(
          measured.durationSeconds,
          meta.durationSeconds,
          expected.mp3DurationToleranceSeconds,
        ),
        `${shot.id}: ffprobe duration differs from manifest`,
      );
      if (measured.containerDurationSeconds !== null)
        requireCondition(
          near(
            measured.containerDurationSeconds,
            meta.durationSeconds,
            expected.mp3DurationToleranceSeconds,
          ),
          `${shot.id}: MP3 container duration differs from manifest`,
        );
      Object.assign(item, {
        status: "passed",
        file: path.relative(root, file),
        bytes: fileInfo.size,
        sha256: digest,
        codec: audio.codec_name,
        sampleRate: Number(audio.sample_rate),
        channels: audio.channels,
        metadataDurationSeconds: meta.durationSeconds,
        ...measured,
        durationDifferenceSeconds:
          measured.durationSeconds - meta.durationSeconds,
        originalTextAndCaptionsExact: true,
        captionOffsetSeconds: shot.fromSeconds,
        captionTailBeyondAudioSeconds: Math.max(
          0,
          meta.captions.at(-1).endSeconds - meta.durationSeconds,
        ),
      });
    } catch (error) {
      item.status = "failed";
      item.error = error.message;
      report.errors.push({
        section: "voiceover",
        id: shot.id,
        error: error.message,
      });
    }
  }
  const sum = manifest.scenes.reduce(
    (total, s) => total + s.durationSeconds,
    0,
  );
  requireCondition(
    near(sum, manifest.totalAudioSeconds, 0.01),
    "manifest totalAudioSeconds does not match its scene durations",
  );
  if (film.audioSeconds !== undefined)
    requireCondition(
      near(sum, film.audioSeconds, 0.01),
      "film audioSeconds does not match manifest scene durations",
    );
  report.voiceover.totalAudioSeconds = sum;
  report.voiceover.status = report.voiceover.scenes.every(
    (s) => s.status === "passed",
  )
    ? "passed"
    : "failed";
};

// FFmpeg writes unknown RIFF/data lengths as 0xffffffff on a pipe. Clamp each
// chunk to the bytes actually received, rather than trusting the length field.
const pcmFromWav = (wav) => {
  requireCondition(
    wav.length >= 12 &&
      wav.toString("ascii", 0, 4) === "RIFF" &&
      wav.toString("ascii", 8, 12) === "WAVE",
    "decoded audio must be RIFF WAV",
  );
  let format;
  let pcm;
  let declaredDataBytes;
  for (let offset = 12; offset + 8 <= wav.length; ) {
    const id = wav.toString("ascii", offset, offset + 4);
    const declared = wav.readUInt32LE(offset + 4);
    const start = offset + 8;
    const available = Math.min(declared, wav.length - start);
    if (id === "fmt ") {
      requireCondition(available >= 16, "truncated WAV fmt chunk");
      const tag = wav.readUInt16LE(start);
      const pcmTag =
        tag === 1 ||
        (tag === 0xfffe &&
          available >= 40 &&
          wav.readUInt32LE(start + 24) === 1);
      format = {
        pcm: pcmTag,
        channels: wav.readUInt16LE(start + 2),
        sampleRate: wav.readUInt32LE(start + 4),
        blockAlign: wav.readUInt16LE(start + 12),
        bitsPerSample: wav.readUInt16LE(start + 14),
      };
    }
    if (id === "data") {
      requireCondition(!pcm, "multiple WAV data chunks are not supported");
      declaredDataBytes = declared;
      pcm = wav.subarray(start, start + available);
    }
    if (declared > wav.length - start) {
      requireCondition(id === "data", `truncated WAV ${id} chunk`);
      break;
    }
    offset = start + declared + (declared % 2);
  }
  requireCondition(
    format?.pcm &&
      format.channels === 1 &&
      format.sampleRate === 48000 &&
      format.bitsPerSample === 16 &&
      format.blockAlign === 2,
    "expected decoded 48kHz mono PCM16 WAV",
  );
  requireCondition(
    pcm && pcm.length > 0 && pcm.length % 2 === 0,
    "missing or partial PCM16 samples",
  );
  return { pcm, format, declaredDataBytes, actualDataBytes: pcm.length };
};

const levels = (pcm, startSample, endSample) => {
  requireCondition(
    Number.isInteger(startSample) &&
      Number.isInteger(endSample) &&
      startSample >= 0 &&
      endSample > startSample &&
      endSample * 2 <= pcm.length,
    "invalid decoded audio window",
  );
  let peak = 0;
  let sum = 0;
  let clippedSamples = 0;
  for (let i = startSample; i < endSample; i++) {
    const sample = pcm.readInt16LE(i * 2);
    const value = sample / 32768;
    peak = Math.max(peak, Math.abs(value));
    sum += value * value;
    if (sample === -32768 || sample === 32767) clippedSamples++;
  }
  const rms = Math.sqrt(sum / (endSample - startSample));
  return {
    sampleCount: endSample - startSample,
    rmsDbfs: rms > 0 ? 20 * Math.log10(rms) : null,
    peakDbfs: peak > 0 ? 20 * Math.log10(peak) : null,
    clippedSamples,
  };
};

const validateExportAudio = (input, film) => {
  const file = path.resolve(root, input);
  const info = probe(file);
  const audioStreams =
    info.streams?.filter((s) => s.codec_type === "audio") ?? [];
  requireCondition(
    audioStreams.length === 1 && audioStreams[0].codec_name === "aac",
    "export must contain exactly one AAC audio stream",
  );
  const audio = audioStreams[0];
  const measured = probeDuration(audio, info);
  requireCondition(
    near(
      measured.durationSeconds,
      expected.seconds,
      expected.exportDurationToleranceSeconds,
    ),
    "actual AAC stream duration differs from 1800s by more than 0.1s",
  );
  console.log(
    "Decoding the complete exported AAC track to 48kHz mono PCM WAV...",
  );
  const wav = execFileSync(
    ffmpeg,
    [
      "-v",
      "error",
      "-xerror",
      "-nostdin",
      "-i",
      file,
      "-map",
      "0:a:0",
      "-vn",
      "-c:a",
      "pcm_s16le",
      "-ar",
      "48000",
      "-ac",
      "1",
      "-f",
      "wav",
      "pipe:1",
    ],
    { windowsHide: true, maxBuffer: 256 * 1024 * 1024 },
  );
  const decoded = pcmFromWav(wav);
  const decodedDurationSeconds =
    decoded.pcm.length / 2 / decoded.format.sampleRate;
  requireCondition(
    near(
      decodedDurationSeconds,
      expected.seconds,
      expected.exportDurationToleranceSeconds,
    ),
    "full decoded AAC duration differs from 1800s by more than 0.1s",
  );
  report.exportAudio = {
    status: "running",
    file: path.relative(root, file),
    codec: audio.codec_name,
    ...measured,
    fullAudioDecode: "passed",
    decodedFormat: decoded.format,
    decodedDurationSeconds,
    declaredWavDataBytes: decoded.declaredDataBytes,
    actualWavDataBytes: decoded.actualDataBytes,
    windows: [],
  };
  for (const shot of film.shots) {
    const startSeconds = shot.startFrame / film.fps + shot.fromSeconds;
    const endSeconds = startSeconds + shot.audioDurationSeconds;
    const startSample = Math.round(startSeconds * 48000);
    const endSample = Math.round(endSeconds * 48000);
    const item = {
      id: shot.id,
      startSeconds,
      endSeconds,
      startSample,
      endSample,
      status: "running",
    };
    report.exportAudio.windows.push(item);
    try {
      Object.assign(item, levels(decoded.pcm, startSample, endSample));
      requireCondition(
        item.rmsDbfs !== null && item.rmsDbfs > expected.rmsMinimumDbfs,
        `${shot.id}: exported narration window is silent or too quiet`,
      );
      requireCondition(
        item.peakDbfs !== null &&
          item.peakDbfs < expected.peakMaximumExclusiveDbfs &&
          item.clippedSamples === 0,
        `${shot.id}: exported narration window reaches full scale / clips`,
      );
      item.status = "passed";
    } catch (error) {
      item.status = "failed";
      item.error = error.message;
      report.errors.push({
        section: "exportAudio",
        id: shot.id,
        error: error.message,
      });
    }
  }
  report.exportAudio.status = report.exportAudio.windows.every(
    (w) => w.status === "passed",
  )
    ? "passed"
    : "failed";
};

try {
  const args = process.argv.slice(2);
  requireCondition(
    args.every((arg) => arg.startsWith("--export=")) && args.length <= 1,
    "Usage: node scripts/verify-ai-history.mjs [--export=FILE]",
  );
  const exportFile = args[0]?.slice("--export=".length);
  requireCondition(
    args.length === 0 || exportFile.length > 0,
    "--export requires a filename",
  );
  const film = await loadJson("film");
  const storyboard = await loadJson("storyboard");
  const manifest = await loadJson("manifest");
  for (const [section, action] of [
    ["content", () => validateContent(film, storyboard)],
    ["voiceover", () => validateVoiceover(film, storyboard, manifest)],
  ]) {
    try {
      await action();
    } catch (error) {
      report[section].status = "failed";
      report.errors.push({ section, error: error.message });
    }
  }
  if (exportFile) {
    try {
      requireCondition(
        report.content.status === "passed",
        "valid final content is required before measuring export windows",
      );
      validateExportAudio(exportFile, film);
    } catch (error) {
      report.exportAudio.status = "failed";
      report.errors.push({ section: "exportAudio", error: error.message });
    }
  }
} catch (error) {
  report.errors.push({ section: "inputs", error: error.message });
}
report.status = report.errors.length === 0 ? "passed" : "failed";
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: report.status,
      report: path.relative(root, reportPath),
      content: report.content.status,
      voiceover: report.voiceover.status,
      checkedMp3s: report.voiceover.scenes.length,
      exportAudio: report.exportAudio.status,
      narrationWindows: report.exportAudio.windows?.length ?? 0,
      errors: report.errors,
    },
    null,
    2,
  ),
);
if (report.status !== "passed") process.exitCode = 1;
