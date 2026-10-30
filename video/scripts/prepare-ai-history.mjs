import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format, resolveConfig } from "prettier";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const folder = path.join(root, "effects/ai-history");
const readJson = async (file) =>
  JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
const writeChanged = async (file, text) => {
  let old;
  try {
    old = await readFile(file, "utf8");
  } catch {}
  if (old !== text) await writeFile(file, text);
};
const saveJson = async (file, value) =>
  writeChanged(file, JSON.stringify(value, null, 2) + "\n");
const mode = process.argv[2];
const formatting = await resolveConfig(folder);
const writeCode = async (file, code) =>
  writeChanged(
    file,
    await format(code, { ...formatting, parser: "typescript" }),
  );
if (mode === "merge") {
  const parts = await Promise.all(
    ["a", "b"].map((p) =>
      readJson(path.join(folder, `content-part-${p}.json`)),
    ),
  );
  const chapters = parts
    .flatMap((p) => p.chapters)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (
    chapters.length !== 15 ||
    chapters.some(
      (c, i) =>
        c.id !== String(i + 1).padStart(2, "0") || c.scenes.length !== 4,
    )
  )
    throw Error("Expected 15 sequential chapters with 4 shots each");
  const sourceMap = new Map();
  for (const source of parts.flatMap((p) => p.sources)) {
    if (sourceMap.has(source.id) && sourceMap.get(source.id).url !== source.url)
      throw Error(`Conflicting source ${source.id}`);
    sourceMap.set(source.id, source);
  }
  const shots = chapters.flatMap((chapter) =>
    chapter.scenes.map((scene) => ({
      ...scene,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      era: chapter.era,
    })),
  );
  if (new Set(shots.map((s) => s.id)).size !== 60)
    throw Error("Shot IDs must be unique");
  for (const shot of shots) {
    if (
      !shot.narration?.length ||
      shot.sourceIds.some((id) => !sourceMap.has(id))
    )
      throw Error(`Missing narration/source in ${shot.id}`);
  }
  const storyboard = {
    title: "从提问到共创：人工智能发展历程",
    asOf: "2026-10-29",
    fps: 60,
    requestedSeconds: 1800,
    chapters,
    shots,
    sources: [...sourceMap.values()],
  };
  await saveJson(path.join(folder, "storyboard.json"), storyboard);
  const text = shots.flatMap((s) => s.narration).join("");
  console.log(
    JSON.stringify(
      {
        shots: shots.length,
        chapters: chapters.length,
        characters: text.length,
        hanCharacters: (text.match(/\p{Script=Han}/gu) ?? []).length,
        sources: sourceMap.size,
      },
      null,
      2,
    ),
  );
  let script = `# ${storyboard.title}\n\n资料核验截至 ${storyboard.asOf}。旁白、取舍与图形均为本工程原创编排。\n\n`;
  for (const chapter of chapters) {
    script += `## ${chapter.id} ${chapter.title}（${chapter.era}）\n\n`;
    for (const shot of chapter.scenes) {
      script += `### ${shot.id} ${shot.title}\n\n${shot.narration.join("\n\n")}\n\n资料：${shot.sourceIds.join(" / ")}\n\n`;
    }
  }
  script +=
    "## 原始资料索引\n\n" +
    storyboard.sources
      .map((s) => `- **${s.id}**：[${s.title}](${s.url})。${s.note ?? ""}`)
      .join("\n") +
    "\n";
  await writeFile(path.join(root, "../docs/AI-HISTORY-SCRIPT.md"), script);
} else if (mode === "assemble" || mode === "progress") {
  const story = await readJson(path.join(folder, "storyboard.json"));
  const voice = await readJson(
    path.join(root, "public/ai-history/voiceover-manifest.json"),
  );
  const voiceMap = new Map(voice.scenes.map((s) => [s.id, s]));
  const readyChapters = story.chapters
    .filter((c) => c.scenes.every((s) => voiceMap.has(s.id)))
    .map((c) => c.id);
  const final = readyChapters.length === 15;
  if (mode === "assemble" && !final)
    throw Error(
      `Only ${readyChapters.length}/15 chapters have final narration`,
    );
  const fps = 60,
    total = 1800 * fps;
  const shots = story.shots.map((s) => {
    const v = voiceMap.get(s.id);
    const audioDurationSeconds = v?.durationSeconds ?? 27;
    const fromSeconds = 0.7;
    return {
      ...s,
      audioFile: `ai-history/${v?.file ?? s.id + ".mp3"}`,
      audioDurationSeconds,
      audioReady: Boolean(v),
      fromSeconds,
      captions: (
        v?.captions ??
        s.narration.map((text, i) => ({
          text,
          startSeconds: i * 6.7,
          endSeconds: i * 6.7 + 6.5,
        }))
      ).map((c) => ({
        ...c,
        startSeconds: c.startSeconds + fromSeconds,
        endSeconds: c.endSeconds + fromSeconds,
      })),
      durationInFrames: Math.ceil(
        (fromSeconds + audioDurationSeconds + 0.6) * fps,
      ),
      sourceText:
        s.id === "15-04"
          ? "完整稿件与来源：配套工程文档｜AI辅助制作 · Kokoro v1.1-zh 本地旁白 · 原创配乐"
          : s.sourceIds
              .map((id) => story.sources.find((r) => r.id === id).title)
              .join(" · "),
    };
  });
  const audioSeconds = shots
    .filter((s) => s.audioReady)
    .reduce((n, s) => n + s.audioDurationSeconds, 0);
  if (final && audioSeconds < 1500)
    throw Error(
      `Narration only ${audioSeconds.toFixed(1)}s; improve density or voice pacing before assembling 1800s`,
    );
  for (const chapter of story.chapters) {
    const members = shots.filter((s) => s.chapterId === chapter.id);
    const base = members.reduce((n, s) => n + s.durationInFrames, 0);
    if (base > 7200)
      throw Error(
        `Chapter ${chapter.id} exceeds its 120s budget by ${((base - 7200) / fps).toFixed(2)}s; revise before rendering`,
      );
    const spare = 7200 - base;
    const weights = members.map((s) =>
      ["network", "attention", "learning", "logic"].includes(s.visual)
        ? 1.35
        : 1,
    );
    const weightSum = weights.reduce((a, b) => a + b, 0);
    let distributed = 0;
    members.forEach((shot, i) => {
      const extra =
        i === members.length - 1
          ? spare - distributed
          : Math.floor((spare * weights[i]) / weightSum);
      shot.durationInFrames += extra;
      distributed += extra;
    });
  }
  let cursor = 0;
  shots.forEach((s) => {
    s.startFrame = cursor;
    cursor += s.durationInFrames;
    if (s.captions.some((c) => c.endSeconds > s.durationInFrames / fps))
      throw Error(`Caption overflow ${s.id}`);
  });
  if (cursor !== total) throw Error("Frame allocation failed");
  const data = {
    status: final ? "final" : "partial",
    readyChapters,
    title: story.title,
    fps,
    durationInFrames: total,
    asOf: story.asOf,
    audioSeconds,
    narrationCoverage: audioSeconds / 1800,
    shots,
  };
  await saveJson(path.join(folder, "film-data.json"), data);
  await mkdir(path.join(folder, "shots"), { recursive: true });
  await mkdir(path.join(folder, "chapters"), { recursive: true });
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i],
      name = `Shot${String(i + 1).padStart(2, "0")}`;
    const code = `import {Audio} from '@remotion/media';\nimport {AbsoluteFill,Composition,staticFile,useVideoConfig} from 'remotion';\nimport {HistoryScene} from '../HistoryScene';\nimport {HistoryCaptions} from '../HistoryCaptions';\nexport const ${name}=()=>{const {fps}=useVideoConfig();return <AbsoluteFill><HistoryScene sceneIndex={${i}}/><Audio name=${JSON.stringify(s.title + "旁白")} src={staticFile(${JSON.stringify(s.audioFile)})} from={0.7*fps} premountFor={fps}/><HistoryCaptions sceneIndex={${i}}/></AbsoluteFill>;};\nexport const ${name}Composition=()=><Composition id=${JSON.stringify(`AiHistoryShot${s.id.replace("-", "")}`)} component={${name}} width={1920} height={1080} fps={60} durationInFrames={${s.durationInFrames}} defaultProps={{}}/>;\n`;
    await writeCode(path.join(folder, `shots/${name}.tsx`), code);
  }
  const chapterMeta = [];
  for (const chapter of story.chapters) {
    const indices = shots
      .map((s, i) => (s.chapterId === chapter.id ? i : -1))
      .filter((i) => i >= 0);
    const name = `Chapter${chapter.id}`;
    const length = indices.reduce((n, i) => n + shots[i].durationInFrames, 0);
    const code = `import {Composition,Series,useVideoConfig} from 'remotion';\n${indices.map((i) => `import {Shot${String(i + 1).padStart(2, "0")}} from '../shots/Shot${String(i + 1).padStart(2, "0")}';`).join("\n")}\nexport const ${name}=()=>{const {fps}=useVideoConfig();return <Series>${indices.map((i) => `<Series.Sequence name=${JSON.stringify(shots[i].id + " " + shots[i].title)} durationInFrames={${shots[i].durationInFrames}} premountFor={fps}><Shot${String(i + 1).padStart(2, "0")}/></Series.Sequence>`).join("\n")}</Series>;};\nexport const ${name}Composition=()=><Composition id=${JSON.stringify("AiHistoryChapter" + chapter.id)} component={${name}} width={1920} height={1080} fps={60} durationInFrames={${length}} defaultProps={{}}/>;\n`;
    await writeCode(path.join(folder, `chapters/${name}.tsx`), code);
    chapterMeta.push({
      id: chapter.id,
      title: chapter.title,
      composition: `AiHistoryChapter${chapter.id}`,
      startFrame: shots[indices[0]].startFrame,
      durationInFrames: length,
    });
  }
  const filmCode = `import {Audio} from '@remotion/media';\nimport {AbsoluteFill,Composition,Folder,Series,staticFile,useVideoConfig} from 'remotion';\n${chapterMeta.map((c) => `import {Chapter${c.id},Chapter${c.id}Composition} from './chapters/Chapter${c.id}';`).join("\n")}\n${shots.map((s, i) => `import {Shot${String(i + 1).padStart(2, "0")}Composition} from './shots/Shot${String(i + 1).padStart(2, "0")}';`).join("\n")}\nexport const AiHistoryFilm=()=>{const {fps}=useVideoConfig();return <AbsoluteFill><Series>${chapterMeta.map((c) => `<Series.Sequence name=${JSON.stringify(c.id + " " + c.title)} durationInFrames={${c.durationInFrames}} premountFor={fps}><Chapter${c.id}/></Series.Sequence>`).join("\n")}</Series><Audio name="原创配乐 Questions Across Time" src={staticFile('ai-history/music.mp3')} durationInFrames={108000} premountFor={fps}/></AbsoluteFill>;};\nexport const AiHistoryCompositions=()=> <><Composition id="AiHistory30m" component={AiHistoryFilm} width={1920} height={1080} fps={60} durationInFrames={108000} defaultProps={{}}/><Folder name="AiHistoryChapters">${chapterMeta.map((c) => `<Chapter${c.id}Composition/>`).join("\n")}</Folder><Folder name="AiHistoryShots">${shots.map((s, i) => `<Shot${String(i + 1).padStart(2, "0")}Composition/>`).join("\n")}</Folder></>;\n`;
  await writeCode(path.join(folder, "AiHistoryFilm.tsx"), filmCode);
  await saveJson(path.join(folder, "chapter-timeline.json"), chapterMeta);
  const srtTime = (s) => {
    const ms = Math.round(s * 1000);
    return (
      [
        Math.floor(ms / 3600000),
        Math.floor(ms / 60000) % 60,
        Math.floor(ms / 1000) % 60,
      ]
        .map((n) => String(n).padStart(2, "0"))
        .join(":") +
      "," +
      String(ms % 1000).padStart(3, "0")
    );
  };
  const captions = shots.flatMap((s) =>
    s.captions.map((c) => ({
      ...c,
      startSeconds: c.startSeconds + s.startFrame / fps,
      endSeconds: c.endSeconds + s.startFrame / fps,
    })),
  );
  if (final)
    await writeFile(
      path.join(root, "public/ai-history/ai-history.zh.srt"),
      captions
        .map(
          (c, i) =>
            `${i + 1}\n${srtTime(c.startSeconds)} --> ${srtTime(c.endSeconds)}\n${c.text}\n`,
        )
        .join("\n"),
    );
  console.log(
    JSON.stringify(
      {
        status: data.status,
        readyChapters,
        seconds: 1800,
        frames: cursor,
        audioSeconds,
        narrationCoverage: audioSeconds / 1800,
        shotSecondsRange: [
          Math.min(...shots.map((s) => s.durationInFrames / fps)),
          Math.max(...shots.map((s) => s.durationInFrames / fps)),
        ],
        chapters: chapterMeta,
      },
      null,
      2,
    ),
  );
} else
  throw Error(
    "Usage: node scripts/prepare-ai-history.mjs merge|progress|assemble",
  );
