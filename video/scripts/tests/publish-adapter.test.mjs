import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
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
    "--submit web --cover --title --desc --tag --tid --copyright --source --extra-fields --is-only-self",
  "list --help": "--from-page --max-pages --is-pubing --not-pubed",
  "show --help": "Usage: biliup.exe show <VID>",
};

async function fixture(t, options = {}) {
  const root = await mkdtemp(
    path.join(await realpath(tmpdir()), "remotion-biliup-test-"),
  );
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
    ownerFetch: options.ownerFetch,
    execute: async (file, args, spawnOptions) => {
      assert.equal(file, executable);
      calls.push({ args, spawnOptions });
      const helpKey = args.join(" ");
      if (Object.hasOwn(help, helpKey))
        return {
          exitCode: 0,
          stdout: options.help?.[helpKey] ?? help[helpKey],
        };
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
  assert.equal(report.aiDeclarationInput, "web_creation_statement");
  assert.equal(report.aiDeclarationReadback, "authenticated_creator_archive");
  assert.equal(report.privateVisibilityInput, "is_only_self");
  assert.deepEqual(
    calls.map(({ args }) => args.join(" ")),
    Object.keys(help),
  );
});

test("doctor refuses a binary without both pinned upload capabilities", async (t) => {
  for (const flag of ["--extra-fields", "--is-only-self"]) {
    const { adapter } = await fixture(t, {
      noConfig: true,
      help: { "upload --help": help["upload --help"].replace(flag, "") },
    });
    assert.equal((await adapter.doctor()).adapterStatus, "unavailable");
  }
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

test("preflight catches default filenames and normalized titles without changing manual lookup", async (t) => {
  let listedTitle = "";
  const { adapter, manifest, calls } = await fixture(t, {
    execute: (command) =>
      command === "list" && {
        exitCode: 0,
        stdout: success + `${bvid}\t${listedTitle}\t状态\n`,
      },
  });
  const account = await adapter.account(manifest);
  for (const possibleDuplicate of [
    "video name.mp4",
    "　ｖｉｄｅｏ　ｎａｍｅ　",
    `　${title.replace("--title", "－－ｔｉｔｌｅ")}　`,
  ]) {
    listedTitle = possibleDuplicate;
    await assert.rejects(adapter.preflight(manifest, account), {
      code: "duplicate_candidate",
    });
    assert.equal(
      (await adapter.findExisting(manifest, account)).status,
      "uncertain",
    );
  }
  listedTitle = "video name edit.mp4";
  await adapter.preflight(manifest, account);
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

test("explicit AI and private settings become allowlisted arguments and an unconfirmed receipt", async (t) => {
  const { adapter, manifest, calls } = await fixture(t, {
    execute: (command) =>
      command === "upload" && {
        exitCode: 0,
        stdout: success + receiptLog,
      },
  });
  const requested = { ...manifest, aiDeclaration: true, visibility: "private" };
  const account = await adapter.account(requested);
  const receipt = await adapter.submit(requested, account);
  assert.deepEqual(receipt, {
    bvid,
    aid,
    coverUrl,
    coverStatus: "cover_pending",
    aiDeclarationStatus: "pending",
    visibilityStatus: "pending",
  });
  const { args } = calls.find(({ args }) => args[4] === "upload");
  assert.deepEqual(args.slice(-4), [
    '--extra-fields={"creation_statement":{"id":1}}',
    "--is-only-self=1",
    "--",
    manifest.videoPath,
  ]);

  const explicitPublic = {
    ...manifest,
    aiDeclaration: false,
    visibility: "public",
  };
  const publicReceipt = await adapter.submit(explicitPublic, account);
  assert.equal(Object.hasOwn(publicReceipt, "aiDeclarationStatus"), false);
  assert.equal(Object.hasOwn(publicReceipt, "visibilityStatus"), false);
  assert.equal(
    calls
      .at(-1)
      .args.some((arg) => /^--(?:extra-fields|is-only-self)=/.test(arg)),
    false,
  );
});

test("invalid settings, unsupported repost declarations and reconciliation-only packages cannot upload", async (t) => {
  const { adapter, manifest, calls } = await fixture(t);
  const account = await adapter.account(manifest);
  for (const overrides of [
    { aiDeclaration: "true" },
    { visibility: "unlisted" },
    { existingUpload: true },
    {
      aiDeclaration: true,
      copyrightType: "repost",
      sourceUrl: "https://example.com/work",
    },
  ]) {
    await assert.rejects(
      adapter.submit({ ...manifest, ...overrides }, account),
      { code: "invalid_package" },
    );
  }
  assert.equal(
    calls.some(({ args }) => args[4] === "upload"),
    false,
  );
});

test("authenticated archive and envelope confirm only exact settings, and explicit contradictions win", async (t) => {
  for (const [shown, expected] of [
    [
      archive({ creation_statement: { id: 1 }, is_only_self: 1 }),
      ["confirmed", "confirmed"],
    ],
    [
      {
        ...archive(),
        aid: Number(aid),
        creation_statement: { id: 1 },
        is_only_self: 1,
      },
      ["confirmed", "confirmed"],
    ],
    [
      {
        ...archive({ creation_statement: { id: 1 }, is_only_self: 1 }),
        creation_statement: { id: 2 },
        is_only_self: 0,
      },
      ["mismatch", "mismatch"],
    ],
    [
      archive({ creation_statement: { id: -1 }, is_only_self: 0 }),
      ["mismatch", "mismatch"],
    ],
    [
      archive({
        creation_statement: { id: "1" },
        is_only_self: true,
        neutral_mark: "含AI生成内容",
        no_public: 1,
      }),
      ["pending", "pending"],
    ],
    [archive(), ["pending", "pending"]],
  ]) {
    const { adapter, manifest } = await fixture(t, {
      execute: (command, args) =>
        command === "show"
          ? { exitCode: 0, stdout: success + JSON.stringify(shown, null, 2) }
          : {
              exitCode: 0,
              stdout: success + (args.includes("--is-pubing") ? "" : row),
            },
    });
    const requested = {
      ...manifest,
      aiDeclaration: true,
      visibility: "private",
    };
    const result = await adapter.status(
      requested,
      await adapter.account(requested),
      { receipt: { bvid, aid } },
    );
    assert.equal(result.status, "submitted");
    assert.equal(Object.hasOwn(result, "url"), false);
    assert.deepEqual(
      [result.aiDeclarationStatus, result.visibilityStatus],
      expected,
    );
  }
});

test("a previous review status keeps matched IDs and newer settings when the review listing omits the archive", async (t) => {
  const { adapter, manifest } = await fixture(t, {
    execute: (command, args) =>
      command === "show"
        ? {
            exitCode: 0,
            stdout:
              success +
              JSON.stringify(
                archive({ creation_statement: { id: 1 }, is_only_self: 1 }),
                null,
                2,
              ),
          }
        : {
            exitCode: 0,
            stdout: success + (args.includes("--is-pubing") ? "" : row),
          },
  });
  const requested = { ...manifest, aiDeclaration: true, visibility: "private" };
  const result = await adapter.status(
    requested,
    await adapter.account(requested),
    {
      status: "pending_review",
      receipt: { bvid, aid },
    },
  );
  assert.deepEqual(result, {
    status: "pending_review",
    bvid,
    aid,
    coverStatus: "cover_pending",
    aiDeclarationStatus: "confirmed",
    visibilityStatus: "confirmed",
  });
});

test("an envelope for a different archive and a candidate receipt do not prove either setting", async (t) => {
  const { adapter, manifest } = await fixture(t, {
    execute: (command) =>
      command === "show"
        ? {
            exitCode: 0,
            stdout:
              success +
              JSON.stringify(
                {
                  ...archive(),
                  aid: 170002,
                  creation_statement: { id: 1 },
                  is_only_self: 1,
                },
                null,
                2,
              ),
          }
        : { exitCode: 0, stdout: success + row },
  });
  const requested = { ...manifest, aiDeclaration: true, visibility: "private" };
  const receipt = {
    bvid,
    aid,
    aiDeclarationStatus: "confirmed",
    visibilityStatus: "confirmed",
  };
  const result = await adapter.status(
    requested,
    await adapter.account(requested),
    { receipt },
  );
  assert.equal(result.status, "uncertain");
  assert.equal(result.aiDeclarationStatus, "pending");
  assert.equal(result.visibilityStatus, "pending");
});

test("pending CLI declaration uses a single scoped owner GET with exact identity binding", async (t) => {
  const requests = [];
  const { adapter, manifest } = await fixture(t, {
    execute: (command, args) =>
      command === "show"
        ? {
            exitCode: 0,
            stdout:
              success + JSON.stringify(archive({ is_only_self: 1 }), null, 2),
          }
        : {
            exitCode: 0,
            stdout: success + (args.includes("--is-pubing") ? "" : row),
          },
    ownerFetch: async (url, options) => {
      requests.push({ url, options });
      return Response.json({
        code: 0,
        data: {
          archive: {
            bvid,
            aid: Number(aid),
            mid: Number(uid),
            creation_statement: { id: 1 },
            is_only_self: 1,
          },
        },
      });
    },
  });
  const requested = { ...manifest, aiDeclaration: true, visibility: "private" };
  const result = await adapter.status(
    requested,
    await adapter.account(requested),
    { receipt: { bvid, aid } },
  );
  assert.equal(result.status, "submitted");
  assert.equal(result.aiDeclarationStatus, "confirmed");
  assert.equal(result.visibilityStatus, "confirmed");
  assert.equal(requests.length, 1);
  const [{ url, options }] = requests;
  assert.equal(
    url.href,
    `https://member.bilibili.com/x/vupre/web/archive/view?bvid=${bvid}`,
  );
  assert.equal(options.method, "GET");
  assert.equal(options.redirect, "error");
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(
    options.headers.referer,
    "https://member.bilibili.com/platform/upload-manager/article",
  );
  assert.equal(
    options.headers.cookie,
    `SESSDATA=fixture-secret-auth-cookie; DedeUserID=${uid}`,
  );
  assert.equal(JSON.stringify(result).includes("fixture-secret"), false);
});

test("owner fallback only accepts exact typed identity, success status and recognized settings", async (t) => {
  const ownerArchive = {
    bvid,
    aid: Number(aid),
    mid: Number(uid),
    creation_statement: { id: 1 },
    is_only_self: 1,
  };
  const responseFor = (overrides = {}, code = 0) =>
    Response.json({
      code,
      data: { archive: { ...ownerArchive, ...overrides } },
    });
  let response;
  const { adapter, manifest } = await fixture(t, {
    execute: (command, args) =>
      command === "show"
        ? {
            exitCode: 0,
            stdout:
              success + JSON.stringify(archive({ is_only_self: 1 }), null, 2),
          }
        : {
            exitCode: 0,
            stdout: success + (args.includes("--is-pubing") ? "" : row),
          },
    ownerFetch: async () => {
      if (response instanceof Error) throw response;
      return response;
    },
  });
  const requested = { ...manifest, aiDeclaration: true, visibility: "private" };
  const account = await adapter.account(requested);
  for (const candidate of [
    responseFor({ mid: Number(uid) + 1 }),
    responseFor({ mid: uid }),
    responseFor({ aid }),
    responseFor({ aid: Number(aid) + 1 }),
    responseFor({ bvid: "BV1Xx4y1x7Gi" }),
    responseFor({ creation_statement: { id: "1" } }),
    responseFor({}, -101),
    Response.redirect("https://example.com/"),
    new Error("unavailable fixture-secret-auth-cookie"),
  ]) {
    response = candidate;
    const result = await adapter.status(requested, account, {
      receipt: { bvid, aid },
    });
    assert.equal(result.status, "submitted");
    assert.equal(result.aiDeclarationStatus, "pending");
    assert.equal(result.visibilityStatus, "confirmed");
    assert.equal(JSON.stringify(result).includes("fixture-secret"), false);
  }
  response = responseFor({ creation_statement: { id: -1 }, is_only_self: 0 });
  const mismatch = await adapter.status(requested, account, {
    receipt: { bvid, aid },
  });
  assert.equal(mismatch.aiDeclarationStatus, "mismatch");
  assert.equal(mismatch.visibilityStatus, "mismatch");
});

test("owner fallback skips uncorrelated CLI archives and explicit declaration results", async (t) => {
  let shown;
  let requests = 0;
  const { adapter, manifest } = await fixture(t, {
    execute: (command) =>
      command === "show"
        ? { exitCode: 0, stdout: success + JSON.stringify(shown, null, 2) }
        : { exitCode: 0, stdout: success + row },
    ownerFetch: async () => {
      requests += 1;
      return Response.json({ code: 0 });
    },
  });
  const requested = { ...manifest, aiDeclaration: true };
  const account = await adapter.account(requested);
  for (const [value, expected] of [
    [archive({ aid: Number(aid) + 1 }), "pending"],
    [archive({ creation_statement: { id: 1 } }), "confirmed"],
    [archive({ creation_statement: { id: -1 } }), "mismatch"],
  ]) {
    shown = value;
    const result = await adapter.status(requested, account, {
      receipt: { bvid, aid },
    });
    assert.equal(result.aiDeclarationStatus, expected);
  }
  assert.equal(requests, 0);
});

test("a 250-character CLI prefix is accepted only with the owner's full metadata", async (t) => {
  const prefix = `${"甲".repeat(249)}🧪`;
  const fullDescription = `${prefix}\n完整简介尾部和资料来源。`;
  const matched = {
    bvid,
    aid: Number(aid),
    mid: Number(uid),
    title,
    desc: fullDescription,
    creation_statement: { id: 1 },
    is_only_self: 1,
  };
  let owner = matched;
  let requests = 0;
  const { adapter, manifest } = await fixture(t, {
    execute: (command) =>
      command === "show"
        ? {
            exitCode: 0,
            stdout:
              success + JSON.stringify(archive({ desc: prefix }), null, 2),
          }
        : { exitCode: 0, stdout: success + row },
    ownerFetch: async () => {
      requests += 1;
      return Response.json({ code: 0, data: { archive: owner } });
    },
  });
  const requested = {
    ...manifest,
    description: fullDescription,
    aiDeclaration: true,
    visibility: "private",
  };
  const account = await adapter.account(requested);
  const state = { receipt: { bvid, aid } };
  const accepted = await adapter.status(requested, account, state);
  assert.equal(accepted.status, "pending_review");
  assert.equal(accepted.bvid, bvid);
  assert.equal(accepted.aid, aid);
  assert.equal(accepted.aiDeclarationStatus, "confirmed");
  assert.equal(accepted.visibilityStatus, "confirmed");
  assert.equal(requests, 1);

  for (const overrides of [
    { title: "另一稿件" },
    { desc: prefix },
    { desc: `${prefix}不同尾部` },
    { aid: Number(aid) + 1 },
    { bvid: "BV1Xx4y1x7Gi" },
    { mid: Number(uid) + 1 },
    { desc: undefined },
  ]) {
    owner = { ...matched, ...overrides };
    const result = await adapter.status(requested, account, state);
    assert.equal(result.status, "uncertain");
    assert.equal(result.aiDeclarationStatus, "pending");
    assert.equal(Object.hasOwn(result, "bvid"), false);
  }
  assert.equal(requests, 8);
});

test("other descriptions never trigger the owner fallback", async (t) => {
  const prefix = "甲".repeat(250);
  let shownDescription;
  let requests = 0;
  const { adapter, manifest } = await fixture(t, {
    execute: (command) =>
      command === "show"
        ? {
            exitCode: 0,
            stdout:
              success +
              JSON.stringify(archive({ desc: shownDescription }), null, 2),
          }
        : { exitCode: 0, stdout: success + row },
    ownerFetch: async () => {
      requests += 1;
      return Response.json({ code: 0 });
    },
  });
  const requested = {
    ...manifest,
    description: `${prefix}完整简介`,
    aiDeclaration: true,
  };
  const account = await adapter.account(requested);
  for (const candidate of [
    prefix.slice(0, 249),
    `${prefix}…`,
    `乙${prefix.slice(1)}`,
    undefined,
  ]) {
    shownDescription = candidate;
    const result = await adapter.status(requested, account, {
      receipt: { bvid, aid },
    });
    assert.equal(result.status, "uncertain");
  }
  assert.equal(requests, 0);
});

test("manual lookup is read-only and requires one exact candidate with matching archive metadata", async (t) => {
  const duplicateRow = `BV1Xx4y1x7Gi\t${title}\t状态\n`;
  for (const [listed, shown, expectedStatus, expectsShow] of [
    [
      row,
      archive({ creation_statement: { id: 1 }, is_only_self: 1 }),
      "pending_review",
      true,
    ],
    [row, archive({ desc: "another upload" }), "uncertain", true],
    [row + duplicateRow, archive(), "uncertain", false],
    ["", archive(), "uncertain", false],
  ]) {
    const { adapter, manifest, calls } = await fixture(t, {
      execute: (command) =>
        command === "show"
          ? { exitCode: 0, stdout: success + JSON.stringify(shown, null, 2) }
          : command === "list" && { exitCode: 0, stdout: success + listed },
    });
    const requested = {
      ...manifest,
      aiDeclaration: true,
      visibility: "private",
    };
    const result = await adapter.findExisting(
      requested,
      await adapter.account(requested),
    );
    assert.equal(result.status, expectedStatus);
    assert.equal(
      calls.some(({ args }) => args[4] === "show"),
      expectsShow,
    );
    assert.equal(
      calls.some(({ args }) => args[4] === "upload"),
      false,
    );
    if (expectedStatus === "pending_review") {
      assert.equal(result.bvid, bvid);
      assert.equal(result.aiDeclarationStatus, "confirmed");
      assert.equal(result.visibilityStatus, "confirmed");
      assert.equal(result.coverStatus, "cover_pending");
    }
  }
});
