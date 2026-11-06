import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { editionNames, videoRoot } from "../lib/workflow-config.mjs";
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
  const { status, bvid, aid, coverStatus, coverUrl } = observation ?? {};
  if (observed.has(status) && (bvid || aid)) {
    return tx.transition(status, {
      receipt: {
        bvid,
        aid,
        verified: true,
        coverStatus,
        coverUrl,
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

// The CLI supplies the only production confirmer. Tests inject a responder and
// adapter directly, through this module's API, without enabling a CLI bypass.
export async function submitPrepared({
  stateRoot,
  read,
  adapter,
  confirm,
  gitHead,
}) {
  const initial = await read();
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

    await tx.transition("approved", {
      approval: {
        fingerprint,
        approvedAt: new Date().toISOString(),
        phraseSha256: decision.phraseSha256,
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
    ["video", "cover", "metadata"].some((key) => options[key] !== undefined)
  )
    throw new Error(
      "Media and metadata overrides are allowed only during prepare.",
    );
  if (mode !== "status" && (options.remote || options.unlock !== undefined))
    throw new Error("Use --remote or --unlock only with status.");
  if ((mode === "submit" || options.remote) && !productionAllowed())
    throw new Error("Real adapter calls are disabled in CI.");
  if (mode === "submit" && !(process.stdin.isTTY && process.stdout.isTTY))
    throw new Error(
      "Submit requires a person at an interactive terminal. Piped confirmation is refused.",
    );

  const [edition, otherEdition] = editionNames(options.edition);
  if (otherEdition) throw new Error("Select one edition.");
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
      confirm: confirmInTerminal,
      gitHead,
    }),
  );
  const result = summary(state);
  if (["uncertain", "needs_attention", "rejected"].includes(state.status))
    process.exitCode = 1;
  return result;
}

function summary(state, manifest, fingerprint) {
  const bvid = state.receipt?.verified ? state.receipt.bvid : undefined;
  return {
    ...state,
    edition: manifest?.edition ?? state.identity?.edition,
    releaseId: manifest?.releaseId ?? state.identity?.releaseId,
    fingerprint: fingerprint ?? state.approval?.fingerprint,
    ...(bvid ? { url: `https://www.bilibili.com/video/${bvid}/` } : {}),
  };
}
