import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [edition, ...extra] = process.argv.slice(2);
assert.equal(
  extra.length,
  0,
  "Usage: node scripts/verify-news-edition.mjs EDITION",
);
assert.match(edition ?? "", /^[a-z0-9-]+$/);
const bytes = await readFile(
  path.join(root, `effects/${edition}/storyboard.json`),
);
const plan = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
const manifest = JSON.parse(
  (
    await readFile(
      path.join(root, `public/${edition}/voiceover-manifest.json`),
      "utf8",
    )
  ).replace(/^\uFEFF/, ""),
);
assert(Array.isArray(plan.shots) && plan.shots.length >= 3);
const sceneCount = plan.shots.length;
const newsCount = sceneCount - 2;
// The existing 12-scene Weekly Ten predates explicit newsCount metadata.
const declaredNewsCount =
  plan.newsCount ?? (edition === "weekly-ten" ? 10 : undefined);
assert(Number.isSafeInteger(declaredNewsCount) && declaredNewsCount > 0);
assert.equal(
  declaredNewsCount,
  newsCount,
  "newsCount must match the interior scenes",
);
assert.equal(plan.shots[0].id, "intro");
assert.equal(plan.shots.at(-1).id, "outro");
assert.equal(plan.shots[0].durationSeconds, 10);
assert.equal(plan.shots.at(-1).durationSeconds, 10);
assert.equal(manifest.status, "passed");
assert(Array.isArray(manifest.scenes));
assert.equal(manifest.scenes.length, sceneCount);
assert.equal(
  createHash("sha256").update(bytes).digest("hex"),
  manifest.storyboardSha256,
);
assert.equal(new Set(plan.shots.map((shot) => shot.id)).size, sceneCount);
assert.equal(
  new Set(manifest.scenes.map((scene) => scene.id)).size,
  sceneCount,
);
assert.equal(
  plan.shots.reduce((total, shot) => total + shot.durationSeconds, 0),
  180,
);
const report = {
  edition,
  status: "passed",
  checkedAt: new Date().toISOString(),
  period: [plan.periodStart, plan.periodEnd],
  retrievedOn: plan.retrievedOn,
  sceneCount,
  scenes: [],
  captionCount: 0,
  newsCount,
};
let startFrame = 0;
for (let i = 0; i < sceneCount; i++) {
  const shot = plan.shots[i];
  const scene = manifest.scenes[i];
  assert(typeof shot.id === "string" && shot.id.length > 0);
  assert(Number.isFinite(shot.durationSeconds) && shot.durationSeconds > 0);
  assert(Number.isSafeInteger(shot.durationSeconds * 60));
  assert.equal(shot.id, scene.id);
  assert.equal(shot.durationSeconds, scene.sceneDurationSeconds);
  assert(Array.isArray(shot.narration) && shot.narration.length === 2);
  assert.deepEqual(
    shot.narration,
    scene.captions.map((caption) => caption.text),
  );
  assert.equal(scene.captions.length, 2);
  assert(Number.isFinite(scene.fromSeconds) && scene.fromSeconds >= 0);
  assert(Number.isFinite(scene.durationSeconds) && scene.durationSeconds > 0);
  assert(
    scene.fromSeconds + scene.durationSeconds <=
      scene.sceneDurationSeconds - 0.15,
  );
  let previousEnd = 0;
  for (const caption of scene.captions) {
    assert(typeof caption.text === "string" && caption.text.trim());
    assert(
      Number.isFinite(caption.startSeconds) &&
        Number.isFinite(caption.endSeconds),
    );
    assert(caption.startSeconds >= previousEnd);
    assert(caption.endSeconds > caption.startSeconds);
    assert(caption.endSeconds <= shot.durationSeconds);
    previousEnd = caption.endSeconds;
    report.captionCount++;
  }
  const assetRoot = path.join(root, `public/${edition}`);
  assert(typeof scene.file === "string");
  const file = path.resolve(assetRoot, scene.file);
  assert(file.startsWith(assetRoot + path.sep));
  assert.equal(
    createHash("sha256")
      .update(await readFile(file))
      .digest("hex"),
    scene.sha256,
  );
  if (i > 0 && i < sceneCount - 1) {
    assert.equal(shot.details.length, 2);
    assert(
      shot.stat &&
        shot.kind &&
        shot.sourceLabel &&
        shot.publishedOn &&
        shot.eventOn,
    );
    assert.equal(new URL(shot.sourceUrl).protocol, "https:");
    const day = shot.publishedOn.slice(0, 10);
    assert(day >= plan.periodStart && day <= plan.periodEnd);
  }
  report.scenes.push({
    id: shot.id,
    startFrame,
    endFrame: startFrame + shot.durationSeconds * 60 - 1,
    source: shot.sourceUrl ?? null,
  });
  startFrame += shot.durationSeconds * 60;
}
assert.equal(startFrame, 10800);
assert.equal(report.captionCount, sceneCount * 2);
await mkdir(path.join(root, `out/${edition}-audio`), { recursive: true });
await writeFile(
  path.join(root, `out/${edition}-audio/content-validation.json`),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  `PASSED ${edition}: ${newsCount} dated sources, ${sceneCount} scenes, ${report.captionCount} exact captions, current audio hashes, 180 seconds.`,
);
