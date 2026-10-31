import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { resolveNewsCount } from "../lib/news-contract.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const actualPlan = (edition) =>
  JSON.parse(
    readFileSync(
      path.join(root, "effects", edition, "storyboard.json"),
      "utf8",
    ).replace(/^\uFEFF/, ""),
  );
const timeline = (count) => ({
  shots: [
    { id: "intro" },
    ...Array.from({ length: count }, (_, i) => ({ id: `news-${i + 1}` })),
    { id: "outro" },
  ],
});

test("actual original Daily Ten and Weekly Ten remain accepted without metadata edits", () => {
  for (const edition of ["daily-ten", "weekly-ten"]) {
    const plan = actualPlan(edition);
    assert.equal(Object.hasOwn(plan, "newsCount"), false);
    assert.equal(resolveNewsCount(plan, edition), 10);
  }
});

test("the current explicit nine-item AI edition remains accepted", () => {
  const plan = actualPlan("ai-weekly");
  assert.equal(plan.newsCount, 9);
  assert.equal(resolveNewsCount(plan, "ai-weekly"), 9);
});

test("missing count never silently derives from a nonlegacy edition's scenes", () => {
  for (const edition of ["ai-weekly", "future-edition"]) {
    assert.throws(
      () => resolveNewsCount(timeline(9), edition),
      /newsCount is required/,
    );
    assert.throws(
      () => resolveNewsCount(timeline(10), edition),
      /newsCount is required/,
    );
  }
});

test("the legacy fallback is fixed at ten and rejects an eleven-scene changed timeline", () => {
  for (const edition of ["daily-ten", "weekly-ten"]) {
    assert.throws(
      () => resolveNewsCount(timeline(9), edition),
      /newsCount must match the interior scenes/,
    );
  }
});

test("explicit wrong values cannot be replaced by a legacy fallback", () => {
  for (const edition of ["daily-ten", "weekly-ten"]) {
    for (const newsCount of [null, undefined, "10", 0, -1, 9.5]) {
      assert.throws(
        () => resolveNewsCount({ ...timeline(10), newsCount }, edition),
        /newsCount must be a positive integer/,
      );
    }
    assert.throws(
      () => resolveNewsCount({ ...timeline(10), newsCount: 9 }, edition),
      /newsCount must match the interior scenes/,
    );
  }
});

test("a declared count must match interior scenes independently of edition name", () => {
  assert.equal(
    resolveNewsCount({ ...timeline(9), newsCount: 9 }, "future-edition"),
    9,
  );
  assert.throws(
    () => resolveNewsCount({ ...timeline(9), newsCount: 10 }, "future-edition"),
    /newsCount must match the interior scenes/,
  );
  assert.equal(
    resolveNewsCount({ ...timeline(10), newsCount: 10 }, "daily-ten"),
    10,
  );
});

test("malformed and intro/outro-only plans cannot produce a valid news count", () => {
  for (const plan of [
    null,
    {},
    { shots: [] },
    { shots: [{ id: "intro" }, { id: "outro" }] },
  ]) {
    assert.throws(
      () => resolveNewsCount(plan, "daily-ten"),
      /Storyboard must contain/,
    );
  }
});
