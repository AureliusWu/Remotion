import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createBilibiliAdapter } from "../publish/bilibili-adapter.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const bvid = "BV1ip4y1x7Gi";
const aid = "170001";
const uid = "92847";
const nickname = "测试操作者";
const title = '--title=仅作为内容 & "标题"';
const description = "资料范围\n2026-10-30。";
const coverUrl = "https://i0.hdslb.com/bfs/archive/verified.jpg";
const success = `2026-11-06 10:00:00 \x1b[32m INFO\x1b[0m biliup_cli::uploader: user: ${nickname}\n`;
const row = `${bvid}\t${title}\t状态文本不可用于确认\n`;
const receiptLog =
  `2026-11-06 10:00:01  INFO biliup_cli::uploader: ${coverUrl}\n` +
  `2026-11-06 10:00:02  INFO biliup::uploader::bilibili: ResponseData { code: 0, data: Some(Object {"aid": Number(${aid}), "bvid": String("${bvid}")}), message: "0", ttl: Some(1) }\n` +
  "2026-11-06 10:00:02  INFO biliup::uploader::bilibili: Web 接口投稿成功\n";

const help = {
  "--version": "biliup-cli 1.3.4",
  "--help": "--user-cookie --rust-log",
  "upload --help":
    "--submit web --cover --title --desc --tag --tid --copyright --source",
  "list --help": "--from-page --max-pages --is-pubing --not-pubed",
  "show --help": "Usage: biliup.exe show <VID>",
};

async function fixture(t, options = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "remotion-biliup-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const videoRoot = path.join(root, "workspace", "video");
  const privateRoot = path.join(root, "private");
  const configPath = path.join(
    options.workspaceConfig ? videoRoot : privateRoot,
    "publish-config.json",
  );
  const executable = path.join(privateRoot, "pinned.exe");
  const cookieFile = path.join(privateRoot, "mine.json");
  const videoPath = path.join(videoRoot, "video name.mp4");
  const uploadCoverPath = path.join(videoRoot, "approved cover.jpg");
  const exeBytes = "fake pinned binary bytes";
  const videoBytes = "already media-QA passed fixture video";
  const jpegBytes = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
  const calls = [];
  await Promise.all([
    mkdir(videoRoot, { recursive: true }),
    mkdir(privateRoot, { mode: 0o700 }),
  ]);
  const writePrivate = (file, data) =>
    writeFile(file, JSON.stringify(data), { mode: 0o600 });
  if (!options.noConfig) {
    await writePrivate(configPath, {
      schemaVersion: 1,
      acceptPersonalResearchTerms: options.acceptTerms ?? true,
      accounts: { editor: { uid, nickname, cookieFile: "mine.json" } },
    });
    await writePrivate(cookieFile, {
      cookie_info: {
        cookies: [
          { name: "DedeUserID", value: options.cookieUid ?? uid },
          { name: "SESSDATA", value: "fixture-secret-auth-cookie" },
          { name: "bili_jct", value: "fixture-secret-csrf-cookie" },
        ],
      },
      token_info: { mid: Number(uid) },
    });
  }
  await Promise.all([
    writeFile(executable, exeBytes),
    writeFile(videoPath, videoBytes),
    writeFile(uploadCoverPath, jpegBytes),
  ]);

  const adapter = createBilibiliAdapter({
    videoRoot,
    privateRoot,
    configPath,
    executable,
    expectedBinarySha256: options.binarySha256 ?? digest(exeBytes),
    execute: async (file, args, spawnOptions) => {
      assert.equal(file, executable);
      calls.push({ args, spawnOptions });
      const helpKey = args.join(" ");
      if (Object.hasOwn(help, helpKey))
        return { exitCode: 0, stdout: help[helpKey] };
      assert.deepEqual(args.slice(0, 3), [
        "--user-cookie",
        cookieFile,
        "--rust-log",
      ]);
      const command = args[4];
      const commandOptions = args.slice(5);
      if (options.execute) {
        const result = options.execute(command, commandOptions);
        if (result) return result;
      }
      if (command === "list") return { exitCode: 0, stdout: success };
      throw new Error("unexpected command");
    },
  });
  const manifest = {
    platform: "bilibili",
    accountAlias: "editor",
    accountUid: uid,
    title,
    description,
    tags: ["新闻", "本周回顾"],
    copyrightType: "self-made",
    categoryId: 17,
    sourceUrl: null,
    mediaQa: "passed",
    videoPath,
    videoSha256: digest(videoBytes),
    uploadCoverPath,
    uploadCoverSha256: digest(jpegBytes),
  };
  return { adapter, manifest, calls };
}

function archive(overrides = {}) {
  return {
    archive: {
      bvid,
      aid: Number(aid),
      title,
      desc: description,
      cover: coverUrl,
      ...overrides,
    },
  };
}

test("doctor invokes only offline help for a verified pin and requires no credentials", async (t) => {
  const { adapter, calls } = await fixture(t, { noConfig: true });
  const report = await adapter.doctor();
  assert.equal(report.adapterStatus, "available");
  assert.equal(report.toolVersion, "1.3.4");
  assert.equal(report.accountCheck, "requires_manual_setup");
  assert.deepEqual(
    calls.map(({ args }) => args.join(" ")),
    Object.keys(help),
  );
});

test("an unexpected executable digest blocks even the offline probes", async (t) => {
  const { adapter, calls } = await fixture(t, {
    binarySha256: digest("a different binary"),
  });
  assert.equal((await adapter.doctor()).adapterStatus, "unavailable");
  assert.deepEqual(calls, []);
});

test("private terms, local UID agreement and authenticated name must all match", async (t) => {
  for (const [options, code] of [
    [{ workspaceConfig: true }, "auth_required"],
    [{ acceptTerms: false }, "terms_required"],
    [{ cookieUid: "58394" }, "account_mismatch"],
    [
      {
        execute: () => ({
          exitCode: 0,
          stdout: success.replace(nickname, "另一账号"),
        }),
      },
      "account_mismatch",
    ],
  ]) {
    const { adapter, manifest, calls } = await fixture(t, options);
    await assert.rejects(adapter.account(manifest), { code });
    assert.equal(
      calls.some(({ args }) => args[4] === "upload"),
      false,
    );
  }
});

test("preflight blocks a potential duplicate without accepting a title-only match", async (t) => {
  const { adapter, manifest, calls } = await fixture(t, {
    execute: (command) =>
      command === "list" && { exitCode: 0, stdout: success + row },
  });
  const account = await adapter.account(manifest);
  await assert.rejects(adapter.preflight(manifest, account), {
    code: "duplicate_candidate",
  });
  assert.equal(
    (await adapter.status(manifest, account, {})).status,
    "uncertain",
  );
  assert.equal(
    calls.some(({ args }) => ["show", "upload"].includes(args[4])),
    false,
  );
});

test("JPEG and media must still match the approved bytes", async (t) => {
  const { adapter, manifest, calls } = await fixture(t);
  const account = await adapter.account(manifest);
  await assert.rejects(
    adapter.preflight(
      { ...manifest, uploadCoverSha256: digest("changed") },
      account,
    ),
    { code: "cover_pending" },
  );
  await assert.rejects(
    adapter.submit(
      {
        ...manifest,
        uploadCoverPath: manifest.uploadCoverPath.replace(/\.jpg$/, ".png"),
      },
      account,
    ),
    { code: "cover_pending" },
  );
  await assert.rejects(
    adapter.submit({ ...manifest, videoSha256: digest("changed") }, account),
    { code: "invalid_package" },
  );
  assert.equal(
    calls.some(({ args }) => args[4] === "upload"),
    false,
  );
});

test("upload passes approved local cover and metadata as arguments and returns only candidate IDs", async (t) => {
  const { adapter, manifest, calls } = await fixture(t, {
    execute: (command) =>
      command === "upload" && { exitCode: 0, stdout: success + receiptLog },
  });
  const account = await adapter.account(manifest);
  await adapter.preflight(manifest, account);
  assert.deepEqual(await adapter.submit(manifest, account), {
    bvid,
    aid,
    coverUrl,
    coverStatus: "cover_pending",
  });
  const { args, spawnOptions } = calls.find(({ args }) => args[4] === "upload");
  assert.deepEqual(args.slice(4), [
    "upload",
    "--submit=web",
    "--copyright=1",
    "--tid=17",
    `--cover=${manifest.uploadCoverPath}`,
    `--title=${title}`,
    `--desc=${description}`,
    "--tag=新闻,本周回顾",
    "--",
    manifest.videoPath,
  ]);
  assert.equal(spawnOptions.timeout, 45 * 60_000);
});

test("zero exit status and arbitrary BV text are not evidence of a candidate", async (t) => {
  const { adapter, manifest } = await fixture(t, {
    execute: (command) =>
      command === "upload" && {
        exitCode: 0,
        stdout: `${success}other BV number: ${bvid}\n`,
      },
  });
  assert.deepEqual(
    await adapter.submit(manifest, await adapter.account(manifest)),
    {
      coverStatus: "cover_pending",
      code: "adapter_unconfirmed",
    },
  );
});

test("timeout retains only a structured candidate when present and redacts failure output", async (t) => {
  const secret =
    "fixture-secret-cookie=https://member.bilibili.com/?access_key=secret";
  const { adapter, manifest } = await fixture(t, {
    execute: (command) =>
      command === "upload" && {
        exitCode: 1,
        timedOut: true,
        stdout: success + receiptLog,
        stderr: secret,
      },
  });
  assert.deepEqual(
    await adapter.submit(manifest, await adapter.account(manifest)),
    {
      bvid,
      aid,
      coverUrl,
      coverStatus: "cover_pending",
      code: "upload_timeout",
    },
  );
  const failed = await fixture(t, {
    execute: (command) =>
      command === "upload" && { exitCode: 1, stderr: `验证码 ${secret}` },
  });
  await assert.rejects(
    failed.adapter.submit(
      failed.manifest,
      await failed.adapter.account(failed.manifest),
    ),
    (error) => {
      assert.equal(error.code, "verification_required");
      assert.equal(error.message.includes(secret), false);
      return true;
    },
  );
});

test("list plus matching archive confirms only submitted or pending, and checks cover separately", async (t) => {
  for (const [pending, shownCover, expectedStatus, coverStatus] of [
    [true, coverUrl.replace("https:", ""), "pending_review", "confirmed"],
    [
      false,
      "https://i0.hdslb.com/bfs/archive/another.jpg",
      "submitted",
      "cover_pending",
    ],
  ]) {
    const { adapter, manifest } = await fixture(t, {
      execute: (command, args) =>
        command === "show"
          ? {
              exitCode: 0,
              stdout:
                success +
                JSON.stringify(archive({ cover: shownCover }), null, 2),
            }
          : {
              exitCode: 0,
              stdout:
                success + (!args.includes("--is-pubing") || pending ? row : ""),
            },
    });
    const result = await adapter.status(
      manifest,
      await adapter.account(manifest),
      { receipt: { bvid, aid, coverUrl } },
    );
    assert.deepEqual(result, {
      status: expectedStatus,
      bvid,
      aid,
      coverStatus,
      coverUrl,
      url: `https://www.bilibili.com/video/${bvid}/`,
    });
  }
});

test("mismatched archive, weak archive evidence, and an unknown receipt all stay uncertain", async (t) => {
  for (const override of [
    { desc: "other upload" },
    { aid: 170002 },
    { bvid: undefined },
  ]) {
    const { adapter, manifest } = await fixture(t, {
      execute: (command) =>
        command === "show"
          ? {
              exitCode: 0,
              stdout: success + JSON.stringify(archive(override), null, 2),
            }
          : { exitCode: 0, stdout: success + row },
    });
    const account = await adapter.account(manifest);
    const receipt =
      override.bvid === undefined && Object.hasOwn(override, "bvid")
        ? { bvid }
        : { bvid, aid };
    assert.equal(
      (await adapter.status(manifest, account, { receipt })).status,
      "uncertain",
    );
    assert.equal(
      (await adapter.status(manifest, account, {})).status,
      "uncertain",
    );
  }
});

test("a matching rejection requires both a reason and the not-passed listing", async (t) => {
  const { adapter, manifest } = await fixture(t, {
    execute: (command, args) =>
      command === "show"
        ? {
            exitCode: 0,
            stdout:
              success +
              JSON.stringify(
                archive({ reject_reason: "internal reason" }),
                null,
                2,
              ),
          }
        : {
            exitCode: 0,
            stdout: success + (args.includes("--is-pubing") ? "" : row),
          },
  });
  const result = await adapter.status(
    manifest,
    await adapter.account(manifest),
    { receipt: { bvid, aid } },
  );
  assert.equal(result.status, "rejected");
  assert.equal(JSON.stringify(result).includes("internal reason"), false);
});
