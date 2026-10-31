import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const videoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
export const readJson = (file) =>
  JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
export const workflowConfig = readJson(
  path.join(videoRoot, "workflow.config.json"),
);
assert.equal(workflowConfig.schemaVersion, 1);

export function editionNames(value = workflowConfig.defaultEdition) {
  if (value === "all") return Object.keys(workflowConfig.editions);
  assert(
    Object.hasOwn(workflowConfig.editions, value),
    `Unknown edition: ${value}`,
  );
  return [value];
}

export function platforms(value = "all") {
  assert(
    ["all", "bilibili", "douyin"].includes(value),
    `Unknown platform: ${value}`,
  );
  return value === "all" ? ["bilibili", "douyin"] : [value];
}

export function loadEdition(name) {
  editionNames(name);
  assert.notEqual(name, "all", "Select one edition");
  const settings = workflowConfig.editions[name];
  const storyboard = readJson(
    path.join(videoRoot, "effects", name, "storyboard.json"),
  );
  const manifest = readJson(
    path.join(videoRoot, "public", name, "voiceover-manifest.json"),
  );
  assert.equal(
    storyboard.shots.reduce((sum, shot) => sum + shot.durationSeconds, 0),
    workflowConfig.durationSeconds,
  );
  const date = (storyboard.periodEnd ?? storyboard.retrievedOn).replaceAll(
    "-",
    "",
  );
  assert.match(date, /^\d{8}$/);
  return {
    name,
    ...settings,
    storyboard,
    manifest,
    date,
    fps: workflowConfig.fps,
    seconds: workflowConfig.durationSeconds,
  };
}

export function qaFrames(edition, quick = false) {
  const frames = [Math.round(3.5 * edition.fps)];
  let elapsed = edition.storyboard.shots[0].durationSeconds;
  for (const shot of edition.storyboard.shots.slice(1, -1)) {
    frames.push(Math.round((elapsed + 4) * edition.fps));
    if (!quick)
      frames.push(
        Math.round(
          (elapsed + Math.min(12, shot.durationSeconds - 2)) * edition.fps,
        ),
      );
    elapsed += shot.durationSeconds;
    if (quick) break;
  }
  if (!quick) frames.push(Math.round((edition.seconds - 6.5) * edition.fps));
  frames.push(edition.seconds * edition.fps - 1);
  return [...new Set(frames)];
}

export function dimensions(platform) {
  assert(
    ["bilibili", "douyin"].includes(platform),
    "Select one platform: bilibili or douyin",
  );
  return platform === "bilibili"
    ? { width: 1920, height: 1080 }
    : { width: 1080, height: 1920 };
}
