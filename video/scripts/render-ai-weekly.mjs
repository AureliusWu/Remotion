import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderMedia } from "@remotion/renderer";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Run only after the final ai-weekly narration and registered compositions pass QA.
// This script writes ai-weekly outputs only; existing films are read as dependencies.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const edition = "ai-weekly";
const work = path.join(root, "out/ai-weekly-render");
const seconds = 180;
const fps = 60;
const frames = seconds * fps;
const readJson = async (file) =>
  JSON.parse((await readFile(file, "utf8")).replace(/^\uFEFF/, ""));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const storyboardFile = path.join(root, `effects/${edition}/storyboard.json`);
const manifestFile = path.join(
  root,
  `public/${edition}/voiceover-manifest.json`,
);
const storyboardBytes = await readFile(storyboardFile);
const plan = JSON.parse(
  storyboardBytes.toString("utf8").replace(/^\uFEFF/, ""),
);
const manifest = await readJson(manifestFile);
assert(Array.isArray(plan.shots) && plan.shots.length >= 3);
const sceneCount = plan.shots.length;
assert.equal(
  plan.newsCount,
  sceneCount - 2,
  "AI newsCount does not match its scenes",
);
assert.equal(
  sceneCount,
  11,
  "This AI edition requires 11 scenes / nine news items",
);
assert.equal(plan.shots[0].id, "intro");
assert.equal(plan.shots.at(-1).id, "outro");
assert.equal(plan.shots[0].durationSeconds, 10);
assert.equal(plan.shots.at(-1).durationSeconds, 10);
assert.equal(
  plan.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
  seconds,
);
assert.equal(manifest.status, "passed", "Final AI narration is required");
assert.equal(manifest.scenes.length, sceneCount);
assert.equal(
  manifest.storyboardSha256,
  digest(storyboardBytes),
  "Stale AI narration script hash",
);
assert.equal(new Set(plan.shots.map((shot) => shot.id)).size, sceneCount);
assert.equal(
  new Set(manifest.scenes.map((scene) => scene.id)).size,
  sceneCount,
);
for (const [index, shot] of plan.shots.entries()) {
  const scene = manifest.scenes[index];
  assert.equal(scene.id, shot.id);
  assert.equal(scene.sceneDurationSeconds, shot.durationSeconds);
  assert.deepEqual(
    scene.captions.map((caption) => caption.text),
    shot.narration,
  );
  assert.equal(scene.captions.length, 2);
  assert(Number.isFinite(scene.fromSeconds) && scene.fromSeconds >= 0);
  assert(Number.isFinite(scene.durationSeconds) && scene.durationSeconds > 0);
  assert(
    scene.fromSeconds + scene.durationSeconds <= shot.durationSeconds - 0.15,
  );
  const assetRoot = path.join(root, `public/${edition}`);
  const file = path.resolve(assetRoot, scene.file);
  assert(
    file.startsWith(assetRoot + path.sep),
    "Narration must stay in public/ai-weekly",
  );
  assert.equal(
    digest(await readFile(file)),
    scene.sha256,
    `Narration hash mismatch at ${scene.id}`,
  );
}

const fixedSources = [
  "src/index.ts",
  "src/Root.tsx",
  "effects/index.tsx",
  "effects/daily-ten/SceneFrame.tsx",
  "effects/daily-ten/EditionContext.tsx",
  "effects/daily-ten/PortraitScene.tsx",
  "effects/daily-ten/NewsArt.tsx",
  // Shared EditionContext imports the default edition while the AI provider
  // supplies the ai-weekly plan. Record those imported JSON dependencies too.
  "effects/daily-ten/storyboard.json",
  "public/daily-ten/voiceover-manifest.json",
  "public/daily-ten/music.mp3",
  "public/daily-ten/music-manifest.json",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "remotion.config.ts",
  "scripts/render-ai-weekly.mjs",
  "scripts/verify-news-edition.mjs",
  "scripts/verify-export.mjs",
  "scripts/verify-weekly-ten-media.mjs",
];
const listFiles = async (directory) => {
  const files = [];
  for (const entry of await readdir(path.join(root, directory), {
    withFileTypes: true,
  })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await listFiles(file)));
    else if (entry.isFile()) files.push(file);
  }
  return files;
};
const fingerprint = async () => {
  const sources = [
    ...new Set([
      ...fixedSources,
      ...(await listFiles(`effects/${edition}`)).filter((file) =>
        /\.(tsx?|json)$/.test(file),
      ),
      ...(await listFiles(`public/${edition}`)),
    ]),
  ].sort();
  const hash = createHash("sha256");
  const files = [];
  for (const file of sources) {
    const bytes = await readFile(path.join(root, file));
    const sha256 = digest(bytes);
    // Delimit names and sizes so separate file boundaries cannot collide.
    hash
      .update(file)
      .update("\0")
      .update(String(bytes.length))
      .update("\0")
      .update(sha256)
      .update("\n");
    files.push({ file, bytes: bytes.length, sha256 });
  }
  return { sha256: hash.digest("hex"), files };
};

const options = {
  codec: "h264",
  videoBitrate: "10M",
  audioCodec: "aac",
  audioBitrate: "192k",
  sampleRate: 48000,
  pixelFormat: "yuv420p",
  imageFormat: "jpeg",
  jpegQuality: 95,
  hardwareAcceleration: "required",
  concurrency: 6,
};
const sourceFingerprint = await fingerprint();
const inputHash = sourceFingerprint.sha256;
const state = {
  status: "running",
  edition,
  startedAt: new Date().toISOString(),
  inputHash,
  sourceFingerprint,
  sceneCount,
  newsCount: plan.newsCount,
  fps,
  frames,
  seconds,
  options,
  platforms: [],
};
await mkdir(work, { recursive: true });
const stateFile = path.join(work, "render-state.json");
const save = () => writeFile(stateFile, JSON.stringify(state, null, 2) + "\n");
const assertInputsUnchanged = async (stage) => {
  const current = await fingerprint();
  assert.equal(
    current.sha256,
    inputHash,
    `AI render inputs changed ${stage}; preserve outputs and restart from a reviewed snapshot`,
  );
};
let browser;
try {
  await save();
  console.log(
    "Verifying final AI narration, captions, dates and source hashes...",
  );
  execFileSync(
    process.execPath,
    [path.join(root, "scripts/verify-news-edition.mjs"), edition],
    { stdio: "inherit", windowsHide: true },
  );
  console.log("Bundling one fixed AI snapshot for both platform exports...");
  const serveUrl = await bundle({
    entryPoint: path.join(root, "src/index.ts"),
    outDir: path.join(work, "bundle"),
    rspack: true,
  });
  await assertInputsUnchanged("while bundling");
  browser = await openBrowser("chrome", { logLevel: "error" });
  const compositions = await getCompositions({
    serveUrl,
    inputProps: {},
    puppeteerInstance: browser,
  });
  for (const target of [
    {
      id: "AiWeekly-Bilibili",
      platform: "bilibili",
      width: 1920,
      height: 1080,
    },
    { id: "AiWeekly-Douyin", platform: "douyin", width: 1080, height: 1920 },
  ]) {
    await assertInputsUnchanged(`before ${target.platform}`);
    const composition = compositions.find((item) => item.id === target.id);
    if (
      !composition ||
      composition.width !== target.width ||
      composition.height !== target.height ||
      composition.fps !== fps ||
      composition.durationInFrames !== frames
    )
      throw new Error(
        `Invalid composition ${target.id}: expected ${target.width}x${target.height}, ${fps}fps, ${frames} frames`,
      );
    const file = path.join(
      root,
      `out/ai-weekly-20261030-${target.platform}-1080p60.mp4`,
    );
    const item = {
      ...target,
      file: path.relative(root, file),
      status: "rendering",
      startedAt: new Date().toISOString(),
    };
    state.platforms.push(item);
    await save();
    let bucket = -1;
    await renderMedia({
      ...options,
      composition,
      serveUrl,
      inputProps: {},
      outputLocation: file,
      puppeteerInstance: browser,
      logLevel: "error",
      onProgress: (progress) => {
        const next = Math.floor(progress.renderedFrames / 900);
        if (next !== bucket) {
          bucket = next;
          console.log(
            `${target.platform}: ${progress.renderedFrames}/${frames} frames; encoded ${progress.encodedFrames}`,
          );
        }
      },
    });
    item.status = "rendered";
    await save();
    await assertInputsUnchanged(`during ${target.platform}`);
    console.log(
      `${target.platform}: checking streams and decoding the complete MP4...`,
    );
    execFileSync(
      process.execPath,
      [
        path.join(root, "scripts/verify-export.mjs"),
        file,
        String(seconds),
        String(fps),
        String(target.width),
        String(target.height),
      ],
      { stdio: "inherit", windowsHide: true },
    );
    execFileSync(
      process.execPath,
      [path.join(root, "scripts/verify-weekly-ten-media.mjs"), file, edition],
      { stdio: "inherit", windowsHide: true },
    );
    await assertInputsUnchanged(`while verifying ${target.platform}`);
    item.status = "passed";
    item.completedAt = new Date().toISOString();
    item.sizeBytes = (await stat(file)).size;
    await save();
  }
  state.status = "passed";
  state.completedAt = new Date().toISOString();
  await save();
  console.log(
    "Both complete AI weekly MP4 exports passed stream, full-decode and narration-window verification.",
  );
} catch (error) {
  state.status = "failed";
  state.error = error.stack ?? String(error);
  await save();
  throw error;
} finally {
  if (browser) await browser.close({ silent: true });
}
