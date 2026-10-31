import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { assertCurrentMaster } from "../lib/master-integrity.mjs";
import { videoRoot } from "../lib/workflow-config.mjs";

function fixture() {
  const parent = path.join(videoRoot, "out/workflow-fixtures");
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, "master-"));
  const files = {
    "effects/ai-weekly/storyboard.json": '{"same":"words"}',
    "public/ai-weekly/voiceover-manifest.json": '{"voice":"original"}',
    "out/cache/line.wav": "original line samples",
  };
  const sha = (value) => createHash("sha256").update(value).digest("hex");
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), content);
  }
  const file = path.join(root, "master.wav");
  writeFileSync(file, "verified master payload");
  const master = {
    status: "passed",
    masterVerified: true,
    edition: "ai-weekly",
    durationSeconds: 180,
    sampleRate: 48000,
    bitsPerSample: 24,
    channels: 2,
    framesPerChannel: 8640000,
    usedLossyInput: false,
    sourceInputs: Object.entries(files).map(([name, content]) => ({
      file: name,
      sha256: sha(content),
    })),
    storyboardSha256: sha(files["effects/ai-weekly/storyboard.json"]),
    sha256: sha("verified master payload"),
  };
  return { master, root, file, edition: "ai-weekly", seconds: 180 };
}
test("a master binds the actual script, voice manifest, source samples and WAV", () =>
  assert.doesNotThrow(() => assertCurrentMaster(fixture())));
test("regenerating narration with unchanged words invalidates the old master", () => {
  const input = fixture();
  writeFileSync(
    path.join(input.root, "public/ai-weekly/voiceover-manifest.json"),
    '{"voice":"new voice"}',
  );
  assert.throws(() => assertCurrentMaster(input), /Stale master source/);
});
test("changing retained PCM source invalidates the old master", () => {
  const input = fixture();
  writeFileSync(
    path.join(input.root, "out/cache/line.wav"),
    "different samples",
  );
  assert.throws(() => assertCurrentMaster(input), /Stale master source/);
});
test("provenance cannot read outside the video workspace", () => {
  const input = fixture();
  input.master.sourceInputs[0].file = "../outside";
  assert.throws(
    () => assertCurrentMaster(input),
    /escapes the video workspace/,
  );
});
