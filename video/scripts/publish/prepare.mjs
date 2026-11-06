import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdir,
  readFile,
  realpath,
  rename,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  fileHash,
  fingerprintOf,
  inside,
  jsonBytes,
  makeUploadCover,
  metadataFrom,
  readJson,
  releaseContext,
  scopedFile,
  sha256,
  validDate,
  validSha,
  validateMetadata,
  verifyInputs,
  verifyMedia,
} from "./verify.mjs";
import {
  publishIdentity,
  readPublishState,
  withPublishLock,
} from "./state.mjs";

const missing = (error) => error?.code === "ENOENT";
const samePath = (first, second) =>
  typeof first === "string" && path.relative(first, second) === "";
const hasAccount = (manifest) => manifest?.accountAlias != null;

// Never create package output through an existing symlink or junction.
async function plainDirectory(directory, { create = false } = {}) {
  let existing = directory;
  for (;;) {
    try {
      assert(
        samePath(await realpath(existing), existing),
        "Publish directory must not be redirected",
      );
      break;
    } catch (error) {
      if (!missing(error) || !create) throw error;
      const parent = path.dirname(existing);
      if (parent === existing) throw error;
      existing = parent;
    }
  }
  if (create) await mkdir(directory, { recursive: true });
  assert(
    samePath(await realpath(directory), directory),
    "Publish directory must not be redirected",
  );
}

export async function resolvePackageLock(request, options) {
  const context = await releaseContext(request, options);
  const stateRoot = path.join(context.output, ".package-locks");
  const identity = {
    platform: "bilibili",
    accountAlias: "package-lock",
    edition: context.edition,
    releaseId: context.releaseId,
    videoSha256: "0".repeat(64),
  };
  return { context, stateRoot, identity };
}

export async function withPackageLock(request, action) {
  const { context, stateRoot, identity } = await resolvePackageLock(request);
  await plainDirectory(
    path.join(stateRoot, publishIdentity(identity).scopeKey),
    { create: true },
  );
  return withPublishLock(stateRoot, identity, () => action(context));
}

function pathsFor(context, revisionId) {
  assert(validSha(revisionId), "Invalid prepared revision ID");
  const revision = path.join(context.directory, "revisions", revisionId);
  return {
    revision,
    coverPath: path.join(revision, "cover.png"),
    uploadCoverPath: path.join(revision, "upload-cover.jpg"),
    uploadMetadataPath: path.join(revision, "upload-metadata.json"),
  };
}

function validateManifest(manifest, context) {
  assert(
    manifest.schemaVersion === 1 &&
      manifest.edition === context.edition &&
      manifest.releaseId === context.releaseId &&
      manifest.platform === "bilibili" &&
      manifest.status === "ready_for_review" &&
      manifest.mediaQa === "passed" &&
      manifest.sourceReview === "manual-required" &&
      manifest.rightsReview === "manual-required",
    "Prepared manifest does not match the release and review contract",
  );
  assert(
    validDate(manifest.periodStart) &&
      validDate(manifest.periodEnd) &&
      validDate(manifest.retrievedOn) &&
      manifest.periodStart <= manifest.periodEnd &&
      manifest.periodEnd <= manifest.retrievedOn &&
      manifest.periodEnd.replaceAll("-", "") === context.date,
    "Prepared content dates do not match the release ID",
  );
  assert(
    typeof manifest.compositionId === "string" &&
      manifest.compositionId.endsWith("-Bilibili") &&
      typeof manifest.videoPath === "string" &&
      path.isAbsolute(manifest.videoPath) &&
      inside(context.out, manifest.videoPath) &&
      typeof manifest.coverSourcePath === "string" &&
      path.isAbsolute(manifest.coverSourcePath) &&
      inside(context.repo, manifest.coverSourcePath) &&
      [
        manifest.videoSha256,
        manifest.coverSha256,
        manifest.uploadCoverSha256,
        manifest.uploadMetadataSha256,
      ].every(validSha) &&
      manifest.mediaVerification?.status === "passed" &&
      manifest.mediaVerification.fullDecode === "passed" &&
      validSha(manifest.provenance?.storyboardSha256) &&
      validSha(manifest.provenance?.renderedVoiceoverSha256) &&
      validSha(manifest.provenance?.renderInputHash),
    "Prepared media or provenance evidence is incomplete",
  );
  validateMetadata(metadataFrom(manifest));
  const expected = pathsFor(context, manifest.revisionId);
  for (const name of ["coverPath", "uploadCoverPath", "uploadMetadataPath"])
    assert(
      samePath(manifest[name], expected[name]),
      "Prepared revision path is invalid",
    );
  assert(
    validSha(manifest.fingerprint) &&
      fingerprintOf(manifest) === manifest.fingerprint,
    "Prepared manifest fingerprint mismatch",
  );
  return expected;
}

async function readActive(context, { optional = false } = {}) {
  const file = path.join(context.directory, "manifest.json");
  try {
    await realpath(file);
  } catch (error) {
    if (optional && missing(error)) return null;
    if (missing(error))
      throw new Error("No prepared manifest for this edition and release");
    throw error;
  }
  const manifest = await readJson(
    await scopedFile(context.directory, file, ".json", "prepared manifest"),
    "prepared manifest",
  );
  validateManifest(manifest, context);
  return manifest;
}

async function verifyRevision(manifest, context) {
  const expected = validateManifest(manifest, context);
  await plainDirectory(expected.revision);
  const archived = await readJson(
    await scopedFile(
      expected.revision,
      "manifest.json",
      ".json",
      "immutable revision manifest",
    ),
    "immutable revision manifest",
  );
  assert(
    isDeepStrictEqual(archived, manifest),
    "Active manifest differs from the immutable revision",
  );
  for (const [file, hash, extension, label] of [
    [manifest.coverPath, manifest.coverSha256, ".png", "reviewed PNG"],
    [
      manifest.uploadCoverPath,
      manifest.uploadCoverSha256,
      ".jpg",
      "upload JPEG",
    ],
    [
      manifest.uploadMetadataPath,
      manifest.uploadMetadataSha256,
      ".json",
      "upload metadata",
    ],
  ]) {
    const checked = await scopedFile(
      expected.revision,
      file,
      extension,
      label,
      16 * 1024 * 1024,
    );
    assert(
      (await fileHash(checked)) === hash,
      `${label} SHA-256 changed after preparation`,
    );
  }
  const metadata = await readJson(
    manifest.uploadMetadataPath,
    "upload metadata",
    64 * 1024,
  );
  assert(
    isDeepStrictEqual(validateMetadata(metadata), metadataFrom(manifest)),
    "Upload metadata does not match the manifest",
  );
}

const resultOf = (manifest, context) => ({
  manifest,
  directory: context.directory,
  fingerprint: manifest.fingerprint,
});

export async function readPreparedPackage(request) {
  const verifyFiles = request.verifyFiles !== false;
  const context = await releaseContext(request, { verifyFiles });
  await plainDirectory(context.directory);
  const manifest = await readActive(context);
  if (verifyFiles) {
    await verifyRevision(manifest, context);
    const defaultCover = path.join(
      context.repo,
      "examples",
      context.edition,
      "bilibili-cover.png",
    );
    const inputs = await verifyInputs(context, {
      video: manifest.videoPath,
      cover: samePath(manifest.coverSourcePath, defaultCover)
        ? undefined
        : manifest.coverSourcePath,
    });
    assert(
      inputs.videoRef.sha256 === manifest.videoSha256 &&
        inputs.coverRef.sha256 === manifest.coverSha256 &&
        inputs.compositionId === manifest.compositionId &&
        inputs.coverFrame === manifest.coverFrame &&
        isDeepStrictEqual(inputs.provenance, manifest.provenance),
      "Prepared media or source evidence changed; prepare again and review the new fingerprint",
    );
  }
  return resultOf(manifest, context);
}

export const verifyPreparedPackage = readPreparedPackage;

async function writeRevision(manifest, context, png, jpeg, metadataBytes) {
  const { revision } = pathsFor(context, manifest.revisionId);
  await plainDirectory(path.dirname(revision), { create: true });
  try {
    await realpath(revision);
    const existing = await readJson(
      await scopedFile(
        revision,
        "manifest.json",
        ".json",
        "existing immutable revision",
      ),
      "existing immutable revision",
    );
    assert(
      existing.fingerprint === manifest.fingerprint,
      "Existing revision does not match the new package fingerprint",
    );
    await verifyRevision(existing, context);
    return existing;
  } catch (error) {
    if (!missing(error)) throw error;
  }
  const scratch = path.join(path.dirname(revision), `.prepare-${randomUUID()}`);
  await mkdir(scratch);
  const entries = [
    ["cover.png", png],
    ["upload-cover.jpg", jpeg],
    ["upload-metadata.json", metadataBytes],
    ["manifest.json", jsonBytes(manifest)],
  ];
  try {
    for (const [name, contents] of entries)
      await writeFile(path.join(scratch, name), contents, {
        flag: "wx",
        mode: 0o600,
      });
    await rename(scratch, revision);
  } finally {
    for (const [name] of entries)
      await unlink(path.join(scratch, name)).catch((error) => {
        if (!missing(error)) throw error;
      });
    await rmdir(scratch).catch((error) => {
      if (!missing(error)) throw error;
    });
  }
  return manifest;
}

async function activate(manifest, context) {
  const scratch = path.join(context.directory, `.manifest-${randomUUID()}.tmp`);
  try {
    await writeFile(scratch, jsonBytes(manifest), { flag: "wx", mode: 0o600 });
    await rename(scratch, path.join(context.directory, "manifest.json"));
  } finally {
    await unlink(scratch).catch((error) => {
      if (!missing(error)) throw error;
    });
  }
}

function gitHead(repo) {
  try {
    const head = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], {
      encoding: "utf8",
      windowsHide: true,
      shell: false,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(head)) return head;
  } catch {
    // Test fixtures and exported source trees may have no Git checkout.
  }
  return null;
}

/** Local media work only. Test dependencies are supplied in-process, never by CLI. */
export async function preparePackage(
  request,
  { mediaVerifier = verifyMedia, coverMaker = makeUploadCover } = {},
) {
  return withPackageLock(request, async (context) => {
    const { options, root, out, directory, edition, releaseId, storyboard } =
      context;
    await plainDirectory(directory, { create: true });
    const previous = await readActive(context, { optional: true });
    const inputs = await verifyInputs(context, {
      video: options.video,
      cover: options.cover,
    });
    let override = {};
    if (options.metadata != null) {
      const file = await scopedFile(
        out,
        path.resolve(root, options.metadata),
        ".json",
        "upload metadata override",
        64 * 1024,
      );
      override = validateMetadata(
        await readJson(file, "upload metadata override", 64 * 1024),
        { partial: true },
      );
    }
    const metadata = validateMetadata({
      ...inputs.defaults,
      ...(previous ? metadataFrom(previous) : {}),
      ...override,
    });
    const metadataBytes = jsonBytes(metadata);
    const mediaVerification = await mediaVerifier(
      inputs.videoFile,
      inputs.expected,
    );
    const jpeg = await coverMaker(inputs.coverFile, inputs.expected);
    assert(
      Buffer.isBuffer(jpeg) &&
        jpeg.length > 4 &&
        jpeg[0] === 255 &&
        jpeg[1] === 216,
      "Invalid prepared upload JPEG",
    );
    assert(
      (await fileHash(inputs.videoFile)) === inputs.videoRef.sha256 &&
        (await fileHash(inputs.coverFile)) === inputs.coverRef.sha256,
      "Original video or cover changed during preparation",
    );
    const base = {
      schemaVersion: 1,
      edition,
      releaseId,
      platform: "bilibili",
      compositionId: inputs.compositionId,
      periodStart: storyboard.periodStart,
      periodEnd: storyboard.periodEnd,
      retrievedOn: storyboard.retrievedOn,
      ...metadata,
      videoPath: inputs.videoFile,
      videoSha256: inputs.videoRef.sha256,
      videoBytes: inputs.videoRef.bytes,
      coverSourcePath: inputs.coverFile,
      coverSha256: inputs.coverRef.sha256,
      coverFrame: inputs.coverFrame,
      uploadCoverSha256: sha256(jpeg),
      uploadMetadataSha256: sha256(metadataBytes),
      status: "ready_for_review",
      sourceReview: "manual-required",
      rightsReview: "manual-required",
      mediaQa: "passed",
      mediaVerification,
      provenance: inputs.provenance,
      gitHead: gitHead(context.repo),
    };
    const revisionId = fingerprintOf(base);
    const { revision: _revision, ...publishedPaths } = pathsFor(
      context,
      revisionId,
    );
    let manifest = {
      ...base,
      ...publishedPaths,
      revisionId,
      preparedAt: new Date().toISOString(),
    };
    manifest.fingerprint = fingerprintOf(manifest);
    validateManifest(manifest, context);
    const latest = await readActive(context, { optional: true });
    assert(
      (latest?.fingerprint ?? null) === (previous?.fingerprint ?? null),
      "Active manifest changed while preparing; inspect the current package and retry",
    );
    const stateRoot = path.join(context.output, ".state");
    if (hasAccount(previous) && previous.fingerprint !== manifest.fingerprint) {
      const state = await readPublishState(
        stateRoot,
        publishIdentity(previous),
      );
      assert(
        !state?.startedAt,
        "Submission already started for this episode; its active revision is preserved for reconciliation",
      );
      assert(
        hasAccount(manifest),
        "A configured active target cannot be replaced by an unconfigured draft",
      );
    }
    const publish = async (tx) => {
      const state = tx ? await tx.read() : null;
      assert(
        !state?.startedAt || state.fingerprint === manifest.fingerprint,
        "Submission already started for this account and episode; its active revision is preserved",
      );
      manifest = await writeRevision(
        manifest,
        context,
        inputs.coverBytes,
        jpeg,
        metadataBytes,
      );
      if (previous?.fingerprint !== manifest.fingerprint)
        await activate(manifest, context);
      if (
        tx &&
        !state?.startedAt &&
        (state?.fingerprint !== manifest.fingerprint ||
          !["approved", "ready_for_review"].includes(state.status))
      )
        await tx.transition("ready_for_review", {
          fingerprint: manifest.fingerprint,
          gitHead: manifest.gitHead,
          reasonCode: "prepared",
        });
      return resultOf(manifest, context);
    };
    if (hasAccount(manifest)) {
      await plainDirectory(stateRoot, { create: true });
      return withPublishLock(stateRoot, publishIdentity(manifest), publish);
    }
    return publish(null);
  });
}
