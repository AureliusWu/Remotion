import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { videoRoot } from "../lib/workflow-config.mjs";

const cli = (...args) =>
  spawnSync(
    process.execPath,
    [path.join(videoRoot, "scripts/workflow.mjs"), ...args],
    { cwd: videoRoot, encoding: "utf8", windowsHide: true },
  );
test("wrong command fails without claiming completion", () => {
  const result = cli("publish-everything");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command/);
  assert.doesNotMatch(result.stdout, /Workflow passed/);
});
test("render flags cannot silently change a check into a render", () => {
  const result = cli("check", "--frames", "0-119");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not valid for check/);
});
test("edition path traversal is rejected before any renderer runs", () => {
  const result = cli("qa", "--edition", "../../outside", "--quick");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown edition/);
  assert.doesNotMatch(result.stdout, /Bundling/);
});
test("packaging requires an explicit single target platform", () => {
  const result = cli(
    "package",
    "--edition",
    "ai-weekly",
    "--profile",
    "hires-pcm",
    "--source",
    "out/does-not-exist.mp4",
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Select one platform/);
});
test("registry exposes old and new films without local TTS/model startup", () => {
  const result = cli("list");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /DailyTen-Bilibili/);
  assert.match(result.stdout, /AiWeekly-Douyin/);
});
