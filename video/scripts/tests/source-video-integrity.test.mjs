import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { assertEditionVideoSource } from "../lib/source-video-integrity.mjs";
import { videoRoot } from "../lib/workflow-config.mjs";
function fixture() {
  const parent = path.join(videoRoot, "out/workflow-fixtures");
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, "source-video-"));
  const sha = (value) => createHash("sha256").update(value).digest("hex");
  const script = "approved AI script",
    narration = "approved caption timing";
  for (const [name, bytes] of Object.entries({
    "effects/ai-weekly/storyboard.json": script,
    "public/ai-weekly/voiceover-manifest.json": narration,
  })) {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    writeFileSync(path.join(root, name), bytes);
  }
  const source = path.join(root, "video.mp4");
  writeFileSync(source, "approved AI video packets");
  const report = {
    status: "passed",
    edition: "ai-weekly",
    decode: { status: "passed", fullTrackDecoded: true },
    windows: [{ status: "passed" }],
    inputs: {
      export: { sha256: sha("approved AI video packets") },
      storyboard: {
        file: "effects\\ai-weekly\\storyboard.json",
        sha256: sha(script),
      },
      manifest: {
        file: "public\\ai-weekly\\voiceover-manifest.json",
        sha256: sha(narration),
      },
    },
  };
  return { report, source, root, edition: "ai-weekly", sceneCount: 1 };
}
test("source video is bound to its approved edition and current subtitle timing", () =>
  assert.doesNotThrow(() => assertEditionVideoSource(fixture())));
test("another edition with identical resolution, fps and duration cannot be repackaged as AI news", () => {
  const input = fixture();
  input.report.edition = "weekly-ten";
  assert.throws(() => assertEditionVideoSource(input), /another edition/);
});
test("replacing the movie while retaining a passed report is rejected", () => {
  const input = fixture();
  writeFileSync(input.source, "different same-spec film");
  assert.throws(() => assertEditionVideoSource(input), /Source video SHA/);
});
test("changed narration or caption timing invalidates the approved source", () => {
  const input = fixture();
  writeFileSync(
    path.join(input.root, "public/ai-weekly/voiceover-manifest.json"),
    "new subtitle timing",
  );
  assert.throws(() => assertEditionVideoSource(input), /different narration/);
});
