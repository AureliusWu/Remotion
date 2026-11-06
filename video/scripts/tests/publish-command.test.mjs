import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  link,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { videoRoot } from "../lib/workflow-config.mjs";
import {
  approvalFileConfirmer,
  preparedStatus,
  submitPrepared,
} from "../publish/command.mjs";

async function fixture(t) {
  const stateRoot = await mkdtemp(
    path.join(await realpath(os.tmpdir()), "publish-command-"),
  );
  t.after(() => rm(stateRoot, { recursive: true, force: true }));
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
    manifest,
    stateRoot,
    uploadCalls: () => calls,
    change: () => {
      fingerprint = "d".repeat(64);
    },
  };
}

function authorization(manifest, overrides = {}) {
  return {
    schemaVersion: 1,
    authorization: "explicit-user-request",
    approvedAt: new Date().toISOString(),
    approvalReference: "test-operator-message",
    platform: manifest.platform,
    edition: manifest.edition,
    releaseId: manifest.releaseId,
    accountUid: manifest.accountUid,
    accountAlias: manifest.accountAlias,
    fingerprint: "b".repeat(64),
    ...overrides,
  };
}

test("reviewed fixture submits once, verifies pending review and reports local status", async (t) => {
  const f = await fixture(t);
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
  const f = await fixture(t);
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
  const f = await fixture(t);
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

test("scoped approval file authorizes exactly one matching attempt and persists the exact evidence hash", async (t) => {
  const f = await fixture(t);
  const file = path.join(f.stateRoot, "approved.json");
  const proof = authorization(f.manifest);
  const contents = `${JSON.stringify(proof, null, 2)}\n`;
  await writeFile(file, contents);
  const confirm = await approvalFileConfirmer(f.stateRoot, file);
  const result = await f.submit(confirm);
  assert.equal(result.status, "pending_review");
  assert.deepEqual((await f.status()).approval, {
    approvedAt: proof.approvedAt,
    fingerprint: proof.fingerprint,
    approvalEvidenceSha256: createHash("sha256").update(contents).digest("hex"),
  });
  await assert.rejects(f.submit(confirm), /already has an upload attempt/);
  assert.equal(f.uploadCalls(), 1);
});

test("approval rejects altered identity, fingerprint, lifetime, schema and unscoped files", async (t) => {
  const f = await fixture(t);
  const scope = path.join(f.stateRoot, "scoped");
  await mkdir(scope);
  const file = path.join(scope, "approved.json");
  const outside = path.join(f.stateRoot, "outside.json");
  await writeFile(outside, JSON.stringify(authorization(f.manifest)));
  await assert.rejects(
    approvalFileConfirmer(scope, outside),
    /publish output directory/,
  );
  await link(outside, file);
  await assert.rejects(approvalFileConfirmer(scope, file), /regular JSON file/);
  const scopedFile = path.join(scope, "regular.json");

  for (const overrides of [
    { approvedAt: new Date(Date.now() - 31 * 60_000).toISOString() },
    { approvedAt: new Date(Date.now() + 60_000).toISOString() },
    { extra: "must-not-be-read" },
  ]) {
    await writeFile(
      scopedFile,
      JSON.stringify(authorization(f.manifest, overrides)),
    );
    await assert.rejects(
      approvalFileConfirmer(scope, scopedFile),
      /unexpired, exact/,
    );
  }
  for (const overrides of [
    { accountUid: "999999" },
    { accountAlias: "different-account" },
    { releaseId: "weekly-ten-20261106" },
    { platform: "douyin" },
    { edition: "ai-weekly" },
    { fingerprint: "f".repeat(64) },
  ]) {
    await writeFile(
      scopedFile,
      JSON.stringify(authorization(f.manifest, overrides)),
    );
    const confirm = await approvalFileConfirmer(scope, scopedFile);
    await assert.rejects(f.submit(confirm), /does not match/);
  }
  assert.equal(f.uploadCalls(), 0);
});

test("approval-file CLI requires submit, an explicit release and a non-CI environment", () => {
  const base = [
    path.join(videoRoot, "scripts/workflow.mjs"),
    "publish",
    "--edition",
    "weekly-ten",
    "--approval-file",
    "out/publish/fixture.json",
  ];
  for (const [args, ci, reason] of [
    [["--mode", "prepare"], "", /only with submit/],
    [["--mode", "submit"], "", /explicit --release-id/],
    [
      ["--mode", "submit", "--release-id", "weekly-ten-20261030"],
      "true",
      /disabled in CI/,
    ],
  ]) {
    const result = spawnSync(process.execPath, [...base, ...args], {
      cwd: videoRoot,
      encoding: "utf8",
      windowsHide: true,
      env: { ...process.env, CI: ci, GITHUB_ACTIONS: "" },
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, reason);
  }
});

test("a platform verification challenge pauses further network calls and blocks resubmission", async (t) => {
  const f = await fixture(t);
  f.adapter.submit = async () => ({ code: "verification_required" });
  f.adapter.status = async () =>
    assert.fail("The operator must handle the challenge first");
  const result = await f.submit();
  assert.equal(result.status, "needs_attention");
  assert.equal(result.history.at(-1).reasonCode, "verification_required");
  await assert.rejects(f.submit(), /already has an upload attempt/);
});

test("manual upload is checked only by readback and can never start a new upload", async (t) => {
  const f = await fixture(t);
  f.manifest.existingUpload = true;
  let lookups = 0;
  f.adapter.findExisting = async () => {
    lookups++;
    return {
      ...f.candidate,
      status: "pending_review",
      aiDeclarationStatus: "confirmed",
    };
  };
  await assert.rejects(f.submit(), /uploaded manually/);
  assert.equal(f.uploadCalls(), 0);
  assert.equal(lookups, 0);
  const result = await f.status(true);
  assert.equal(result.receipt.bvid, f.candidate.bvid);
  assert.equal(result.receipt.aiDeclarationStatus, "confirmed");
  assert.equal(lookups, 1);
});

test("the receipt persists declaration and private visibility read back for the same BV", async (t) => {
  const f = await fixture(t);
  f.adapter.status = async () => ({
    ...f.candidate,
    status: "pending_review",
    aiDeclarationStatus: "pending",
    visibilityStatus: "confirmed",
  });
  assert.equal((await f.submit()).receipt.aiDeclarationStatus, "pending");
  f.adapter.status = async () => ({
    ...f.candidate,
    status: "pending_review",
    aiDeclarationStatus: "confirmed",
    visibilityStatus: "confirmed",
  });
  await f.status(true);
  const { receipt } = await f.status();
  assert.equal(receipt.bvid, f.candidate.bvid);
  assert.equal(receipt.aiDeclarationStatus, "confirmed");
  assert.equal(receipt.visibilityStatus, "confirmed");
  assert.equal(f.uploadCalls(), 1);
});
