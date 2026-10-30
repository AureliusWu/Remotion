import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderStill } from "@remotion/renderer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "effects/ai-history");
const target = path.join(root, "out/ai-history-layout");
await mkdir(target, { recursive: true });
const story = JSON.parse(
  await readFile(path.join(source, "storyboard.json"), "utf8"),
);
const existing = JSON.parse(
  await readFile(path.join(source, "film-data.json"), "utf8"),
);
if (!["final", "partial"].includes(existing.status)) {
  const voice = JSON.parse(
    await readFile(
      path.join(root, "public/ai-history/voiceover-manifest.json"),
      "utf8",
    ),
  );
  const shots = story.shots.map((s, i) => ({
    ...s,
    sourceText: s.sourceIds
      .map((id) => story.sources.find((r) => r.id === id).title)
      .join(" · "),
    startFrame: i * 1800,
    durationInFrames: 1800,
    fromSeconds: 0.7,
    captions:
      voice.scenes
        .find((v) => v.id === s.id)
        ?.captions.map((c) => ({
          ...c,
          startSeconds: c.startSeconds + 0.7,
          endSeconds: c.endSeconds + 0.7,
        })) ??
      s.narration.map((text, j) => ({
        text,
        startSeconds: 0.7 + j * 7,
        endSeconds: 7.5 + j * 7,
      })),
  }));
  await writeFile(
    path.join(source, "film-data.json"),
    JSON.stringify(
      {
        status: "layout-draft",
        title: story.title,
        fps: 60,
        durationInFrames: 108000,
        shots,
      },
      null,
      2,
    ) + "\n",
  );
}
const selection = process.argv[2]?.split(",") ?? story.shots.map((s) => s.id);
const serveUrl = await bundle({
  entryPoint: path.join(root, "src/index.ts"),
  outDir: path.join(target, "bundle"),
  rspack: true,
});
const browser = await openBrowser("chrome", { logLevel: "error" });
const errors = [];
const frames = [];
try {
  const comps = await getCompositions({
    serveUrl,
    puppeteerInstance: browser,
    inputProps: {},
  });
  const comp = comps.find((c) => c.id === "AiHistoryLayoutReview");
  if (!comp) throw Error("Layout composition not registered");
  for (const id of selection) {
    const index = story.shots.findIndex((s) => s.id === id);
    if (index < 0) throw Error(`Unknown shot ${id}`);
    await renderStill({
      serveUrl,
      composition: { ...comp, props: { ...comp.props, sceneIndex: index } },
      inputProps: { sceneIndex: index },
      puppeteerInstance: browser,
      frame: 1100,
      output: path.join(target, `${id}.png`),
      imageFormat: "png",
      logLevel: "error",
      onBrowserLog: (e) => {
        if (e.type === "error") errors.push(e.text);
      },
    });
    const bytes = await readFile(path.join(target, `${id}.png`));
    frames.push({
      id,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
    console.log(`Layout ${id}: ${story.shots[index].title}`);
  }
} finally {
  await browser.close({ silent: true });
}
const identicalFrames =
  new Set(frames.map((f) => f.sha256)).size !== frames.length;
await writeFile(
  path.join(target, "report.json"),
  JSON.stringify(
    {
      status: errors.length || identicalFrames ? "failed" : "passed",
      purpose:
        "visual layout only; placeholder timing is not final voice timing",
      shots: selection,
      browserErrors: errors,
      frames,
    },
    null,
    2,
  ),
);
if (errors.length) throw Error(errors.join("\n"));
if (identicalFrames)
  throw Error(
    "Different shots produced identical layout frames; check resolved composition props",
  );
