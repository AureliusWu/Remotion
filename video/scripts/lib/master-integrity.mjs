import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const digest = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

// A matching script alone is insufficient: the same words can be regenerated
// with another voice/model. Bind every retained source before publishing audio.
export function assertCurrentMaster({ master, root, edition, seconds, file }) {
  assert.equal(master.status, "passed");
  assert.equal(master.masterVerified, true);
  assert.equal(master.edition, edition);
  assert.equal(master.durationSeconds, seconds);
  assert.equal(master.sampleRate, 48000);
  assert.equal(master.bitsPerSample, 24);
  assert.equal(master.channels, 2);
  assert.equal(master.framesPerChannel, seconds * 48000);
  assert.equal(master.usedLossyInput, false);
  assert(
    Array.isArray(master.sourceInputs) && master.sourceInputs.length >= 2,
    "Master has no source provenance",
  );
  const names = new Set();
  const base = path.resolve(root);
  for (const input of master.sourceInputs) {
    assert(
      typeof input.file === "string" &&
        /^[a-f0-9]{64}$/i.test(input.sha256 ?? ""),
      "Invalid master source provenance",
    );
    const relative = input.file.replaceAll("\\", "/");
    const source = path.resolve(base, relative);
    assert(
      source.startsWith(base + path.sep),
      "Master source escapes the video workspace",
    );
    assert.equal(
      digest(source),
      input.sha256,
      `Stale master source: ${relative}; rebuild the master`,
    );
    names.add(relative);
  }
  assert(
    names.has(`effects/${edition}/storyboard.json`) &&
      names.has(`public/${edition}/voiceover-manifest.json`),
    "Master must bind both the script and narration manifest",
  );
  assert.equal(
    master.storyboardSha256,
    digest(path.join(base, "effects", edition, "storyboard.json")),
    "Stale master script",
  );
  const expected = master.sha256 ?? master.output?.sha256;
  assert(/^[a-f0-9]{64}$/i.test(expected ?? ""), "Missing master WAV checksum");
  assert.equal(digest(file), expected, "Master WAV checksum mismatch");
}
