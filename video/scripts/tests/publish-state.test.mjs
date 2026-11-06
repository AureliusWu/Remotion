import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import {
  publishIdentity,
  readPublishLock,
  readPublishState,
  recoverStalePublishLock,
  withPublishLock,
} from "../publish/state.mjs";

const run = promisify(execFile);
const moduleUrl = new URL("../publish/state.mjs", import.meta.url).href;
const firstVideo = "a".repeat(64);
const secondVideo = "b".repeat(64);
const firstFingerprint = "c".repeat(64);
const secondFingerprint = "d".repeat(64);
const bvid = "BV123456789A";
const coverUrl = "https://i0.hdslb.com/bfs/archive/cover-1234.png";
const manifest = {
  platform: "bilibili",
  accountAlias: "editor-one",
  edition: "weekly-ten",
  releaseId: "weekly-ten-20261030",
  videoSha256: firstVideo,
};
const identity = publishIdentity(manifest);

async function testDirectory(t) {
  const directory = await mkdtemp(
    path.join(await realpath(tmpdir()), "remotion-publish-state-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

const approval = (fingerprint = firstFingerprint) => ({
  fingerprint,
  approvedAt: new Date().toISOString(),
});
const setUpUpload = async (tx) => {
  await tx.transition("ready_for_review", { fingerprint: firstFingerprint });
  await tx.transition("approved", { approval: approval() });
  return tx.transition("uploading", { fingerprint: firstFingerprint });
};

test("lock scope follows account and release across video changes; key includes video SHA", () => {
  const changed = publishIdentity({ ...manifest, videoSha256: secondVideo });
  assert.equal(identity.scopeKey, changed.scopeKey);
  assert.notEqual(identity.idempotencyKey, changed.idempotencyKey);
  const other = publishIdentity({ ...manifest, accountAlias: "editor-two" });
  assert.notEqual(identity.scopeKey, other.scopeKey);
  assert.equal(
    publishIdentity({ ...manifest, accountAlias: "EDITOR-ONE" }).scopeKey,
    identity.scopeKey,
  );
  const uid = publishIdentity({ ...manifest, accountUid: "123456" });
  const renamed = publishIdentity({
    ...manifest,
    accountUid: "123456",
    accountAlias: "renamed",
  });
  assert.equal(uid.scopeKey, renamed.scopeKey);
  assert.notEqual(uid.idempotencyKey, renamed.idempotencyKey);
  assert.throws(
    () => publishIdentity({ ...manifest, releaseId: "../../escape" }),
    { code: "INVALID_IDENTITY" },
  );
});

test("preparation accepts a new package fingerprint and revokes the earlier approval", async (t) => {
  const root = await testDirectory(t);
  assert.equal(await readPublishState(root, identity), null);
  await withPublishLock(root, identity, async (tx) => {
    await assert.rejects(tx.assertCanSubmit(), {
      code: "PREPARATION_REQUIRED",
    });
    await tx.transition("ready_for_review", { fingerprint: firstFingerprint });
    await assert.rejects(tx.transition("uploading"), {
      code: "INVALID_TRANSITION",
    });
    await tx.transition("approved", { approval: approval() });
    await tx.assertCanSubmit(secondFingerprint);
    const next = await tx.transition("ready_for_review", {
      fingerprint: secondFingerprint,
    });
    assert.equal(next.approval, null);
    await assert.rejects(tx.transition("approved", { approval: approval() }), {
      code: "INVALID_APPROVAL",
    });
    await tx.transition("approved", { approval: approval(secondFingerprint) });
    await assert.rejects(
      tx.transition("uploading", { fingerprint: firstFingerprint }),
      { code: "PACKAGE_IDENTITY_CHANGED" },
    );
    assert.equal((await tx.read()).startedAt, null);
  });
  assert.equal(await readPublishLock(root, identity), null);
  const changed = publishIdentity({ ...manifest, videoSha256: secondVideo });
  await withPublishLock(root, changed, async (tx) => {
    await tx.assertCanSubmit(firstFingerprint);
    const refreshed = await tx.transition("ready_for_review", {
      fingerprint: firstFingerprint,
    });
    assert.equal(refreshed.identity.videoSha256, secondVideo);
    assert.equal(refreshed.approval, null);
  });
});

test("candidate receipts and interrupted attempts cannot authorize a duplicate or prove publication", async (t) => {
  const root = await testDirectory(t);
  const first = await withPublishLock(root, identity, async (tx) => {
    const started = await setUpUpload(tx);
    await tx.transition("uncertain", {
      reasonCode: "awaiting_remote_verification",
      receipt: {
        bvid,
        verified: false,
        coverUrl,
        coverStatus: "cover_pending",
      },
    });
    await assert.rejects(
      tx.transition("submitted", {
        receipt: { bvid, verified: false, remoteStatus: "submitted" },
      }),
      { code: "REMOTE_VERIFICATION_REQUIRED" },
    );
    const pending = await tx.transition("pending_review", {
      receipt: {
        bvid,
        aid: 123456,
        verified: true,
        remoteStatus: "pending_review",
      },
    });
    assert.equal(pending.receipt.coverUrl, coverUrl);
    assert.equal(pending.receipt.coverStatus, "cover_pending");
    assert.equal(pending.receipt.url, undefined);
    await assert.rejects(
      tx.transition("published", {
        receipt: { bvid, verified: false, remoteStatus: "published" },
      }),
      { code: "REMOTE_VERIFICATION_REQUIRED" },
    );
    await assert.rejects(
      tx.transition("published", {
        receipt: {
          bvid: "BV987654321B",
          verified: true,
          remoteStatus: "published",
        },
      }),
      { code: "REMOTE_IDENTITY_CHANGED" },
    );
    const published = await tx.transition("published", {
      receipt: {
        bvid,
        verified: true,
        remoteStatus: "published",
        coverStatus: "confirmed",
      },
    });
    assert.equal(
      published.receipt.url,
      `https://www.bilibili.com/video/${bvid}/`,
    );
    assert.equal(published.receipt.coverUrl, coverUrl);
    assert.equal(published.startedAt, started.startedAt);
    await assert.rejects(tx.assertCanSubmit(), {
      code: "SUBMISSION_ALREADY_ATTEMPTED",
    });
    return published;
  });
  const changed = publishIdentity({ ...manifest, videoSha256: secondVideo });
  assert.equal(
    (await readPublishState(root, changed)).identity.videoSha256,
    firstVideo,
  );
  await withPublishLock(root, changed, async (tx) => {
    await assert.rejects(tx.assertCanSubmit(), {
      code: "SUBMISSION_ALREADY_ATTEMPTED",
    });
    await assert.rejects(tx.transition("ready_for_review"), {
      code: "INVALID_TRANSITION",
    });
  });
  assert.equal(
    (await readPublishState(root, identity)).startedAt,
    first.startedAt,
  );
});

test("state stores safe codes and canonical media URLs, discarding credential-shaped details", async (t) => {
  const root = await testDirectory(t);
  const secret = "never-persist-the-fixture-cookie";
  await withPublishLock(root, identity, async (tx) => {
    await tx.transition("ready_for_review", {
      fingerprint: firstFingerprint,
      token: secret,
    });
    await tx.transition("approved", {
      approval: { ...approval(), phrase: secret, token: secret },
    });
    await tx.transition("uploading", {
      toolVersion: "biliup 0.2.4",
      gitHead: "a".repeat(40),
    });
    await tx.transition("uncertain", {
      reasonCode: "network_error",
      error: secret,
      receipt: {
        bvid,
        coverUrl: `${coverUrl}?SESSDATA=${secret}`,
        token: secret,
      },
    });
    await tx.transition("needs_attention", {
      reasonCode: secret,
      authorization: secret,
    });
    await assert.rejects(tx.assertCanSubmit(), {
      code: "SUBMISSION_ALREADY_ATTEMPTED",
    });
  });
  const file = path.join(root, identity.scopeKey, "state.json");
  const json = await readFile(file, "utf8");
  assert(!json.includes(secret));
  assert(!json.includes("SESSDATA"));
  const state = await readPublishState(root, identity);
  assert.match(state.approval.phraseSha256, /^[a-f0-9]{64}$/);
  assert.equal(state.receipt.coverUrl, undefined);
  assert.equal(state.history.at(-2).reasonCode, "network_error");
  assert.equal(state.history.at(-1).reasonCode, undefined);
  assert.equal(state.toolVersion, "biliup 0.2.4");
});

test("another process cannot acquire the lock even with a changed video hash", async (t) => {
  const root = await testDirectory(t);
  const changed = publishIdentity({ ...manifest, videoSha256: secondVideo });
  await withPublishLock(root, identity, async () => {
    const child = `
      const [url, root, serialized] = process.argv.slice(1);
      const {withPublishLock} = await import(url);
      try {
        await withPublishLock(root, JSON.parse(serialized), () => process.exit(22));
      } catch (error) {
        process.exit(error.code === 'PUBLISH_LOCKED' ? 21 : 23);
      }
    `;
    await assert.rejects(
      run(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          child,
          moduleUrl,
          root,
          JSON.stringify(changed),
        ],
        { windowsHide: true },
      ),
      { code: 21 },
    );
    const owner = await readPublishLock(root, changed);
    assert.equal(owner.pid, process.pid);
    await assert.rejects(recoverStalePublishLock(root, changed, owner.token), {
      code: "LOCK_OWNER_ALIVE",
    });
  });
  assert.equal(await readPublishLock(root, changed), null);
});

test("crashed uploader requires explicit same-host lock recovery and leaves an uncertain attempt", async (t) => {
  const root = await testDirectory(t);
  const child = `
    const [url, root, serialized, fingerprint] = process.argv.slice(1);
    const {withPublishLock} = await import(url);
    await withPublishLock(root, JSON.parse(serialized), async (tx) => {
      await tx.transition('ready_for_review', {fingerprint});
      await tx.transition('approved', {approval:{fingerprint,approvedAt:new Date().toISOString()}});
      await tx.transition('uploading');
      process.exit(31);
    });
  `;
  await assert.rejects(
    run(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        child,
        moduleUrl,
        root,
        JSON.stringify(identity),
        firstFingerprint,
      ],
      { windowsHide: true },
    ),
    { code: 31 },
  );
  const uploading = await readPublishState(root, identity);
  assert.equal(uploading.status, "uploading");
  const held = await readPublishLock(root, identity);
  await assert.rejects(
    withPublishLock(root, identity, () =>
      assert.fail("stale lock was ignored"),
    ),
    { code: "PUBLISH_LOCKED" },
  );
  await assert.rejects(recoverStalePublishLock(root, identity), {
    code: "RECOVERY_TOKEN_REQUIRED",
  });
  await assert.rejects(
    recoverStalePublishLock(
      root,
      identity,
      "00000000-0000-4000-8000-000000000000",
    ),
    { code: "RECOVERY_TOKEN_MISMATCH" },
  );
  const recoveryFile = path.join(root, identity.scopeKey, "recovery.lock");
  await writeFile(recoveryFile, JSON.stringify(held));
  await assert.rejects(recoverStalePublishLock(root, identity, held.token), {
    code: "RECOVERY_LOCKED",
  });
  assert.equal((await readPublishState(root, identity)).status, "uploading");
  assert.equal((await readPublishLock(root, identity)).token, held.token);
  await rm(recoveryFile);

  const recovered = await recoverStalePublishLock(root, identity, held.token);
  assert.equal(recovered.status, "uncertain");
  assert.equal(recovered.startedAt, uploading.startedAt);
  assert.equal(recovered.history.at(-1).reasonCode, "stale_lock_recovered");
  assert.equal(await readPublishLock(root, identity), null);
  await withPublishLock(root, identity, async (tx) => {
    await assert.rejects(tx.assertCanSubmit(), {
      code: "SUBMISSION_ALREADY_ATTEMPTED",
    });
  });
});

test("recoverInterrupted records uncertainty after an upload exception released its lock", async (t) => {
  const root = await testDirectory(t);
  await assert.rejects(
    withPublishLock(root, identity, async (tx) => {
      await setUpUpload(tx);
      throw new Error("fixture upload exception");
    }),
    /fixture upload exception/,
  );
  assert.equal(await readPublishLock(root, identity), null);
  const started = await readPublishState(root, identity);
  await withPublishLock(root, identity, async (tx) => {
    const uncertain = await tx.recoverInterrupted();
    assert.equal(uncertain.status, "uncertain");
    assert.equal(uncertain.startedAt, started.startedAt);
    assert.equal(uncertain.history.at(-1).reasonCode, "upload_interrupted");
    await assert.rejects(tx.assertCanSubmit(), {
      code: "SUBMISSION_ALREADY_ATTEMPTED",
    });
  });
});

test("corrupt local state fails closed without echoing the JSON body", async (t) => {
  const root = await testDirectory(t);
  await withPublishLock(root, identity, (tx) =>
    tx.transition("ready_for_review", { fingerprint: firstFingerprint }),
  );
  const token = "sensitive-fixture-token";
  await writeFile(
    path.join(root, identity.scopeKey, "state.json"),
    `{\"cookie\":\"${token}\", invalid`,
  );
  await assert.rejects(readPublishState(root, identity), (error) => {
    assert.equal(error.code, "INVALID_STATE");
    assert(!error.message.includes(token));
    return true;
  });
  await assert.rejects(
    withPublishLock(root, identity, (tx) => tx.assertCanSubmit()),
    { code: "INVALID_STATE" },
  );
});

test("linked state directories and records fail closed without touching their targets", async (t) => {
  const fixture = await testDirectory(t);
  const target = path.join(fixture, "target");
  await mkdir(target);
  await writeFile(path.join(target, "sentinel"), "untouched");
  const kind = process.platform === "win32" ? "junction" : "dir";

  const rootLink = path.join(fixture, "root-link");
  await symlink(target, rootLink, kind);
  for (const root of [rootLink, path.join(rootLink, "missing")]) {
    await assert.rejects(readPublishState(root, identity), {
      code: "UNSAFE_STATE_PATH",
    });
    await assert.rejects(
      withPublishLock(root, identity, () => {}),
      {
        code: "UNSAFE_STATE_PATH",
      },
    );
  }

  const childLinkRoot = path.join(fixture, "child-link-root");
  await mkdir(childLinkRoot);
  await symlink(target, path.join(childLinkRoot, identity.scopeKey), kind);
  await assert.rejects(readPublishLock(childLinkRoot, identity), {
    code: "UNSAFE_STATE_PATH",
  });
  await assert.rejects(
    withPublishLock(childLinkRoot, identity, () => {}),
    {
      code: "UNSAFE_STATE_PATH",
    },
  );

  const recordLinkRoot = path.join(fixture, "record-link-root");
  const scopeDirectory = path.join(recordLinkRoot, identity.scopeKey);
  await mkdir(scopeDirectory, { recursive: true });
  await symlink(target, path.join(scopeDirectory, "state.json"), kind);
  await assert.rejects(readPublishState(recordLinkRoot, identity), {
    code: "UNSAFE_STATE_PATH",
  });
  assert.deepEqual(await readdir(target), ["sentinel"]);
  assert.equal(
    await readFile(path.join(target, "sentinel"), "utf8"),
    "untouched",
  );
});
