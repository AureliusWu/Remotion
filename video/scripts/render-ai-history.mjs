import { bundle } from "@remotion/bundler";
import {
  getCompositions,
  makeCancelSignal,
  openBrowser,
  renderMedia,
} from "@remotion/renderer";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// Run from any directory. Partial chapter exports never count as cache hits.
//   node scripts/render-ai-history.mjs
//   node scripts/render-ai-history.mjs --chapters=01,02
//   node scripts/render-ai-history.mjs --mux-only
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(root, "effects", "ai-history");
const outputDir = path.join(root, "out", "ai-history-render");
const stateFile = path.join(outputDir, "render-state.json");
const finalFile = path.join(root, "out", "ai-history-1080p60.mp4");
const binaries = path.join(
  root,
  "node_modules",
  "@remotion",
  "compositor-win32-x64-msvc",
);
const ffmpeg = path.join(binaries, "ffmpeg.exe");
const ffprobe = path.join(binaries, "ffprobe.exe");
const expected = { width: 1920, height: 1080, fps: 60 };
const totalSeconds = 1800;
const totalFrames = totalSeconds * expected.fps;
const mediaOptions = {
  codec: "h264",
  videoBitrate: "4M",
  pixelFormat: "yuv420p",
  imageFormat: "jpeg",
  jpegQuality: 90,
  concurrency: 4,
  muted: true,
  hardwareAcceleration: "required",
};
const parameters = {
  // Bump this when changing render behavior not already covered by these fields.
  version: "ai-history-nvenc-h264-v2",
  ...expected,
  ...mediaOptions,
  bundler: "rspack",
};
const commonFiles = [
  "effects/ai-history/Diagrams.tsx",
  "effects/ai-history/SpecialDiagrams.tsx",
  "effects/ai-history/HistoryScene.tsx",
  "effects/ai-history/HistoryCaptions.tsx",
  "effects/ai-history/palette.ts",
  "effects/ai-history/types.ts",
  "effects/ai-history/AiHistoryFilm.tsx",
  "src/index.ts",
  "src/Root.tsx",
  "package-lock.json",
];
let state;
let activeChapter;
let childProcess;
let cancelRender;
let interrupted;

const now = () => new Date().toISOString();
const sha = (value) => createHash("sha256").update(value).digest("hex");
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};
const readJson = async (file) =>
  JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
const fileHash = async (file) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
};
const assertRunning = () => {
  if (interrupted) throw new Error(`Interrupted by ${interrupted}`);
};
const positiveInteger = (number) => Number.isSafeInteger(number) && number > 0;
const rational = (value) => {
  const [numerator, denominator = 1] = String(value).split("/").map(Number);
  return denominator ? numerator / denominator : NaN;
};

async function saveState() {
  state.updatedAt = now();
  const temporary = `${stateFile}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`);
  await rename(temporary, stateFile);
}

async function loadInputs(requestedChapters = null) {
  const film = await readJson(path.join(contentDir, "film-data.json"));
  const timeline = await readJson(
    path.join(contentDir, "chapter-timeline.json"),
  );
  const chapters = Array.isArray(timeline) ? timeline : timeline.chapters;
  const allowedPartial =
    film.status === "partial" &&
    requestedChapters?.length > 0 &&
    Array.isArray(film.readyChapters) &&
    requestedChapters.every((id) => film.readyChapters.includes(id));
  if (
    (film.status !== "final" && !allowedPartial) ||
    film.fps !== expected.fps ||
    film.durationInFrames !== totalFrames ||
    !Array.isArray(film.shots) ||
    !Array.isArray(chapters) ||
    chapters.length !== 15
  ) {
    throw new Error(
      "Expected final 1800s / 60fps film data, or explicit --chapters whose IDs are all readyChapters in partial data; layout drafts cannot be exported",
    );
  }
  let cursor = 0;
  const shotIds = new Set();
  for (const shot of film.shots) {
    if (
      typeof shot.id !== "string" ||
      shotIds.has(shot.id) ||
      !/^\d{2}$/.test(shot.chapterId) ||
      !positiveInteger(shot.durationInFrames) ||
      shot.startFrame !== cursor ||
      !Array.isArray(shot.captions)
    ) {
      throw new Error(`Invalid or non-contiguous shot: ${shot.id}`);
    }
    shotIds.add(shot.id);
    cursor += shot.durationInFrames;
  }
  if (cursor !== totalFrames)
    throw new Error("Shot durations do not total 1800s");
  cursor = 0;
  for (const [index, chapter] of chapters.entries()) {
    const id = String(index + 1).padStart(2, "0");
    const shots = film.shots.filter((shot) => shot.chapterId === id);
    if (
      chapter.id !== id ||
      chapter.composition !== `AiHistoryChapter${id}` ||
      !positiveInteger(chapter.durationInFrames) ||
      chapter.startFrame !== cursor ||
      !shots.length ||
      shots[0].startFrame !== cursor ||
      shots.reduce((sum, shot) => sum + shot.durationInFrames, 0) !==
        chapter.durationInFrames ||
      shots.some(
        (shot) =>
          shot.startFrame < cursor ||
          shot.startFrame + shot.durationInFrames >
            cursor + chapter.durationInFrames,
      )
    ) {
      throw new Error(`Invalid chapter timeline or shot membership: ${id}`);
    }
    cursor += chapter.durationInFrames;
  }
  if (cursor !== totalFrames)
    throw new Error("Chapter durations do not total 1800s");
  const sources = await Promise.all(
    commonFiles.map(async (file) => ({
      file,
      sha256: await fileHash(path.join(root, file)),
    })),
  );
  const plans = await Promise.all(
    chapters
      .filter(
        (chapter) =>
          !requestedChapters || requestedChapters.includes(chapter.id),
      )
      .map(async (chapter) => {
        const shots = film.shots.filter(
          (shot) => shot.chapterId === chapter.id,
        );
        const generatedFiles = [
          `effects/ai-history/chapters/Chapter${chapter.id}.tsx`,
          ...film.shots.flatMap((shot, index) =>
            shot.chapterId === chapter.id
              ? [
                  `effects/ai-history/shots/Shot${String(index + 1).padStart(2, "0")}.tsx`,
                ]
              : [],
          ),
        ];
        const generatedSources = await Promise.all(
          generatedFiles.map(async (file) => ({
            file,
            sha256: await fileHash(path.join(root, file)),
          })),
        );
        const fingerprint = sha(
          canonical({ chapter, shots, sources, generatedSources, parameters }),
        );
        return {
          ...chapter,
          fingerprint,
          generatedSources,
          file: path.join(outputDir, `chapter-${chapter.id}.mp4`),
        };
      }),
  );
  return { film, chapters, sources, plans, requestedChapters };
}

async function assertInputsUnchanged(inputs) {
  // Other chapters may become ready while a selected chapter is rendering.
  // Only its own shots and source dependencies determine whether it changed.
  const current = await loadInputs(inputs.requestedChapters);
  if (
    canonical(current.plans.map((plan) => plan.fingerprint)) !==
    canonical(inputs.plans.map((plan) => plan.fingerprint))
  ) {
    throw new Error(
      "Film data, timeline or source changed during this run; rerun to resume",
    );
  }
}

async function runProcess(executable, args, { label, capture = false } = {}) {
  assertRunning();
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    childProcess = child;
    let stdout = "";
    let stderr = "";
    let pendingLine = "";
    const progress = { frame: 0, seconds: 0 };
    const timer = label
      ? setInterval(() => {
          console.log(
            `[${label}] frame=${progress.frame}, media=${progress.seconds.toFixed(2)}s (FFmpeg reported)`,
          );
        }, 10_000)
      : undefined;
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      if (capture) stdout += chunk;
      if (!label) return;
      const lines = `${pendingLine}${chunk}`.split(/\r?\n/);
      pendingLine = lines.pop() ?? "";
      for (const line of lines) {
        const [key, value] = line.split("=");
        if (key === "frame" && Number.isFinite(Number(value)))
          progress.frame = Number(value);
        if (key === "out_time_us" && Number.isFinite(Number(value)))
          progress.seconds = Number(value) / 1_000_000;
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr = `${stderr}${chunk}`.slice(-64_000);
    });
    const cleanup = () => {
      clearInterval(timer);
      if (childProcess === child) childProcess = undefined;
    };
    child.once("error", (error) => {
      cleanup();
      reject(error);
    });
    child.once("close", (code, signal) => {
      cleanup();
      if (code !== 0) {
        reject(
          new Error(
            `${path.basename(executable)} exited ${code ?? signal}: ${stderr.trim()}`,
          ),
        );
      } else {
        resolve(stdout);
      }
    });
  });
}

async function probe(file) {
  return JSON.parse(
    await runProcess(
      ffprobe,
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { capture: true },
    ),
  );
}

function checkVideo(info, frames, pureVideo) {
  const videos = info.streams?.filter(
    (stream) => stream.codec_type === "video",
  );
  const audios = info.streams?.filter(
    (stream) => stream.codec_type === "audio",
  );
  const video = videos?.[0];
  if (
    videos?.length !== 1 ||
    (pureVideo && audios?.length !== 0) ||
    video.codec_name !== "h264" ||
    video.width !== expected.width ||
    video.height !== expected.height ||
    rational(video.avg_frame_rate) !== expected.fps ||
    rational(video.r_frame_rate) !== expected.fps ||
    Number(video.nb_frames) !== frames ||
    !Number.isFinite(Number(video.duration)) ||
    Math.abs(Number(video.duration) - frames / expected.fps) >
      1 / expected.fps + 0.000_001
  ) {
    throw new Error(
      `Video must be H.264 1920x1080 60fps, ${frames} frames${pureVideo ? ", with no audio" : ""}`,
    );
  }
  return {
    codec: video.codec_name,
    width: video.width,
    height: video.height,
    fps: rational(video.avg_frame_rate),
    frames: Number(video.nb_frames),
    durationSeconds: Number(video.duration),
    pixelFormat: video.pix_fmt,
    profile: video.profile,
    level: video.level,
    timeBase: video.time_base,
  };
}

async function cacheResult(plan) {
  const record = state.chapters[plan.id];
  if (record?.status !== "complete")
    return { reusable: false, reason: "not completed" };
  if (record.fingerprint !== plan.fingerprint)
    return { reusable: false, reason: "input fingerprint changed" };
  try {
    const details = await stat(plan.file);
    if (!details.isFile() || !details.size || details.size !== record.sizeBytes)
      throw new Error("file size differs from successful export");
    if ((await fileHash(plan.file)) !== record.sha256)
      throw new Error("file checksum differs from successful export");
    const metadata = checkVideo(
      await probe(plan.file),
      plan.durationInFrames,
      true,
    );
    return { reusable: true, metadata };
  } catch (error) {
    assertRunning();
    return { reusable: false, reason: error.message };
  }
}

function checkComposition(composition, frames, id) {
  if (
    !composition ||
    composition.width !== expected.width ||
    composition.height !== expected.height ||
    composition.fps !== expected.fps ||
    composition.durationInFrames !== frames
  ) {
    throw new Error(
      `Composition ${id} does not match the final timeline and 1080p60`,
    );
  }
}

async function renderChapter(plan, composition, serveUrl, browser) {
  assertRunning();
  activeChapter = plan.id;
  const temporary = path.join(outputDir, `chapter-${plan.id}.partial.mp4`);
  const record = {
    status: "rendering",
    fingerprint: plan.fingerprint,
    composition: plan.composition,
    durationInFrames: plan.durationInFrames,
    output: relative(plan.file),
    partialOutput: relative(temporary),
    startedAt: now(),
    progress: { renderedFrames: 0, encodedFrames: 0 },
  };
  state.chapters[plan.id] = record;
  await saveState();
  const progressLog = () => {
    const progress = record.progress;
    console.log(
      `[chapter ${plan.id}] rendered=${progress.renderedFrames}/${plan.durationInFrames}, encoded=${progress.encodedFrames}/${plan.durationInFrames}`,
    );
  };
  console.log(
    `[chapter ${plan.id}] rendering; fingerprint=${plan.fingerprint}`,
  );
  const timer = setInterval(progressLog, 10_000);
  const cancellation = makeCancelSignal();
  cancelRender = cancellation.cancel;
  try {
    await renderMedia({
      ...mediaOptions,
      composition,
      serveUrl,
      inputProps: {},
      outputLocation: temporary,
      overwrite: true,
      puppeteerInstance: browser,
      binariesDirectory: binaries,
      cancelSignal: cancellation.cancelSignal,
      logLevel: "error",
      onProgress: (progress) => {
        record.progress = {
          renderedFrames: progress.renderedFrames,
          encodedFrames: progress.encodedFrames,
          stitchStage: progress.stitchStage,
          updatedAt: now(),
        };
      },
    });
    assertRunning();
    const metadata = checkVideo(
      await probe(temporary),
      plan.durationInFrames,
      true,
    );
    const digest = await fileHash(temporary);
    const details = await stat(temporary);
    await rename(temporary, plan.file);
    Object.assign(record, {
      status: "complete",
      completedAt: now(),
      validatedAt: now(),
      metadata,
      sizeBytes: details.size,
      sha256: digest,
    });
    delete record.partialOutput;
    await saveState();
    progressLog();
    console.log(
      `[chapter ${plan.id}] complete; fingerprint=${plan.fingerprint}`,
    );
    activeChapter = undefined;
  } finally {
    clearInterval(timer);
    cancelRender = undefined;
  }
}

async function concatenateAndMux(inputs) {
  assertRunning();
  await assertInputsUnchanged(inputs);
  const metadata = [];
  for (const plan of inputs.plans) {
    const result = await cacheResult(plan);
    if (!result.reusable) {
      throw new Error(
        `Chapter ${plan.id} cannot be concatenated: ${result.reason}`,
      );
    }
    metadata.push(result.metadata);
  }
  // Copy concatenation requires compatible encoded streams and timestamp bases.
  const signature = ({
    codec,
    width,
    height,
    fps,
    pixelFormat,
    profile,
    level,
    timeBase,
  }) =>
    canonical({
      codec,
      width,
      height,
      fps,
      pixelFormat,
      profile,
      level,
      timeBase,
    });
  if (metadata.some((item) => signature(item) !== signature(metadata[0])))
    throw new Error(
      "Chapter stream formats differ; rerender incompatible chapters before copy-concat",
    );
  const narration = path.join(outputDir, "narration.wav");
  const narrationInfo = await probe(narration);
  const audioStreams = narrationInfo.streams?.filter(
    (stream) => stream.codec_type === "audio",
  );
  const voice = audioStreams?.[0];
  const voiceSeconds =
    voice?.duration_ts !== undefined
      ? Number(voice.duration_ts) * rational(voice.time_base)
      : Number(voice?.duration ?? narrationInfo.format?.duration);
  if (
    audioStreams?.length !== 1 ||
    Number(voice.sample_rate) !== 48_000 ||
    voice.channels !== 1 ||
    !Number.isFinite(voiceSeconds) ||
    Math.abs(voiceSeconds - totalSeconds) > 1 / 48_000
  ) {
    throw new Error(
      "narration.wav must contain exactly 1800s of 48kHz mono audio",
    );
  }
  const list = path.join(outputDir, "chapters.ffconcat");
  await writeFile(
    list,
    `ffconcat version 1.0\n${inputs.plans
      .map((plan) => `file 'chapter-${plan.id}.mp4'`)
      .join("\n")}\n`,
  );
  const videoOnly = path.join(outputDir, "video-only.mp4");
  const videoTemporary = path.join(outputDir, "video-only.partial.mp4");
  state.stage = "concatenating";
  await saveState();
  await runProcess(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      list,
      "-map",
      "0:v:0",
      "-an",
      "-c:v",
      "copy",
      "-movflags",
      "+faststart",
      "-progress",
      "pipe:1",
      "-nostats",
      videoTemporary,
    ],
    { label: "concat" },
  );
  const videoMetadata = checkVideo(
    await probe(videoTemporary),
    totalFrames,
    true,
  );
  await rename(videoTemporary, videoOnly);
  state.concatenation = {
    status: "complete",
    output: relative(videoOnly),
    metadata: videoMetadata,
    completedAt: now(),
  };
  state.stage = "muxing";
  await saveState();
  const music = path.join(root, "public", "ai-history", "music.mp3");
  const hasMusic = await stat(music)
    .then((entry) => entry.isFile())
    .catch((error) => {
      if (error.code === "ENOENT") return false;
      throw error;
    });
  const finalTemporary = path.join(
    root,
    "out",
    "ai-history-1080p60.partial.mp4",
  );
  const muxArgs = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-i",
    videoOnly,
    "-i",
    narration,
  ];
  if (hasMusic) {
    muxArgs.push(
      "-stream_loop",
      "-1",
      "-i",
      music,
      "-filter_complex",
      "[1:a]aresample=48000[voice];[2:a]aresample=48000[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix]",
      "-map",
      "0:v:0",
      "-map",
      "[mix]",
    );
  } else {
    muxArgs.push("-map", "0:v:0", "-map", "1:a:0", "-af", "aresample=48000");
  }
  muxArgs.push(
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-ar",
    "48000",
    "-ac",
    "2",
    "-t",
    String(totalSeconds),
    "-movflags",
    "+faststart",
    "-progress",
    "pipe:1",
    "-nostats",
    finalTemporary,
  );
  await runProcess(ffmpeg, muxArgs, { label: "mux" });
  assertRunning();
  const finalInfo = await probe(finalTemporary);
  const finalVideo = checkVideo(finalInfo, totalFrames, false);
  const finalAudioStreams = finalInfo.streams.filter(
    (stream) => stream.codec_type === "audio",
  );
  const finalAudio = finalAudioStreams[0];
  if (
    finalAudioStreams.length !== 1 ||
    finalAudio?.codec_name !== "aac" ||
    Number(finalAudio.sample_rate) !== 48_000 ||
    finalAudio.channels !== 2 ||
    !Number.isFinite(Number(finalAudio.duration)) ||
    Math.abs(Number(finalAudio.duration) - totalSeconds) > 0.1
  ) {
    throw new Error("Final audio does not match AAC / 48kHz / stereo / 1800s");
  }
  await assertInputsUnchanged(inputs);
  const digest = await fileHash(finalTemporary);
  const details = await stat(finalTemporary);
  await rename(finalTemporary, finalFile);
  state.final = {
    status: "complete",
    output: relative(finalFile),
    sha256: digest,
    sizeBytes: details.size,
    video: finalVideo,
    audio: {
      codec: "aac",
      sampleRate: 48_000,
      channels: 2,
      durationSeconds: Number(finalAudio.duration),
    },
    narration: relative(narration),
    music: hasMusic ? relative(music) : null,
    completedAt: now(),
  };
  await saveState();
  console.log(`Final export: ${finalFile}\nSHA256: ${digest}`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      chapters: { type: "string" },
      "mux-only": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (values.help) {
    console.log(
      "Usage: node scripts/render-ai-history.mjs [--chapters=01,02 | --mux-only]\n" +
        "Default: resume all 15 chapters, concatenate, then mux narration.wav and optional music.mp3.\n" +
        "--chapters: render/reuse only these chapters; skip concatenation and final mux.\n" +
        "--mux-only: validate all chapter caches and concatenate/mux without bundling or rendering.",
    );
    return;
  }
  if (values.chapters !== undefined && values["mux-only"])
    throw new Error("--chapters and --mux-only are mutually exclusive");
  const requested = values.chapters?.split(",").map((id) => {
    const trimmed = id.trim();
    if (
      !/^\d{1,2}$/.test(trimmed) ||
      Number(trimmed) < 1 ||
      Number(trimmed) > 15
    )
      throw new Error(`Invalid chapter: ${id}`);
    return trimmed.padStart(2, "0");
  });
  if (requested && new Set(requested).size !== requested.length)
    throw new Error("Duplicate chapter IDs in --chapters");
  await mkdir(outputDir, { recursive: true });
  for (const executable of [ffmpeg, ffprobe]) await stat(executable);
  const inputs = await loadInputs(requested ?? null);
  const previous = await readJson(stateFile).catch((error) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (previous && previous.schemaVersion !== 1)
    throw new Error(
      "Unsupported render-state.json schema; preserve it separately before starting a new cache",
    );
  state = {
    schemaVersion: 1,
    ...previous,
    parameters,
    commonSources: inputs.sources,
    status: "running",
    stage: values["mux-only"] ? "validating" : "rendering",
    startedAt: now(),
    requestedChapters:
      requested ?? inputs.chapters.map((chapter) => chapter.id),
    chapters: previous?.chapters ?? {},
    error: null,
  };
  await saveState();
  const interrupt = (signal) => {
    interrupted = signal;
    console.error(
      `Received ${signal}; saving the last completed chapter and progress.`,
    );
    cancelRender?.();
    childProcess?.kill();
  };
  const onSigint = () => interrupt("SIGINT");
  const onSigterm = () => interrupt("SIGTERM");
  process.on("SIGINT", onSigint);
  process.on("SIGTERM", onSigterm);
  let browser;
  try {
    const plans = inputs.plans.filter(
      (plan) => !requested || requested.includes(plan.id),
    );
    const pending = [];
    for (const plan of plans) {
      const result = await cacheResult(plan);
      if (result.reusable) {
        state.chapters[plan.id].validatedAt = now();
        console.log(
          `[chapter ${plan.id}] reuse complete; fingerprint=${plan.fingerprint}`,
        );
      } else if (values["mux-only"]) {
        throw new Error(
          `--mux-only needs a valid chapter ${plan.id}: ${result.reason}`,
        );
      } else {
        console.log(
          `[chapter ${plan.id}] needs render: ${result.reason}; fingerprint=${plan.fingerprint}`,
        );
        pending.push(plan);
      }
    }
    await saveState();
    if (pending.length) {
      console.log(
        `Bundling once with rspack for ${pending.length} chapter(s)...`,
      );
      const serveUrl = await bundle({
        entryPoint: path.join(root, "src", "index.ts"),
        outDir: path.join(outputDir, "bundle"),
        rspack: true,
      });
      assertRunning();
      browser = await openBrowser("chrome", { logLevel: "error" });
      const compositions = await getCompositions({
        serveUrl,
        inputProps: {},
        puppeteerInstance: browser,
        logLevel: "error",
      });
      checkComposition(
        compositions.find((item) => item.id === "AiHistory30m"),
        totalFrames,
        "AiHistory30m",
      );
      for (const plan of inputs.plans)
        checkComposition(
          compositions.find((item) => item.id === plan.composition),
          plan.durationInFrames,
          plan.composition,
        );
      await assertInputsUnchanged(inputs);
      for (const plan of pending) {
        await assertInputsUnchanged(inputs);
        const composition = compositions.find(
          (item) => item.id === plan.composition,
        );
        await renderChapter(plan, composition, serveUrl, browser);
      }
    }
    if (browser) {
      await browser.close({ silent: true });
      browser = undefined;
    }
    if (!requested) await concatenateAndMux(inputs);
    await assertInputsUnchanged(inputs);
    state.status = "complete";
    state.stage = requested ? "chapters-complete" : "complete";
    state.completedAt = now();
    await saveState();
    console.log(
      `Completed chapter(s): ${plans.map((plan) => plan.id).join(", ")}`,
    );
    if (requested)
      console.log(
        "Chapter selection finished; full-film concatenation and mux skipped.",
      );
  } finally {
    process.off("SIGINT", onSigint);
    process.off("SIGTERM", onSigterm);
    if (browser) {
      await browser.close({ silent: true }).catch((error) => {
        console.error(`Browser cleanup: ${error.message}`);
      });
    }
  }
}

try {
  await main();
} catch (error) {
  if (state) {
    state.status = interrupted ? "interrupted" : "failed";
    state.error = { message: error.message, stack: error.stack, at: now() };
    if (activeChapter && state.chapters[activeChapter]?.status !== "complete") {
      Object.assign(state.chapters[activeChapter], {
        status: state.status,
        error: error.message,
        failedAt: now(),
      });
    }
    await saveState().catch((saveError) => {
      console.error(`Could not save render state: ${saveError.message}`);
    });
  }
  console.error(error.stack ?? error.message);
  process.exitCode = interrupted === "SIGINT" ? 130 : interrupted ? 143 : 1;
}
