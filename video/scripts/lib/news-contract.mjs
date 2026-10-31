import assert from "node:assert/strict";

/** Resolve the declared interior-story count without rewriting legacy scripts.
 * Only the two original ten-item editions predate newsCount. A present field
 * (including null) is always validated rather than replaced with a fallback. */
export const resolveNewsCount = (plan, edition) => {
  assert(
    Array.isArray(plan?.shots) && plan.shots.length >= 3,
    "Storyboard must contain an introduction, news scenes and an outro",
  );
  const interiorCount = plan.shots.length - 2;
  const hasDeclaredCount = Object.hasOwn(plan, "newsCount");
  const legacy = edition === "daily-ten" || edition === "weekly-ten";
  assert(
    hasDeclaredCount || legacy,
    `newsCount is required for edition ${edition}`,
  );
  const declaredCount = hasDeclaredCount ? plan.newsCount : 10;
  assert(
    Number.isSafeInteger(declaredCount) && declaredCount > 0,
    "newsCount must be a positive integer",
  );
  assert.equal(
    declaredCount,
    interiorCount,
    "newsCount must match the interior scenes",
  );
  return declaredCount;
};
