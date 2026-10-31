import { bundle } from "@remotion/bundler";
import { getCompositions, openBrowser, renderMedia } from "@remotion/renderer";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  dimensions,
  loadEdition,
  platforms,
  videoRoot,
  workflowConfig,
} from "./lib/workflow-config.mjs";

const { values } = parseArgs({
  options: {
    edition: { type: "string" },
    platform: { type: "string" },
    hardware: { type: "string" },
    concurrency: { type: "string" },
    frames: { type: "string" },
  },
});
const edition = loadEdition(values.edition ?? workflowConfig.defaultEdition);
const targets = platforms(values.platform);
const hardwareAcceleration = values.hardware ?? "if-possible";
assert(["disable", "if-possible", "required"].includes(hardwareAcceleration));
const concurrency = Number(values.concurrency ?? 4);
assert(
  Number.isSafeInteger(concurrency) && concurrency >= 1 && concurrency <= 12,
);
let frameRange;
if (values.frames) {
  const match = /^(\d+)-(\d+)$/.exec(values.frames);
  assert(match, "--frames must be an inclusive START-END range");
  frameRange = match.slice(1).map(Number);
  assert(
    frameRange[0] <= frameRange[1] &&
      frameRange[1] < edition.seconds * edition.fps,
  );
}
const partial = Boolean(frameRange);
const seconds = partial
  ? (frameRange[1] - frameRange[0] + 1) / edition.fps
  : edition.seconds;
const work = path.join(
  videoRoot,
  "out/workflow-renders",
  edition.name,
  partial ? `partial-${values.frames}` : "standard",
);
await mkdir(work, { recursive: true });
const verifyContent = () =>
  execFileSync(
    process.execPath,
    [
      path.join(videoRoot, "scripts", edition.contentValidator),
      ...(edition.name === "daily-ten" ? [] : [edition.name]),
    ],
    { cwd: videoRoot, stdio: "inherit", windowsHide: true },
  );
verifyContent();
const files = [
  "workflow.config.json",
  "package.json",
  "package-lock.json",
  "remotion.config.ts",
  "tsconfig.json",
  "effects/index.tsx",
  "effects/daily-ten/storyboard.json",
  "public/daily-ten/voiceover-manifest.json",
  "public/daily-ten/music.mp3",
];
async function collect(directory, predicate) {
  for (const entry of await readdir(path.join(videoRoot, directory), {
    withFileTypes: true,
  })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await collect(file, predicate);
    else if (predicate(file)) files.push(file);
  }
}
await collect("src", (file) => /\.(tsx?|json)$/.test(file));
await collect("effects", (file) => /\.(tsx?|json)$/.test(file));
await collect(`public/${edition.name}`, () => true);
async function fingerprint() {
  const hash = createHash("sha256");
  for (const file of [...new Set(files)].sort())
    hash
      .update(file)
      .update("\0")
      .update(await readFile(path.join(videoRoot, file)))
      .update("\0");
  return hash.digest("hex");
}
const inputHash = await fingerprint();
const options = {
  codec: "h264",
  videoBitrate: "10M",
  audioCodec: "aac",
  audioBitrate: "192k",
  sampleRate: 48000,
  pixelFormat: "yuv420p",
  imageFormat: "jpeg",
  jpegQuality: 95,
  hardwareAcceleration,
  concurrency,
};
const state = {
  status: "running",
  edition: edition.name,
  scope: partial ? "partial" : "complete",
  frameRange: frameRange ?? [0, edition.seconds * edition.fps - 1],
  seconds,
  startedAt: new Date().toISOString(),
  inputHash,
  options,
  platforms: [],
};
const stateFile = path.join(work, "render-state.json");
const save = () => writeFile(stateFile, JSON.stringify(state, null, 2) + "\n");
const unchanged = async () =>
  assert.equal(
    await fingerprint(),
    inputHash,
    "Render inputs changed; rerun from a fixed snapshot",
  );
let browser;
try {
  await save();
  const serveUrl = await bundle({
    entryPoint: path.join(videoRoot, "src/index.ts"),
    outDir: path.join(work, "bundle"),
    rspack: true,
  });
  await unchanged();
  browser = await openBrowser("chrome", { logLevel: "error" });
  const compositions = await getCompositions({
    serveUrl,
    inputProps: {},
    puppeteerInstance: browser,
  });
  for (const platform of targets) {
    await unchanged();
    const size = dimensions(platform);
    const id = edition.compositions[platform];
    const composition = compositions.find((item) => item.id === id);
    assert(
      composition &&
        composition.width === size.width &&
        composition.height === size.height &&
        composition.fps === edition.fps &&
        composition.durationInFrames === edition.seconds * edition.fps,
      `Invalid ${id}`,
    );
    const output = path.join(
      work,
      `${edition.name}-${edition.date}-${platform}${partial ? `-partial-${values.frames}` : ""}-1080p60.mp4`,
    );
    const item = {
      platform,
      composition: id,
      file: path.relative(videoRoot, output),
      status: "rendering",
    };
    state.platforms.push(item);
    await save();
    let previous = -1;
    await renderMedia({
      ...options,
      composition,
      serveUrl,
      inputProps: {},
      outputLocation: output,
      puppeteerInstance: browser,
      ...(frameRange ? { frameRange } : {}),
      logLevel: "error",
      onProgress: (progress) => {
        const bucket = Math.floor(
          progress.renderedFrames / (partial ? 60 : 900),
        );
        if (bucket !== previous) {
          previous = bucket;
          console.log(
            `${platform} ${state.scope}: rendered ${progress.renderedFrames}, encoded ${progress.encodedFrames}`,
          );
        }
      },
    });
    await unchanged();
    execFileSync(
      process.execPath,
      [
        path.join(videoRoot, "scripts/verify-export.mjs"),
        output,
        String(seconds),
        String(edition.fps),
        String(size.width),
        String(size.height),
      ],
      { stdio: "inherit", windowsHide: true },
    );
    if (!partial)
      execFileSync(
        process.execPath,
        [
          path.join(videoRoot, "scripts/verify-weekly-ten-media.mjs"),
          output,
          edition.name,
        ],
        { stdio: "inherit", windowsHide: true },
      );
    item.status = "passed";
    item.bytes = (await stat(output)).size;
    await save();
  }
  await unchanged();
  state.status = "passed";
  state.completedAt = new Date().toISOString();
  await save();
  console.log(
    `${state.scope} ${edition.name} render passed: ${path.relative(videoRoot, work)}`,
  );
} catch (error) {
  state.status = "failed";
  state.error = error.stack ?? String(error);
  await save();
  throw error;
} finally {
  if (browser) await browser.close({ silent: true });
}
