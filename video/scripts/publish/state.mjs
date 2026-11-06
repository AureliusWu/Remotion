import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  realpath,
  rename,
  unlink,
} from "node:fs/promises";
import { hostname } from "node:os";
import path from "node:path";

const statusNames = new Set([
  "new",
  "validating",
  "ready_for_review",
  "approved",
  "uploading",
  "submitted",
  "pending_review",
  "published",
  "rejected",
  "needs_attention",
  "uncertain",
]);
const remoteStates = new Set([
  "submitted",
  "pending_review",
  "published",
  "rejected",
]);
const reviewStates = new Set(["ready_for_review", "approved"]);
const transitions = {
  new: ["new", "validating", "ready_for_review", "needs_attention"],
  validating: ["validating", "ready_for_review", "needs_attention"],
  ready_for_review: [
    "validating",
    "ready_for_review",
    "approved",
    "needs_attention",
  ],
  approved: [
    "validating",
    "ready_for_review",
    "approved",
    "uploading",
    "needs_attention",
  ],
  uploading: [
    "uncertain",
    "needs_attention",
    "submitted",
    "pending_review",
    "published",
    "rejected",
  ],
  uncertain: [
    "uncertain",
    "needs_attention",
    "submitted",
    "pending_review",
    "published",
    "rejected",
  ],
  submitted: [
    "submitted",
    "pending_review",
    "published",
    "rejected",
    "needs_attention",
  ],
  pending_review: [
    "pending_review",
    "published",
    "rejected",
    "needs_attention",
  ],
  published: ["published"],
  rejected: ["rejected"],
};
const reasonCodes = new Set([
  "prepared",
  "approved",
  "upload_started",
  "upload_interrupted",
  "upload_timeout",
  "upload_outcome_unknown",
  "verification_pending",
  "verified_submission",
  "verified_pending_review",
  "verified_published",
  "verified_rejected",
  "adapter_preflight_failed",
  "account_needs_attention",
  "remote_reconciliation_required",
  "manual_review_required",
  "stale_lock_recovered",
  "unverified_remote",
  "adapter_error",
  "cover_pending",
  "awaiting_remote_verification",
  "auth_required",
  "rate_limited",
  "verification_required",
  "network_error",
  "adapter_unconfirmed",
]);
const shaPattern = /^[a-f0-9]{64}$/i;
const tokenPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const accountPattern = /^[\p{L}\p{N}][\p{L}\p{N}._-]{0,63}$/u;
const slugPattern = /^[a-z0-9][a-z0-9-]{0,95}$/;
const ownHostname = hostname();

export class PublishStateError extends Error {
  constructor(code, message, lock) {
    super(message);
    this.name = "PublishStateError";
    this.code = code;
    if (lock) this.lock = lock;
  }
}

const fail = (code, message, lock) => {
  throw new PublishStateError(code, message, lock);
};
const sha = (value) => createHash("sha256").update(value).digest("hex");
const hashFields = (fields) => sha(JSON.stringify(fields));
const now = () => new Date().toISOString();
const validTime = (value) =>
  typeof value === "string" &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const requiredSha = (value, label) => {
  if (typeof value !== "string" || !shaPattern.test(value))
    fail("INVALID_IDENTITY", `${label} must be a SHA-256 digest.`);
  return value.toLowerCase();
};
const requiredSlug = (value, label) => {
  if (typeof value !== "string" || !slugPattern.test(value))
    fail("INVALID_IDENTITY", `${label} must be a lowercase identifier.`);
  return value;
};
const positiveId = (value) => {
  if (typeof value === "number" && !Number.isSafeInteger(value)) return null;
  if (!["string", "number"].includes(typeof value)) return null;
  return /^[1-9]\d{0,18}$/.test(String(value)) ? String(value) : null;
};

export const publishIdentity = (manifest) => {
  const platform = manifest?.platform;
  if (platform !== "bilibili")
    fail("INVALID_IDENTITY", "Expected the bilibili platform.");
  const accountAlias =
    typeof manifest.accountAlias === "string"
      ? manifest.accountAlias.normalize("NFC").toLowerCase()
      : "";
  if (!accountPattern.test(accountAlias))
    fail("INVALID_IDENTITY", "A local account alias is required.");
  const accountUid =
    manifest.accountUid == null ? null : positiveId(manifest.accountUid);
  if (manifest.accountUid != null && accountUid === null)
    fail("INVALID_IDENTITY", "Invalid numeric Bilibili account UID.");
  const edition = requiredSlug(manifest.edition, "edition");
  const releaseId = requiredSlug(manifest.releaseId, "releaseId");
  const videoSha256 = requiredSha(manifest.videoSha256, "videoSha256");
  // A known UID is stable across alias changes. Alias-only workflows must keep
  // the same verified local account alias for preparation and submission.
  const accountScope = accountUid
    ? ["uid", accountUid]
    : ["alias", accountAlias];
  return {
    platform,
    accountAlias,
    accountUid,
    edition,
    releaseId,
    videoSha256,
    scopeKey: hashFields([platform, accountScope, edition, releaseId]),
    idempotencyKey: hashFields([
      platform,
      accountAlias,
      accountUid,
      edition,
      releaseId,
      videoSha256,
    ]),
  };
};

const locations = (stateRoot, identity) => {
  const resolvedIdentity = publishIdentity(identity);
  const directory = path.resolve(stateRoot, resolvedIdentity.scopeKey);
  return {
    identity: resolvedIdentity,
    directory,
    state: path.join(directory, "state.json"),
    lock: path.join(directory, "publish.lock"),
    recovery: path.join(directory, "recovery.lock"),
  };
};

const lstatIfPresent = async (file) => {
  try {
    return await lstat(file, { bigint: true });
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

// The state directory is local and controlled by its operator. Reject links,
// including junctions anywhere in the directory path, before accessing records.
const safeDirectory = async (directory) => {
  const stat = await lstatIfPresent(directory);
  if (!stat) {
    const parent = path.dirname(directory);
    if (parent === directory)
      fail("UNSAFE_STATE_PATH", "The publish state volume is unavailable.");
    await safeDirectory(parent);
    return false;
  }
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    path.relative(directory, await realpath(directory)) !== ""
  )
    fail(
      "UNSAFE_STATE_PATH",
      "Publish state directories cannot use symlinks or junctions.",
    );
  return true;
};

const safeRecord = async (file) => {
  if (!(await safeDirectory(path.dirname(file)))) return null;
  const stat = await lstatIfPresent(file);
  if (stat && (!stat.isFile() || stat.isSymbolicLink()))
    fail(
      "UNSAFE_STATE_PATH",
      "Publish state and lock records must be regular local files.",
    );
  return stat;
};

const readJson = async (file, kind) => {
  const stat = await safeRecord(file);
  if (!stat) return null;
  let handle;
  try {
    const noFollow =
      process.platform === "win32" ? 0 : (constants.O_NOFOLLOW ?? 0);
    handle = await open(file, constants.O_RDONLY | noFollow);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    if (error.code === "ELOOP")
      fail("UNSAFE_STATE_PATH", "Publish state cannot follow linked records.");
    throw error;
  }
  let bytes;
  try {
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile() || stat.ino !== opened.ino || stat.dev !== opened.dev)
      fail(
        "STATE_RECORD_CHANGED",
        "The publish record changed while being opened. Retry status.",
      );
    bytes = await handle.readFile("utf8");
  } finally {
    await handle.close();
  }
  try {
    const value = JSON.parse(bytes);
    if (value && typeof value === "object" && !Array.isArray(value))
      return value;
  } catch {
    // A parse error can quote JSON text. Never expose that text in diagnostics.
  }
  fail(
    "INVALID_STATE",
    `The local publish ${kind} is corrupt and requires inspection.`,
  );
};

const safeApproval = (value) => {
  if (!value || !validTime(value.approvedAt))
    fail("INVALID_APPROVAL", "Approval must include an exact UTC timestamp.");
  const approval = {
    fingerprint: requiredSha(value.fingerprint, "approval fingerprint"),
    approvedAt: value.approvedAt,
  };
  if (typeof value.phrase === "string")
    approval.phraseSha256 = sha(value.phrase);
  else if (
    typeof value.phraseSha256 === "string" &&
    shaPattern.test(value.phraseSha256)
  )
    approval.phraseSha256 = value.phraseSha256.toLowerCase();
  return approval;
};

const safeCoverUrl = (value) => {
  if (typeof value !== "string" || value.length > 512 || /[?#]/.test(value))
    return undefined;
  try {
    const url = new URL(value);
    if (
      url.protocol === "https:" &&
      url.hostname.endsWith(".hdslb.com") &&
      !url.port &&
      !url.username &&
      !url.password &&
      /^\/bfs\/archive\/[A-Za-z0-9._/-]+$/.test(url.pathname)
    )
      return url.href;
  } catch {
    // Discard untrusted URLs without logging their contents.
  }
  return undefined;
};

const safeReceipt = (value) => {
  if (!value || typeof value !== "object") return null;
  const bvid =
    typeof value.bvid === "string" && /^BV[A-Za-z0-9]{10}$/.test(value.bvid)
      ? value.bvid
      : null;
  const aid = positiveId(value.aid);
  const coverUrl = safeCoverUrl(value.coverUrl);
  if (!bvid && !aid && !coverUrl) return null;
  const receipt = {
    bvid,
    aid,
    verified: value.verified === true && Boolean(bvid || aid),
  };
  if (remoteStates.has(value.remoteStatus))
    receipt.remoteStatus = value.remoteStatus;
  if (
    [
      "confirmed",
      "pending",
      "unverified",
      "cover_pending",
      "applied",
      "unknown",
    ].includes(value.coverStatus)
  )
    receipt.coverStatus = value.coverStatus;
  if (coverUrl) receipt.coverUrl = coverUrl;
  if (receipt.verified && receipt.remoteStatus === "published")
    receipt.url = `https://www.bilibili.com/video/${bvid ?? `av${aid}`}/`;
  return receipt;
};

const mergeReceipt = (previous, candidate) => {
  const next = safeReceipt(candidate);
  if (!previous || !next) return next ?? previous ?? null;
  if (previous.verified && !next.verified) return previous;
  const conflicting = ["bvid", "aid"].some(
    (key) => previous[key] && next[key] && previous[key] !== next[key],
  );
  const shared = ["bvid", "aid"].some(
    (key) => previous[key] && previous[key] === next[key],
  );
  const unrelated =
    conflicting ||
    (!shared && (previous.bvid || previous.aid) && (next.bvid || next.aid));
  if (previous.verified && unrelated)
    fail(
      "REMOTE_IDENTITY_CHANGED",
      "The remote receipt does not match the previously verified submission.",
    );
  if (unrelated) return next;
  return safeReceipt({
    ...next,
    bvid: next.bvid ?? previous.bvid,
    aid: next.aid ?? previous.aid,
    coverUrl: next.coverUrl ?? previous.coverUrl,
    coverStatus: next.coverStatus ?? previous.coverStatus,
  });
};

const safeReason = (value) => (reasonCodes.has(value) ? value : undefined);
const safeToolVersion = (value) =>
  typeof value === "string" &&
  /^(?:biliup )?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]{1,40})?$/.test(value)
    ? value
    : undefined;
const safeGitHead = (value) =>
  typeof value === "string" && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value)
    ? value
    : undefined;

const readState = async (files) => {
  const value = await readJson(files.state, "state");
  if (!value) return null;
  const identity = publishIdentity(value.identity);
  if (
    value.schemaVersion !== 1 ||
    identity.scopeKey !== files.identity.scopeKey ||
    identity.scopeKey !== value.identity.scopeKey ||
    identity.idempotencyKey !== value.identity.idempotencyKey ||
    !statusNames.has(value.status) ||
    !validTime(value.createdAt) ||
    !validTime(value.updatedAt) ||
    (value.startedAt !== null && !validTime(value.startedAt)) ||
    !Array.isArray(value.history) ||
    value.history.length === 0
  )
    fail(
      "INVALID_STATE",
      "The local publish state has an invalid identity or structure.",
    );
  const history = value.history.map((event) => {
    if (
      !event ||
      !validTime(event.at) ||
      !statusNames.has(event.status) ||
      !statusNames.has(event.from) ||
      typeof event.idempotencyKey !== "string" ||
      !shaPattern.test(event.idempotencyKey) ||
      typeof event.videoSha256 !== "string" ||
      !shaPattern.test(event.videoSha256)
    )
      fail(
        "INVALID_STATE",
        "The local publish state has invalid event history.",
      );
    return {
      at: event.at,
      from: event.from,
      status: event.status,
      idempotencyKey: event.idempotencyKey,
      videoSha256: event.videoSha256,
      reasonCode: safeReason(event.reasonCode),
    };
  });
  const firstUpload = history.find((event) => event.status === "uploading");
  if (
    history.at(-1).status !== value.status ||
    history.at(-1).idempotencyKey !== identity.idempotencyKey ||
    (firstUpload?.at ?? null) !== value.startedAt ||
    (value.startedAt === null &&
      ["uploading", "uncertain", ...remoteStates].includes(value.status))
  )
    fail(
      "INVALID_STATE",
      "The local publish state does not match its submission history.",
    );
  const approval = value.approval == null ? null : safeApproval(value.approval);
  const fingerprint =
    value.fingerprint == null
      ? null
      : requiredSha(value.fingerprint, "package fingerprint");
  const receipt = safeReceipt(value.receipt);
  if (
    (approval && approval.fingerprint !== fingerprint) ||
    (["approved", "uploading"].includes(value.status) && !approval) ||
    (remoteStates.has(value.status) &&
      (!receipt?.verified || receipt.remoteStatus !== value.status))
  )
    fail(
      "INVALID_STATE",
      "The local publish state lacks matching approval or verified receipt evidence.",
    );
  return {
    schemaVersion: 1,
    identity,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    startedAt: value.startedAt,
    fingerprint,
    approval,
    receipt,
    gitHead: safeGitHead(value.gitHead),
    toolVersion: safeToolVersion(value.toolVersion),
    history,
  };
};

export const readPublishState = (stateRoot, identity) =>
  readState(locations(stateRoot, identity));

const writeJsonFile = async (file, value) => {
  if (!(await safeDirectory(path.dirname(file))))
    fail("UNSAFE_STATE_PATH", "The publish state directory is unavailable.");
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
};

const removeScratch = async (file) => {
  // A private scratch file can be left behind after a process crash. It is
  // never interpreted as state or a live lock.
  try {
    if (await safeDirectory(path.dirname(file))) await unlink(file);
  } catch {
    // Scratch-file cleanup never changes the state or lock names.
  }
};

const writeState = async (file, state) => {
  const scratch = `${file}.${randomUUID()}.tmp`;
  try {
    await writeJsonFile(scratch, state);
    await safeRecord(file);
    await rename(scratch, file);
  } finally {
    await removeScratch(scratch);
  }
};

const readLock = async (file) => {
  const value = await readJson(file, "lock");
  if (!value) return null;
  if (
    !Number.isSafeInteger(value.pid) ||
    value.pid <= 0 ||
    value.pid > 2147483647 ||
    typeof value.hostname !== "string" ||
    !value.hostname ||
    value.hostname.length > 255 ||
    /[\u0000-\u001f\u007f]/.test(value.hostname) ||
    typeof value.token !== "string" ||
    !tokenPattern.test(value.token) ||
    !validTime(value.createdAt)
  )
    fail("INVALID_LOCK", "The local publish lock requires manual inspection.");
  return {
    pid: value.pid,
    hostname: value.hostname,
    token: value.token,
    createdAt: value.createdAt,
  };
};

export const readPublishLock = (stateRoot, identity) =>
  readLock(locations(stateRoot, identity).lock);

const acquireLock = async (file) => {
  const owner = {
    pid: process.pid,
    hostname: ownHostname,
    token: randomUUID(),
    createdAt: now(),
  };
  const scratch = `${file}.${owner.token}.tmp`;
  try {
    await writeJsonFile(scratch, owner);
    // Publishing a complete file with an exclusive hard link avoids a torn
    // owner record if the process exits between exclusive creation and write.
    await link(scratch, file);
    return owner;
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    const held = await readLock(file);
    fail(
      "PUBLISH_LOCKED",
      "The release is locked by another process or needs explicit recovery.",
      held,
    );
  } finally {
    await removeScratch(scratch);
  }
};

const releaseLock = async (file, owner) => {
  const held = await readLock(file);
  if (held?.token !== owner.token)
    fail(
      "LOCK_OWNERSHIP_LOST",
      "The release lock no longer belongs to this process.",
    );
  await unlink(file);
};

const assertAvailable = (state, fingerprint) => {
  if (state?.startedAt !== null && state?.startedAt !== undefined)
    fail(
      "SUBMISSION_ALREADY_ATTEMPTED",
      "This release already has an upload attempt. Reconcile the existing submission before proceeding.",
    );
  if (!state || !reviewStates.has(state.status))
    fail(
      "PREPARATION_REQUIRED",
      "Prepare this exact package before requesting upload approval.",
    );
  if (fingerprint !== undefined)
    requiredSha(fingerprint, "package fingerprint");
  return state;
};

const transitionState = async (files, current, status, details = {}) => {
  const from = current?.status ?? "new";
  const started = Boolean(current?.startedAt);
  const allowed =
    from === "needs_attention"
      ? started
        ? ["uncertain", "needs_attention", ...remoteStates]
        : ["validating", "ready_for_review", "needs_attention"]
      : transitions[from];
  if (!allowed?.includes(status))
    fail(
      "INVALID_TRANSITION",
      `Cannot change publish state from ${from} to ${statusNames.has(status) ? status : "an invalid status"}.`,
    );
  if (
    current &&
    current.identity.idempotencyKey !== files.identity.idempotencyKey &&
    (started || !["validating", "ready_for_review"].includes(status))
  )
    fail(
      "PACKAGE_IDENTITY_CHANGED",
      "An existing release uses a different video or account identity.",
    );
  if (
    started &&
    ["validating", "ready_for_review", "approved", "uploading"].includes(status)
  )
    fail(
      "SUBMISSION_ALREADY_ATTEMPTED",
      "An earlier upload attempt still belongs to this release.",
    );
  const at = now();
  const resetReview = ["validating", "ready_for_review"].includes(status);
  let approval = resetReview ? null : (current?.approval ?? null);
  let fingerprint = resetReview ? null : (current?.fingerprint ?? null);
  if (details.fingerprint !== undefined) {
    const provided = requiredSha(details.fingerprint, "package fingerprint");
    if (!resetReview && fingerprint && provided !== fingerprint)
      fail(
        "PACKAGE_IDENTITY_CHANGED",
        "The package fingerprint changed after review.",
      );
    fingerprint = provided;
  }
  if (status === "approved") {
    approval = safeApproval(details.approval);
    if (fingerprint && approval.fingerprint !== fingerprint)
      fail(
        "INVALID_APPROVAL",
        "Approval does not match the current package fingerprint.",
      );
    fingerprint = approval.fingerprint;
  }
  if (
    status === "uploading" &&
    (!approval || approval.fingerprint !== fingerprint)
  )
    fail(
      "INVALID_APPROVAL",
      "A matching human approval is required before starting upload.",
    );
  const receipt = mergeReceipt(
    resetReview ? null : current?.receipt,
    details.receipt,
  );
  if (
    remoteStates.has(status) &&
    (!receipt?.verified || receipt.remoteStatus !== status)
  )
    fail(
      "REMOTE_VERIFICATION_REQUIRED",
      "Matching remote evidence is required for this submission state.",
    );
  const state = {
    schemaVersion: 1,
    identity: files.identity,
    status,
    createdAt: current?.createdAt ?? at,
    updatedAt: at,
    startedAt: current?.startedAt ?? (status === "uploading" ? at : null),
    fingerprint,
    approval,
    receipt,
    gitHead: safeGitHead(details.gitHead) ?? current?.gitHead,
    toolVersion: safeToolVersion(details.toolVersion) ?? current?.toolVersion,
    history: [
      ...(current?.history ?? []),
      {
        at,
        from,
        status,
        idempotencyKey: files.identity.idempotencyKey,
        videoSha256: files.identity.videoSha256,
        reasonCode: safeReason(details.reasonCode),
      },
    ],
  };
  await writeState(files.state, state);
  return state;
};

const reconcileInterrupted = async (files, current, reasonCode) => {
  if (current?.status !== "uploading") return current;
  return transitionState(
    { ...files, identity: current.identity },
    current,
    "uncertain",
    { reasonCode },
  );
};

export const withPublishLock = async (stateRoot, identity, action) => {
  const files = locations(stateRoot, identity);
  await safeDirectory(files.directory);
  await mkdir(files.directory, { recursive: true, mode: 0o700 });
  const owner = await acquireLock(files.lock);
  let active = true;
  let tail = Promise.resolve();
  const enqueue = (operation) => {
    if (!active)
      fail("LOCK_OWNERSHIP_LOST", "The publish transaction is closed.");
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  };
  const tx = {
    read: () => enqueue(() => readState(files)),
    transition: (status, details) =>
      enqueue(async () =>
        transitionState(files, await readState(files), status, details),
      ),
    assertCanSubmit: (fingerprint) =>
      enqueue(async () => assertAvailable(await readState(files), fingerprint)),
    recoverInterrupted: () =>
      enqueue(async () =>
        reconcileInterrupted(
          files,
          await readState(files),
          "upload_interrupted",
        ),
      ),
  };
  try {
    return await action(tx);
  } finally {
    active = false;
    await tail;
    await releaseLock(files.lock, owner);
  }
};

const requireDeadLocalOwner = (owner) => {
  if (owner.hostname !== ownHostname)
    fail(
      "LOCK_OWNER_UNVERIFIED",
      "The stale lock must be recovered on the original host.",
      owner,
    );
  try {
    process.kill(owner.pid, 0);
  } catch (error) {
    if (error.code === "ESRCH") return;
    fail(
      "LOCK_OWNER_UNVERIFIED",
      "The lock owner's process could not be proven dead.",
      owner,
    );
  }
  fail("LOCK_OWNER_ALIVE", "The lock owner's process is still alive.", owner);
};

export const recoverStalePublishLock = async (
  stateRoot,
  identity,
  expectedToken,
) => {
  if (typeof expectedToken !== "string" || !tokenPattern.test(expectedToken))
    fail(
      "RECOVERY_TOKEN_REQUIRED",
      "Provide the current lock token to explicitly recover the release.",
    );
  const files = locations(stateRoot, identity);
  // Serializes recovery attempts. Ordinary publishers cannot obtain the main
  // lock until recovery has persisted any interrupted upload as uncertain.
  let recoveryOwner;
  try {
    recoveryOwner = await acquireLock(files.recovery);
  } catch (error) {
    if (error.code === "PUBLISH_LOCKED")
      fail(
        "RECOVERY_LOCKED",
        "A recovery process holds recovery.lock. Inspect its owner on the original host before proceeding.",
        error.lock,
      );
    throw error;
  }
  try {
    const owner = await readLock(files.lock);
    if (!owner || owner.token !== expectedToken)
      fail(
        "RECOVERY_TOKEN_MISMATCH",
        "The release lock changed before recovery.",
        owner,
      );
    requireDeadLocalOwner(owner);
    const state = await reconcileInterrupted(
      files,
      await readState(files),
      "stale_lock_recovered",
    );
    await releaseLock(files.lock, owner);
    return state;
  } finally {
    await releaseLock(files.recovery, recoveryOwner);
  }
};
