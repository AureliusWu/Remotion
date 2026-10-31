import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
const hash = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
const normalize = (value) => String(value ?? "").replaceAll("\\", "/");
export function assertEditionVideoSource({
  report,
  source,
  root,
  edition,
  sceneCount,
}) {
  assert.equal(
    report.status,
    "passed",
    "Source video needs a passed edition audio validation report",
  );
  assert.equal(
    report.edition,
    edition,
    "Source video belongs to another edition",
  );
  assert.equal(
    report.decode?.status,
    "passed",
    "Source audio has not passed full decode",
  );
  assert.equal(report.decode?.fullTrackDecoded, true);
  assert(
    Array.isArray(report.windows) &&
      report.windows.length === sceneCount &&
      report.windows.every((window) => window.status === "passed"),
    "Source video edition windows are incomplete",
  );
  const inputs = report.inputs;
  assert.equal(
    inputs?.export?.sha256,
    hash(source),
    "Source video SHA differs from its edition validation",
  );
  const storyboard = `effects/${edition}/storyboard.json`,
    narration = `public/${edition}/voiceover-manifest.json`;
  assert.equal(
    normalize(inputs?.storyboard?.file),
    storyboard,
    "Source validation references another script",
  );
  assert.equal(
    normalize(inputs?.manifest?.file),
    narration,
    "Source validation references another narration",
  );
  assert.equal(
    inputs.storyboard.sha256,
    hash(path.join(root, storyboard)),
    "Source video was validated against a different script",
  );
  assert.equal(
    inputs.manifest.sha256,
    hash(path.join(root, narration)),
    "Source video was validated against different narration/caption timing",
  );
}
