import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { videoRoot } from "../lib/workflow-config.mjs";
import { createBilibiliAdapter } from "./bilibili-adapter.mjs";
import {
  preparePackage,
  readPreparedPackage,
  resolvePackageLock,
  withPackageLock,
} from "./prepare.mjs";
import {
  publishIdentity,
  readPublishLock,
  readPublishState,
  recoverStalePublishLock,
  withPublishLock,
} from "./state.mjs";
import { scopedFile, validSha } from "./verify.mjs";

const observed = new Set([
  "submitted",
  "pending_review",
  "published",
  "rejected",
]);
const operatorRequired = new Set([
  "auth_required",
  "rate_limited",
  "verification_required",
  "cover_pending",
]);
const approvalLifetime = 30 * 60_000;
const approvalFields = [
  "schemaVersion",
  "authorization",
  "approvedAt",
  "approvalReference",
  "platform",
  "edition",
  "releaseId",
  "accountUid",
  "accountAlias",
  "fingerprint",
];

function freshApproval(value) {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString() !== value
  )
    return false;
  const age = Date.now() - timestamp;
  return age >= 0 && age <= approvalLifetime;
}

export async function approvalFileConfirmer(root, input) {
  let bytes;
  let record;
  try {
    const file = path.resolve(input);
    const resolved = await scopedFile(
      await realpath(root),
      file,
      ".json",
      "Approval file",
      4096,
    );
    const expected = await lstat(file, { bigint: true });
    if (
      path.relative(file, resolved) !== "" ||
      !expected.isFile() ||
      expected.nlink !== 1n
    )
      throw new Error("Unsafe approval file");
    const handle = await open(
      file,
      constants.O_RDONLY |
        (process.platform === "win32" ? 0 : (constants.O_NOFOLLOW ?? 0)),
    );
    try {
      const actual = await handle.stat({ bigint: true });
      if (
        !actual.isFile() ||
        actual.nlink !== 1n ||
        actual.dev !== expected.dev ||
        actual.ino !== expected.ino ||
        actual.size > 4096n
      )
        throw new Error("Approval file changed");
      bytes = await handle.readFile();
    } finally {
      await handle.close();
    }
    if (bytes.length > 4096) throw new Error("Oversize approval file");
    record = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(
      "Approval file must be a regular JSON file in the publish output directory.",
    );
  }
  if (
    !record ||
    Object.keys(record).length !== approvalFields.length ||
    !approvalFields.every((key) => Object.hasOwn(record, key)) ||
    record.schemaVersion !== 1 ||
    record.authorization !== "explicit-user-request" ||
    typeof record.approvalReference !== "string" ||
    !/^[A-Za-z0-9._:-]{1,96}$/.test(record.approvalReference) ||
    !validSha(record.fingerprint) ||
    !freshApproval(record.approvedAt)
  )
    throw new Error(
      "Approval file must contain an unexpired, exact submission authorization.",
    );

  const approvalEvidenceSha256 = createHash("sha256")
    .update(bytes)
    .digest("hex");
  return (manifest, fingerprint, account) => {
    if (
      !freshApproval(record.approvedAt) ||
      record.platform !== "bilibili" ||
      record.platform !== manifest.platform ||
      record.edition !== manifest.edition ||
      record.releaseId !== manifest.releaseId ||
      record.accountAlias !== account.alias ||
      record.accountUid !== String(account.uid) ||
      record.fingerprint !== fingerprint
    )
      throw new Error(
        "Approval file does not match the current package and authenticated account.",
      );
    return { approvedAt: record.approvedAt, approvalEvidenceSha256 };
  };
}

function requireTarget(manifest) {
  if (
    !manifest.accountAlias ||
    !manifest.accountUid ||
    !manifest.categoryId ||
    !manifest.copyrightType
  )
    throw new Error(
      "Set accountAlias, accountUid, categoryId and copyrightType in the local prepare metadata first.",
    );
  if (
    manifest.provenance?.kind === "standalone" &&
    (typeof manifest.aiDeclaration !== "boolean" ||
      !["private", "public"].includes(manifest.visibility))
  )
    throw new Error(
      "Set the AI declaration and visibility for standalone media before submitting.",
    );
}

async function verifyAccount(adapter, manifest) {
  const account = await adapter.account(manifest);
  if (
    account.alias !== manifest.accountAlias ||
    String(account.uid) !== manifest.accountUid
  )
    throw new Error(
      "The authenticated account does not match the prepared target.",
    );
  return account;
}

function reason(error) {
  const codes = [
    "auth_required",
    "rate_limited",
    "verification_required",
    "network_error",
    "upload_timeout",
    "cover_pending",
  ];
  return codes.includes(error?.code) ? error.code : "adapter_unconfirmed";
}

async function observedState(tx, observation) {
  const state = await tx.read();
  const {
    status,
    bvid,
    aid,
    coverStatus,
    coverUrl,
    aiDeclarationStatus,
    visibilityStatus,
  } = observation ?? {};
  if (observed.has(status) && (bvid || aid)) {
    return tx.transition(status, {
      receipt: {
        bvid,
        aid,
        verified: true,
        coverStatus,
        coverUrl,
        aiDeclarationStatus,
        visibilityStatus,
        remoteStatus: status,
      },
    });
  }
  // An unavailable lookup cannot undo a previously verified result.
  if (observed.has(state.status)) return state;
  const reasonCode = reason(observation);
  return tx.transition(
    operatorRequired.has(reasonCode) ? "needs_attention" : "uncertain",
    { reasonCode },
  );
}

async function reconcile(tx, adapter, manifest, account) {
  let observation;
  try {
    observation = await adapter.status(manifest, account, await tx.read());
  } catch (error) {
    observation = { code: reason(error) };
  }
  return observedState(tx, observation);
}

// Both production confirmation paths use the same release lock and attempt gate.
export async function submitPrepared({
  stateRoot,
  read,
  adapter,
  confirm,
  gitHead,
}) {
  const initial = await read();
  if (initial.manifest.existingUpload === true)
    throw new Error(
      "This release was uploaded manually. Use status --remote; no new upload is allowed.",
    );
  requireTarget(initial.manifest);
  const identity = publishIdentity(initial.manifest);
  return withPublishLock(stateRoot, identity, async (tx) => {
    await tx.recoverInterrupted();
    const { manifest, fingerprint } = await read();
    if (fingerprint !== initial.fingerprint)
      throw new Error(
        "Package changed. Review the new package before submitting.",
      );
    if (await tx.read()) await tx.assertCanSubmit(fingerprint);
    await tx.transition("ready_for_review", { fingerprint });
    const account = await verifyAccount(adapter, manifest);
    const decision = await confirm(manifest, fingerprint, account);
    if (!decision) throw new Error("Submission confirmation was declined.");
    if ((await read()).fingerprint !== fingerprint)
      throw new Error(
        "Package changed during review. Prepare and review it again.",
      );
    const currentAccount = await verifyAccount(adapter, manifest);
    if (
      account.toolVersion !== currentAccount.toolVersion ||
      account.nickname !== currentAccount.nickname
    )
      throw new Error("Account or adapter identity changed during review.");
    await adapter.preflight?.(manifest, currentAccount);
    if ((await read()).fingerprint !== fingerprint)
      throw new Error(
        "Package changed before upload. Prepare and review it again.",
      );
    if (decision.approvalEvidenceSha256 && !freshApproval(decision.approvedAt))
      throw new Error("Approval file expired before upload.");

    await tx.transition("approved", {
      approval: {
        fingerprint,
        approvedAt: decision.approvedAt ?? new Date().toISOString(),
        phraseSha256: decision.phraseSha256,
        approvalEvidenceSha256: decision.approvalEvidenceSha256,
      },
      gitHead,
      toolVersion: account.toolVersion,
    });
    await tx.transition("uploading");
    let receipt;
    try {
      receipt = await adapter.submit(manifest, currentAccount);
    } catch (error) {
      receipt = { code: reason(error) };
    }
    // The upload exit status and returned ID are candidates. Acceptance needs
    // a separate lookup in the same account, including on the success path.
    const reasonCode = receipt?.code
      ? reason(receipt)
      : "awaiting_remote_verification";
    const needsOperator = operatorRequired.has(reasonCode);
    const recorded = await tx.transition(
      needsOperator ? "needs_attention" : "uncertain",
      {
        reasonCode,
        ...(receipt?.bvid || receipt?.aid || receipt?.coverUrl
          ? {
              receipt: {
                bvid: receipt.bvid,
                aid: receipt.aid,
                coverUrl: receipt.coverUrl,
                coverStatus: receipt.coverStatus,
              },
            }
          : {}),
      },
    );
    return needsOperator
      ? recorded
      : reconcile(tx, adapter, manifest, currentAccount);
  });
}

export async function preparedStatus({
  stateRoot,
  manifest,
  adapter,
  remote,
  unlock,
}) {
  if (!manifest.accountAlias || !manifest.accountUid) {
    if (remote || unlock)
      throw new Error("Prepare the package with a target account first.");
    return { status: "ready_for_review", accountConfigured: false };
  }
  const identity = publishIdentity(manifest);
  if (unlock) await recoverStalePublishLock(stateRoot, identity, unlock);
  const state = await readPublishState(stateRoot, identity);
  if (!remote) {
    const lock = await readPublishLock(stateRoot, identity);
    return {
      ...(state ?? { status: "ready_for_review", accountConfigured: true }),
      ...(lock ? { lock } : {}),
      ...(state?.status === "uploading"
        ? { reconciliationRequiredIfInterrupted: true }
        : {}),
    };
  }
  if (!state?.startedAt) {
    const account = await verifyAccount(adapter, manifest);
    if (manifest.existingUpload === true) {
      const result = await adapter.findExisting(manifest, account);
      const { status, bvid, aid, aiDeclarationStatus, visibilityStatus } =
        result;
      return {
        status,
        accountVerified: true,
        existingUpload: true,
        ...(observed.has(status) && bvid
          ? {
              receipt: {
                bvid,
                aid,
                verified: true,
                aiDeclarationStatus,
                visibilityStatus,
              },
            }
          : { reasonCode: reason(result) }),
      };
    }
    return {
      status: "ready_for_review",
      accountVerified: true,
      toolVersion: account.toolVersion,
    };
  }
  return withPublishLock(stateRoot, identity, async (tx) => {
    await tx.recoverInterrupted();
    return reconcile(
      tx,
      adapter,
      manifest,
      await verifyAccount(adapter, manifest),
    );
  });
}

async function confirmInTerminal(manifest, fingerprint, account) {
  const phrase = `SUBMIT ${fingerprint.slice(0, 12)} ${randomBytes(4).toString("hex")}`;
  console.log(
    JSON.stringify(
      {
        title: manifest.title,
        description: manifest.description,
        tags: manifest.tags,
        releaseId: manifest.releaseId,
        accountAlias: account.alias,
        accountUid: account.uid,
        accountNickname: account.nickname,
        videoSha256: manifest.videoSha256,
        coverPath: manifest.coverPath,
        coverSha256: manifest.coverSha256,
        uploadCoverPath: manifest.uploadCoverPath,
        uploadCoverSha256: manifest.uploadCoverSha256,
        categoryId: manifest.categoryId,
        copyrightType: manifest.copyrightType,
        sourceUrl: manifest.sourceUrl,
        aiDeclaration: manifest.aiDeclaration ?? null,
        visibility: manifest.visibility ?? "public",
        sourceReview: manifest.sourceReview,
        mediaQa: manifest.mediaQa,
        fingerprint,
      },
      null,
      2,
    ),
  );
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  try {
    const answer = await prompt.question(
      `请核实本期来源、版权及音乐授权、分区、封面与目标账号。确认实际提交请输入 ${phrase}\n> `,
      { signal: AbortSignal.timeout(5 * 60_000) },
    );
    return (
      answer === phrase && {
        phraseSha256: createHash("sha256").update(phrase).digest("hex"),
      }
    );
  } finally {
    prompt.close();
  }
}

function productionAllowed() {
  return (
    !process.env.GITHUB_ACTIONS && !/^(true|1)$/i.test(process.env.CI ?? "")
  );
}

export async function runPublish(options) {
  if (options.doctor) {
    if (Object.keys(options).length !== 1)
      throw new Error("Use --doctor by itself.");
    if (!productionAllowed())
      return { mode: "doctor", realAdapter: "disabled_in_ci" };
    return createBilibiliAdapter({ videoRoot }).doctor();
  }
  const mode = options.mode ?? "prepare";
  if (!["prepare", "status", "submit"].includes(mode))
    throw new Error("Select prepare, status or submit.");
  if (options.platform && options.platform !== "bilibili")
    throw new Error("Publishing supports bilibili only.");
  if (!options.edition) throw new Error("Select one edition.");
  if (
    mode !== "prepare" &&
    ["video", "cover", "metadata", "source-evidence"].some(
      (key) => options[key] !== undefined,
    )
  )
    throw new Error(
      "Media, metadata and source evidence are accepted only during prepare.",
    );
  if (mode !== "status" && (options.remote || options.unlock !== undefined))
    throw new Error("Use --remote or --unlock only with status.");
  if ((mode === "submit" || options.remote) && !productionAllowed())
    throw new Error("Real adapter calls are disabled in CI.");
  const approvalFile = options["approval-file"];
  if (
    approvalFile !== undefined &&
    (mode !== "submit" || !options["release-id"])
  )
    throw new Error(
      "Use --approval-file only with submit and an explicit --release-id.",
    );
  if (
    mode === "submit" &&
    approvalFile === undefined &&
    !(process.stdin.isTTY && process.stdout.isTTY)
  )
    throw new Error(
      "Submit requires a person at an interactive terminal. Piped confirmation is refused.",
    );

  const { edition } = options;
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(edition) || edition === "all")
    throw new Error("Select one valid edition.");
  const outputRoot = path.join(videoRoot, "out", "publish");
  const stateRoot = path.join(outputRoot, ".state");
  const request = { edition, options, videoRoot, outputRoot };
  if (mode === "prepare") {
    const { manifest, directory, fingerprint } = await preparePackage(request);
    return {
      status: manifest.status,
      edition: manifest.edition,
      releaseId: manifest.releaseId,
      fingerprint,
      directory,
      mediaQa: manifest.mediaQa,
      sourceReview: manifest.sourceReview,
      ...(manifest.aiDeclaration !== undefined
        ? { aiDeclaration: manifest.aiDeclaration }
        : {}),
      ...(manifest.visibility !== undefined
        ? { visibility: manifest.visibility }
        : {}),
      ...(manifest.existingUpload === true ? { existingUpload: true } : {}),
    };
  }
  if (mode === "status") {
    const packageScope = await resolvePackageLock(request, {
      verifyFiles: false,
    });
    const packageLock = await readPublishLock(
      packageScope.stateRoot,
      packageScope.identity,
    );
    const unlockPackage =
      options.unlock !== undefined && options.unlock === packageLock?.token;
    if (unlockPackage) {
      await recoverStalePublishLock(
        packageScope.stateRoot,
        packageScope.identity,
        options.unlock,
      );
    }
    let prepared;
    try {
      prepared = await readPreparedPackage({ ...request, verifyFiles: false });
    } catch (error) {
      const missing =
        error.code === "ENOENT" ||
        error.message === "No prepared manifest for this edition and release";
      if (!missing || !packageLock || options.remote) throw error;
      if (options.unlock !== undefined && !unlockPackage)
        throw new Error("Provide the current package lock token.");
      return {
        status: "new",
        edition,
        releaseId: packageScope.identity.releaseId,
        ...(unlockPackage ? { packageLockRecovered: true } : { packageLock }),
      };
    }
    const { manifest, fingerprint } = prepared;
    const adapter = options.remote
      ? createBilibiliAdapter({ videoRoot })
      : undefined;
    const state = await preparedStatus({
      stateRoot,
      manifest,
      adapter,
      remote: options.remote,
      unlock: unlockPackage ? undefined : options.unlock,
    });
    return {
      ...summary(state, manifest, fingerprint),
      ...(unlockPackage
        ? { packageLockRecovered: true }
        : packageLock
          ? { packageLock }
          : {}),
    };
  }
  const read = () => readPreparedPackage(request);
  const confirm =
    approvalFile === undefined
      ? confirmInTerminal
      : await approvalFileConfirmer(
          outputRoot,
          path.resolve(videoRoot, approvalFile),
        );
  const gitHead = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: videoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    windowsHide: true,
  }).trim();
  const state = await withPackageLock(request, () =>
    submitPrepared({
      stateRoot,
      read,
      adapter: createBilibiliAdapter({ videoRoot }),
      confirm,
      gitHead,
    }),
  );
  const result = summary(state);
  if (
    ["uncertain", "needs_attention", "rejected"].includes(state.status) ||
    Object.values(result.checks ?? {}).some((value) => value !== "confirmed")
  )
    process.exitCode = 1;
  return result;
}

function summary(state, manifest, fingerprint) {
  const bvid = state.receipt?.verified ? state.receipt.bvid : undefined;
  const privateVisibility =
    manifest?.visibility === "private" ||
    state.receipt?.visibilityStatus !== undefined;
  const checks = Object.fromEntries(
    ["aiDeclarationStatus", "visibilityStatus"]
      .map((key) => [key, state.receipt?.[key]])
      .filter(([, value]) => value !== undefined),
  );
  return {
    ...state,
    edition: manifest?.edition ?? state.identity?.edition,
    releaseId: manifest?.releaseId ?? state.identity?.releaseId,
    fingerprint: fingerprint ?? state.approval?.fingerprint,
    ...(bvid
      ? {
          [privateVisibility ? "ownerUrl" : "url"]:
            `https://www.bilibili.com/video/${bvid}/`,
        }
      : {}),
    ...(Object.keys(checks).length ? { checks } : {}),
  };
}
