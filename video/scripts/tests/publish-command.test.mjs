import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { videoRoot } from "../lib/workflow-config.mjs";
import { preparedStatus, submitPrepared } from "../publish/command.mjs";

function fixture(t) {
  const stateRoot = mkdtempSync(path.join(os.tmpdir(), "publish-command-"));
  t.after(() => rmSync(stateRoot, { recursive: true, force: true }));
  const manifest = {
    platform: "bilibili",
    edition: "weekly-ten",
    releaseId: "weekly-ten-20261030",
    accountAlias: "fixture-account",
    accountUid: "123456",
    categoryId: 1,
    copyrightType: "self-made",
    videoSha256: "a".repeat(64),
  };
  const candidate = {
    bvid: "BV1abcdefghi",
    aid: "1234",
    coverStatus: "cover_pending",
  };
  let fingerprint = "b".repeat(64);
  let calls = 0;
  const adapter = {
    async account() {
      return {
        alias: manifest.accountAlias,
        uid: manifest.accountUid,
        toolVersion: "1.3.4",
      };
    },
    async submit() {
      calls++;
      return candidate;
    },
    async status() {
      return { ...candidate, status: "pending_review" };
    },
  };
  const submit = (confirm = async () => true) =>
    submitPrepared({
      stateRoot,
      read: async () => ({ manifest, fingerprint }),
      adapter,
      confirm,
      gitHead: "c".repeat(40),
    });
  const status = (remote = false) =>
    preparedStatus({ stateRoot, manifest, adapter, remote });
  return {
    submit,
    status,
    adapter,
    candidate,
    uploadCalls: () => calls,
    change: () => {
      fingerprint = "d".repeat(64);
    },
  };
}

test("reviewed fixture submits once, verifies pending review and reports local status", async (t) => {
  const f = fixture(t);
  assert.equal((await f.status()).status, "ready_for_review");
  let reviews = 0;
  const result = await f.submit(async (manifest, fingerprint, account) => {
    reviews++;
    assert.equal(manifest.videoSha256, "a".repeat(64));
    assert.equal(fingerprint, "b".repeat(64));
    assert.equal(account.uid, "123456");
    return true;
  });
  assert.equal(result.status, "pending_review");
  assert.equal(result.receipt.verified, true);
  assert.equal((await f.status()).status, "pending_review");
  await assert.rejects(f.submit());
  assert.equal(reviews, 1);
  assert.equal(f.uploadCalls(), 1);
});

test("declined review and package change each block upload", async (t) => {
  const f = fixture(t);
  await assert.rejects(
    f.submit(async () => false),
    /declined/,
  );
  await assert.rejects(
    f.submit(async () => {
      f.change();
      return true;
    }),
    /changed during review/,
  );
  assert.equal(f.uploadCalls(), 0);
});

test("timeout reconciles first and an uncertain result stays blocked until independently found", async (t) => {
  const f = fixture(t);
  let lookups = 0;
  f.adapter.submit = async () => {
    throw Object.assign(new Error("Cookie: fixture-secret"), {
      code: "upload_timeout",
    });
  };
  f.adapter.status = async () => {
    lookups++;
    return { status: "uncertain" };
  };
  const result = await f.submit();
  assert.equal(result.status, "uncertain");
  assert.doesNotMatch(JSON.stringify(result), /fixture-secret/);
  assert.equal(lookups, 1);
  await assert.rejects(f.submit());
  assert.equal(lookups, 1);
  f.adapter.status = async () => ({ ...f.candidate, status: "pending_review" });
  assert.equal((await f.status(true)).status, "pending_review");
});

test("workflow CLI refuses piped confirmation before reading media or contacting an account", () => {
  const result = spawnSync(
    process.execPath,
    [
      path.join(videoRoot, "scripts/workflow.mjs"),
      "publish",
      "--edition",
      "weekly-ten",
      "--mode",
      "submit",
    ],
    {
      cwd: videoRoot,
      encoding: "utf8",
      input: "SUBMIT\n",
      windowsHide: true,
      env: { ...process.env, CI: "", GITHUB_ACTIONS: "" },
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /interactive terminal/);
});

test("a platform verification challenge pauses further network calls and blocks resubmission", async (t) => {
  const f = fixture(t);
  f.adapter.submit = async () => ({ code: "verification_required" });
  f.adapter.status = async () =>
    assert.fail("The operator must handle the challenge first");
  const result = await f.submit();
  assert.equal(result.status, "needs_attention");
  assert.equal(result.history.at(-1).reasonCode, "verification_required");
  await assert.rejects(f.submit(), /already has an upload attempt/);
});
