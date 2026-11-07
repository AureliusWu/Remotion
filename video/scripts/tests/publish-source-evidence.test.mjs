import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { getMediaTools } from "../lib/media-tools.mjs";
import { preparePackage, readPreparedPackage } from "../publish/prepare.mjs";
import {
  fileHash,
  jsonBytes,
  metadataFrom,
  releaseContext,
  sha256,
  validateMetadata,
  verifyInputs,
  verifyMedia,
} from "../publish/verify.mjs";

const edition = "private-probe";
const releaseId = `${edition}-20261106`;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAACAAAAASCAIAAAC1qksFAAAACXBIWXMAAAABAAAAAQBPJcTWAAAAK0lEQVR4nGNUrZvKQEvAQlPTGUYtIAKMxgFBMBpEBMFoEBEEo0FEENA8iABDHwF+UIm7qAAAAABJRU5ErkJggg==",
  "base64",
);

async function fixture(t, { encode = false } = {}) {
  const prefix = "remotion-publish-source-";
  const base = await realpath(tmpdir());
  const temp = await realpath(await mkdtemp(path.join(base, prefix)));
  t.after(async () => {
    assert.equal(path.dirname(await realpath(temp)), base);
    assert(path.basename(temp).startsWith(prefix));
    await rm(temp, { recursive: true });
  });
  const videoRoot = path.join(temp, "video");
  const out = path.join(videoRoot, "out");
  await mkdir(out, { recursive: true });
  const video = path.join(out, "test.mp4");
  const cover = path.join(out, "test.png");
  const source = path.join(out, "evidence.json");
  await writeFile(cover, png);
  if (encode) {
    execFileSync(
      getMediaTools().ffmpeg,
      [
        "-v",
        "error",
        "-nostdin",
        "-loop",
        "1",
        "-framerate",
        "60",
        "-i",
        cover,
        "-f",
        "lavfi",
        "-i",
        "sine=frequency=440:sample_rate=48000:duration=0.516666667",
        "-frames:v",
        "31",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-ac",
        "2",
        video,
      ],
      { windowsHide: true },
    );
  } else {
    await writeFile(video, "deliberately invalid media");
  }
  const evidence = {
    schema: "remotion-publish-source/v1",
    edition,
    releaseId,
    periodStart: "2026-11-06",
    periodEnd: "2026-11-06",
    retrievedOn: "2026-11-06",
    compositionId: "PrivateProbe-Bilibili",
    video: { path: "out/test.mp4", sha256: await fileHash(video) },
    cover: { path: "out/test.png", sha256: sha256(png) },
    profile: { width: 32, height: 18, fps: 60, frames: 31 },
    metadata: {
      title: "本地短片样本",
      description: "自制短片，用于本地核验。",
      tags: ["测试"],
    },
    sources: [],
  };
  const writeEvidence = (value) => writeFile(source, jsonBytes(value));
  await writeEvidence(evidence);
  const request = {
    edition,
    videoRoot,
    options: { "source-evidence": "out/evidence.json" },
  };
  const readRequest = { ...request, options: { "release-id": releaseId } };
  return { request, readRequest, evidence, writeEvidence, source, out, video };
}

test("standalone media preparation fully decodes a fractional-duration clip and binds exact evidence bytes", async (t) => {
  const { request, readRequest, evidence, source, out } = await fixture(t, {
    encode: true,
  });
  await writeFile(
    path.join(out, "metadata.json"),
    jsonBytes({ aiDeclaration: false, visibility: "private" }),
  );
  request.options.metadata = "out/metadata.json";
  const original = await readFile(source);
  const { manifest } = await preparePackage(request);
  assert.equal(manifest.releaseId, releaseId);
  assert.equal(manifest.aiDeclaration, false);
  assert.equal(manifest.visibility, "private");
  assert.equal(manifest.mediaVerification.fullDecode, "passed");
  assert.equal(manifest.mediaVerification.video.frames, 31);
  assert.equal(manifest.coverFrame, null);
  assert.equal(manifest.provenance.kind, "standalone");
  assert.equal(manifest.provenance.sourceEvidence.sha256, sha256(original));
  assert.equal(
    manifest.provenance.sourceEvidence.path,
    "video/out/evidence.json",
  );
  assert.equal(manifest.videoSha256, evidence.video.sha256);
  assert.equal(manifest.coverSha256, evidence.cover.sha256);
  assert.deepEqual(await readFile(source), original);
  assert.equal(
    (await readPreparedPackage(readRequest)).fingerprint,
    manifest.fingerprint,
  );

  // Whitespace-only changes still alter the exact evidence reviewed at prepare time.
  await writeFile(source, Buffer.concat([original, Buffer.from("\n")]));
  await assert.rejects(
    readPreparedPackage(readRequest),
    /source evidence changed/i,
  );
  await unlink(source);
  assert.equal(
    (await readPreparedPackage({ ...readRequest, verifyFiles: false }))
      .fingerprint,
    manifest.fingerprint,
  );
});

test("standalone evidence cannot pick a mismatched release, override a bound path, or bypass decode", async (t) => {
  const { request, readRequest, evidence, writeEvidence, out } =
    await fixture(t);
  await assert.rejects(
    releaseContext({ ...request, options: {} }),
    /requires --source-evidence/,
  );
  await assert.rejects(
    verifyInputs(await releaseContext(readRequest)),
    /explicit --source-evidence/,
  );
  await assert.rejects(
    releaseContext({
      ...request,
      options: { ...request.options, "release-id": `${edition}-20261105` },
    }),
    /must match/,
  );
  await assert.rejects(
    releaseContext({
      ...request,
      options: { "source-evidence": "../evidence.json" },
    }),
    /permitted directory/,
  );
  await writeFile(path.join(out, "other.mp4"), "deliberately invalid media");
  await assert.rejects(
    verifyInputs(await releaseContext(request), { video: "out/other.mp4" }),
    /path differs/,
  );
  const inputs = await verifyInputs(await releaseContext(request));
  await assert.rejects(
    verifyMedia(inputs.videoFile, inputs.expected),
    /FFprobe/,
  );

  await writeEvidence({
    ...evidence,
    video: { ...evidence.video, sha256: "0".repeat(64) },
  });
  await assert.rejects(
    verifyInputs(await releaseContext(request)),
    /SHA256 differs/,
  );
  await writeEvidence({
    ...evidence,
    cover: { ...evidence.cover, path: "out/../test.png" },
  });
  await assert.rejects(releaseContext(request), /needs an out\/ path/);
  await writeEvidence({
    ...evidence,
    profile: { ...evidence.profile, width: 34 },
  });
  await assert.rejects(
    verifyInputs(await releaseContext(request)),
    /cover.*dimensions/i,
  );
  await writeEvidence({
    ...evidence,
    sources: [{ label: "Source", url: "http://example.org" }],
  });
  await assert.rejects(
    verifyInputs(await releaseContext(request)),
    /Invalid standalone source URL/,
  );
});

test("optional publication fields preserve old metadata and reject invalid values", () => {
  const original = {
    title: "短片样本",
    description: "自制短片",
    tags: ["测试"],
    accountAlias: null,
    accountUid: null,
    categoryId: null,
    copyrightType: null,
    sourceUrl: null,
  };
  assert.deepEqual(
    metadataFrom({ ...original, unrelated: "ignore" }),
    original,
  );
  assert.deepEqual(
    metadataFrom({ ...original, aiDeclaration: undefined }),
    original,
  );
  const optional = {
    aiDeclaration: false,
    visibility: "private",
    existingUpload: true,
  };
  assert.deepEqual(
    validateMetadata(metadataFrom({ ...original, ...optional })),
    { ...original, ...optional },
  );
  for (const value of [
    { aiDeclaration: "true" },
    { existingUpload: 1 },
    { visibility: "unlisted" },
    {
      aiDeclaration: true,
      copyrightType: "repost",
      sourceUrl: "https://example.org",
    },
  ])
    assert.throws(() => validateMetadata({ ...original, ...value }));
});
