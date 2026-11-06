import assert from "node:assert/strict";

const schema = "remotion-publish-source/v1";
const editionPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const reservedDirectory = /^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])$/;

export const validStandaloneEdition = (value) =>
  typeof value === "string" &&
  value.length <= 64 &&
  editionPattern.test(value) &&
  !reservedDirectory.test(value);

export const validSha = (value) =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed) &&
    new Date(parsed).toISOString().slice(0, 10) === value
  );
}

export function releaseDate(edition, releaseId) {
  assert(
    typeof releaseId === "string" && releaseId.startsWith(`${edition}-`),
    "Invalid edition release ID",
  );
  const date = releaseId.slice(edition.length + 1);
  assert(
    /^\d{8}$/.test(date) &&
      validDate(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}`),
    "Invalid release date",
  );
  return date;
}

function assertShape(value, keys, label) {
  assert(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.keys(value).length === keys.length &&
      keys.every((key) => Object.hasOwn(value, key)),
    `Invalid ${label} fields`,
  );
}

function assertMediaRef(value, extension, label) {
  assertShape(value, ["path", "sha256"], label);
  assert(
    typeof value.path === "string" &&
      value.path.startsWith("out/") &&
      value.path.toLowerCase().endsWith(extension) &&
      !/[\u0000-\u001f\\:]/.test(value.path) &&
      value.path
        .split("/")
        .every(
          (part) =>
            part.trim() === part && part.length > 0 && !part.endsWith("."),
        ) &&
      validSha(value.sha256),
    `${label} needs an out/ path and a SHA256`,
  );
}

/** An operator's source declaration. Media and manual rights checks are separate. */
export function parseStandaloneEvidence(bytes, edition) {
  let value;
  try {
    value = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Standalone source evidence is not valid JSON");
  }
  assertShape(
    value,
    [
      "schema",
      "edition",
      "releaseId",
      "periodStart",
      "periodEnd",
      "retrievedOn",
      "compositionId",
      "video",
      "cover",
      "profile",
      "metadata",
      "sources",
    ],
    "standalone source evidence",
  );
  assert(
    value.schema === schema &&
      validStandaloneEdition(edition) &&
      value.edition === edition,
    "Standalone source evidence schema or edition does not match",
  );
  const date = releaseDate(edition, value.releaseId);
  assert(
    validDate(value.periodStart) &&
      validDate(value.periodEnd) &&
      validDate(value.retrievedOn) &&
      value.periodStart <= value.periodEnd &&
      value.periodEnd <= value.retrievedOn &&
      date === value.periodEnd.replaceAll("-", ""),
    "Invalid standalone content and retrieval dates",
  );
  assert(
    typeof value.compositionId === "string" &&
      /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}-Bilibili$/.test(value.compositionId),
    "Invalid standalone composition ID",
  );
  assertMediaRef(value.video, ".mp4", "Standalone video");
  assertMediaRef(value.cover, ".png", "Standalone cover");
  assertShape(
    value.profile,
    ["width", "height", "fps", "frames"],
    "standalone profile",
  );
  const { width, height, fps, frames } = value.profile;
  assert(
    [width, height].every(
      (size) => Number.isInteger(size) && size >= 16 && size % 2 === 0,
    ) &&
      width > height &&
      width <= 3840 &&
      height <= 2160 &&
      Number.isInteger(fps) &&
      fps >= 1 &&
      fps <= 120 &&
      Number.isSafeInteger(frames) &&
      frames >= 1,
    "Standalone profile needs even landscape dimensions, integer fps and exact frame count",
  );
  assertShape(
    value.metadata,
    ["title", "description", "tags"],
    "standalone metadata",
  );
  assert(
    Array.isArray(value.sources) && value.sources.length <= 30,
    "Standalone source references must be an array of up to 30 items",
  );
  for (const source of value.sources)
    assertShape(source, ["label", "url"], "standalone source reference");
  return value;
}
