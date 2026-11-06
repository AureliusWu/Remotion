import { execFile } from "node:child_process";
import { open, realpath, stat } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import {
  fileHash,
  inside,
  metadataFrom,
  readJson,
  validateMetadata,
} from "./verify.mjs";

// Official v1.3.4 Windows x64 CLI, extracted from the release zip after
// checking its digest against the GitHub release asset metadata.
const version = "1.3.4";
const binarySha256 =
  "b508c56277b0ddfb479ee32fcef191e65290411e490973aa82fe5d46af6eebb6";
const logFilter =
  "off,biliup_cli::uploader=info,biliup::uploader::bilibili=info";
const listWindow = ["--from-page=1", "--max-pages=3"];
const creatorArchiveUrl =
  "https://member.bilibili.com/x/vupre/web/archive/view";
const creatorReferer =
  "https://member.bilibili.com/platform/upload-manager/article";
const creatorUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const bvidPattern = /^BV[0-9A-Za-z]{10}$/;
const numericId = /^[1-9][0-9]{0,18}$/;
const aliasPattern = /^[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/;
const controls = /[\u0000-\u001f\u007f]/u;
const authLog =
  /^(?:\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s+)?INFO\s+biliup_cli::uploader:\s+user: (.+)$/;
const coverLog =
  /^(?:\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s+)?INFO\s+biliup_cli::uploader:\s+(\S+)$/;
const submitLog =
  /^(?:\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\s+)?INFO\s+biliup::uploader::bilibili:\s+(.+)$/;

const errors = {
  adapter_unavailable:
    "Install the verified biliup 1.3.4 Windows x64 CLI and run publish --doctor.",
  adapter_unconfirmed:
    "biliup returned an unconfirmed result. Review the draft in Bilibili Creator Center.",
  auth_required:
    "Use the private account configuration and log in manually with the pinned biliup CLI.",
  account_mismatch:
    "The configured account and the authenticated biliup identity did not agree.",
  terms_required:
    "Accept the pinned biliup personal research terms in the private account configuration first.",
  rate_limited:
    "Bilibili limited the request. Check the existing draft before taking further action.",
  verification_required:
    "Complete the platform's security verification manually.",
  network_error:
    "The connection failed. Check Creator Center before taking further action.",
  upload_timeout:
    "biliup timed out. Check Creator Center before taking further action.",
  cover_pending:
    "An approved local JPEG or a verified remote cover is required.",
  invalid_package:
    "The media or submission metadata differs from the approved package.",
  duplicate_candidate:
    "An existing submission matches the title or upload filename. Check Creator Center for a duplicate.",
};

function failure(code) {
  return Object.assign(new Error(errors[code]), { code });
}

function id(value) {
  if (typeof value === "number" && Number.isSafeInteger(value))
    value = String(value);
  return typeof value === "string" && numericId.test(value) ? value : undefined;
}

function lines(stdout = "") {
  return stdout.replace(/\x1b\[[0-9;]*m/g, "").split(/\r?\n/);
}

function coverUrl(value) {
  if (typeof value !== "string") return undefined;
  const url = value.startsWith("//") ? `https:${value}` : value;
  return /^https:\/\/[0-9a-z-]+\.hdslb\.com\/bfs\/archive\/[0-9A-Za-z_.-]+$/u.test(
    url,
  )
    ? url
    : undefined;
}

function classify(result) {
  if (result.timedOut) return "upload_timeout";
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (/验证码|安全验证|captcha|geetest|\bcode\s*[:=]\s*-352\b/i.test(output))
    return "verification_required";
  if (/频繁|rate.limit|\b(?:429|412)\b/i.test(output)) return "rate_limited";
  if (
    /未登录|登录失效|cookie.*expired|credential validation failed|\bcode\s*[:=]\s*-101\b/i.test(
      output,
    )
  )
    return "auth_required";
  if (/cover_up error|cover:|封面上传失败/i.test(output))
    return "cover_pending";
  if (/connection|timed out|dns|network|网络|连接失败/i.test(output))
    return "network_error";
  return "adapter_unconfirmed";
}

function executeBiliup(executable, args, { timeout, cwd }) {
  return new Promise((resolve) => {
    const env = Object.fromEntries(
      [
        "SystemRoot",
        "WINDIR",
        "LOCALAPPDATA",
        "APPDATA",
        "USERPROFILE",
        "TEMP",
        "TMP",
      ]
        .filter((name) => process.env[name] !== undefined)
        .map((name) => [name, process.env[name]]),
    );
    const child = execFile(
      executable,
      args,
      {
        cwd,
        encoding: "utf8",
        env,
        maxBuffer: 4 * 1024 * 1024,
        shell: false,
        timeout,
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        resolve({
          exitCode: error ? (error.code ?? 1) : 0,
          stdout,
          stderr,
          timedOut: error?.killed === true && error.code == null,
        });
      },
    );
    child.stdin?.end();
  });
}

async function privateJson(file, root, workspace) {
  if (!path.isAbsolute(file)) throw failure("auth_required");
  try {
    const resolved = await realpath(file);
    const info = await stat(resolved);
    if (
      !inside(root, resolved) ||
      inside(workspace, resolved) ||
      !info.isFile() ||
      info.nlink !== 1 ||
      info.size > 128 * 1024
    )
      throw failure("auth_required");
    if (
      process.platform !== "win32" &&
      (info.mode & 0o077 || info.uid !== process.getuid())
    )
      throw failure("auth_required");
    const data = await readJson(
      resolved,
      "Private biliup configuration",
      128 * 1024,
    );
    return { resolved, data };
  } catch {
    throw failure("auth_required");
  }
}

function checkCookie(data, uid) {
  const cookies = data?.cookie_info?.cookies;
  if (!Array.isArray(cookies) || id(data?.token_info?.mid) !== uid)
    throw failure("account_mismatch");
  for (const name of ["DedeUserID", "SESSDATA", "bili_jct"]) {
    const entries = cookies.filter((cookie) => cookie?.name === name);
    if (
      entries.length !== 1 ||
      typeof entries[0].value !== "string" ||
      !entries[0].value ||
      controls.test(entries[0].value)
    )
      throw failure("auth_required");
    if (name === "DedeUserID" && entries[0].value !== uid)
      throw failure("account_mismatch");
  }
}

function authenticated(stdout, nickname) {
  const names = lines(stdout)
    .map((line) => authLog.exec(line)?.[1])
    .filter(Boolean);
  if (names.length !== 1 || names[0] !== nickname)
    throw failure("account_mismatch");
}

function rows(stdout) {
  return lines(stdout).flatMap((line) => {
    const [bvid, title, ...rest] = line.split("\t");
    return bvidPattern.test(bvid) && title && rest.length
      ? [{ bvid, title }]
      : [];
  });
}

const normalizeDuplicateTitle = (value) => value.normalize("NFKC").trim();

function responseReceipt(stdout) {
  const messages = lines(stdout)
    .map((line) => submitLog.exec(line)?.[1])
    .filter(Boolean);
  const accepted = messages.indexOf("Web 接口投稿成功");
  if (accepted < 1 || messages.lastIndexOf("Web 接口投稿成功") !== accepted)
    return {};
  const response =
    /^ResponseData \{ code: 0, data: Some\(Object \{(.*)\}\), message: /u.exec(
      messages[accepted - 1],
    )?.[1];
  if (
    !response ||
    !/^(?:"[0-9a-z_]+": (?:String\("(?:[^"\\]|\\.)*"\)|Number\(-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\)|Bool\((?:true|false)\)|Null)(?:, |$))+$/u.test(
      response,
    )
  )
    return {};
  const bvid = /(?:^|, )"bvid": String\("(BV[0-9A-Za-z]{10})"\)(?:, |$)/u.exec(
    response,
  )?.[1];
  const rawAid =
    /(?:^|, )"aid": (?:Number\(([1-9][0-9]{0,18})\)|String\("([1-9][0-9]{0,18})"\))(?:, |$)/u.exec(
      response,
    );
  const aid = id(rawAid?.[1] ?? rawAid?.[2]);
  const covers = lines(stdout)
    .map((line) => coverUrl(coverLog.exec(line)?.[1]))
    .filter(Boolean);
  return {
    ...(bvid ? { bvid } : {}),
    ...(aid ? { aid } : {}),
    ...(covers.length === 1 ? { coverUrl: covers[0] } : {}),
  };
}

function showResult(stdout) {
  // The pinned show command emits tracing followed by one pretty-printed JSON object.
  const output = lines(stdout);
  const start = output.indexOf("{");
  if (start < 0) return undefined;
  try {
    return JSON.parse(output.slice(start).join("\n"));
  } catch {
    return undefined;
  }
}

function settingStatus(values, expected, alternatives) {
  if (values.some((value) => alternatives.includes(value))) return "mismatch";
  return values.includes(expected) ? "confirmed" : "pending";
}

function remoteSettings(manifest, candidates = []) {
  const settings = {};
  if (manifest.aiDeclaration === true) {
    // The modern declaration has a numeric ID. Legacy text/neutral_mark can
    // also describe a platform-applied label and cannot attest to this choice.
    settings.aiDeclarationStatus = settingStatus(
      candidates.map((candidate) => candidate.creation_statement?.id),
      1,
      [-1, 2, 3, 4],
    );
  }
  if (manifest.visibility === "private") {
    settings.visibilityStatus = settingStatus(
      candidates.map((candidate) => candidate.is_only_self),
      1,
      [0],
    );
  }
  return settings;
}

function uncertainStatus(manifest) {
  return {
    status: "uncertain",
    coverStatus: "cover_pending",
    code: "adapter_unconfirmed",
    ...remoteSettings(manifest),
  };
}

async function reviewedUploadArgs(manifest) {
  try {
    validateMetadata(metadataFrom(manifest));
  } catch {
    throw failure("invalid_package");
  }
  const {
    videoPath,
    videoSha256,
    uploadCoverPath,
    uploadCoverSha256,
    title,
    description,
    tags,
    categoryId,
    copyrightType,
    sourceUrl,
    aiDeclaration,
    visibility,
  } = manifest;
  if (
    manifest.platform !== "bilibili" ||
    manifest.mediaQa !== "passed" ||
    manifest.existingUpload === true ||
    categoryId === null ||
    copyrightType === null ||
    (aiDeclaration !== undefined && typeof aiDeclaration !== "boolean") ||
    (aiDeclaration === true && copyrightType !== "self-made") ||
    (visibility !== undefined && !["public", "private"].includes(visibility))
  )
    throw failure("invalid_package");
  if (
    typeof videoPath !== "string" ||
    !path.isAbsolute(videoPath) ||
    path.extname(videoPath).toLowerCase() !== ".mp4"
  )
    throw failure("invalid_package");
  if (
    typeof uploadCoverPath !== "string" ||
    !path.isAbsolute(uploadCoverPath) ||
    !/\.jpe?g$/i.test(uploadCoverPath)
  )
    throw failure("cover_pending");
  try {
    if (!(await stat(uploadCoverPath)).isFile()) throw failure("cover_pending");
    const file = await open(uploadCoverPath, "r");
    try {
      const magic = Buffer.alloc(3);
      await file.read(magic, 0, 3, 0);
      if (!magic.equals(Buffer.from([0xff, 0xd8, 0xff])))
        throw failure("cover_pending");
    } finally {
      await file.close();
    }
    if ((await fileHash(uploadCoverPath)) !== uploadCoverSha256)
      throw failure("cover_pending");
    if (
      !(await stat(videoPath)).isFile() ||
      (await fileHash(videoPath)) !== videoSha256
    )
      throw failure("invalid_package");
  } catch (error) {
    throw failure(
      error?.code === "cover_pending" ? "cover_pending" : "invalid_package",
    );
  }
  return [
    "upload",
    "--submit=web",
    `--copyright=${copyrightType === "self-made" ? 1 : 2}`,
    ...(copyrightType === "repost" ? [`--source=${sourceUrl}`] : []),
    `--tid=${categoryId}`,
    `--cover=${uploadCoverPath}`,
    `--title=${title}`,
    `--desc=${description}`,
    `--tag=${tags.join(",")}`,
    ...(aiDeclaration === true
      ? [`--extra-fields=${JSON.stringify({ creation_statement: { id: 1 } })}`]
      : []),
    ...(visibility === "private" ? ["--is-only-self=1"] : []),
    "--",
    videoPath,
  ];
}

export function createBilibiliAdapter({
  videoRoot,
  privateRoot = path.join(
    process.env.LOCALAPPDATA ?? homedir(),
    "Remotion-Biliup",
  ),
  configPath = process.env.REMOTION_BILIUP_CONFIG ??
    path.join(privateRoot, "publish-config.json"),
  executable = process.env.REMOTION_BILIUP_EXE ??
    path.join(privateRoot, version, "biliup.exe"),
  execute = executeBiliup,
  expectedBinarySha256 = binarySha256,
  ownerFetch = execute === executeBiliup ? globalThis.fetch : undefined,
} = {}) {
  const accounts = new WeakMap();
  let probe;

  async function run(file, args, timeout = 30_000, cwd = path.dirname(file)) {
    try {
      return await execute(file, args, { cwd, timeout });
    } catch {
      throw failure("adapter_unconfirmed");
    }
  }

  async function checkBinary() {
    if (
      execute === executeBiliup &&
      (process.platform !== "win32" ||
        process.arch !== "x64" ||
        expectedBinarySha256 !== binarySha256)
    )
      throw failure("adapter_unavailable");
    try {
      if (
        !path.isAbsolute(executable) ||
        path.extname(executable).toLowerCase() !== ".exe"
      )
        throw failure("adapter_unavailable");
      const file = await realpath(executable);
      if (
        !(await stat(file)).isFile() ||
        (await fileHash(file)) !== expectedBinarySha256
      )
        throw failure("adapter_unavailable");
      return file;
    } catch {
      throw failure("adapter_unavailable");
    }
  }

  async function capabilities() {
    probe ??= (async () => {
      const file = await checkBinary();
      for (const [args, strings] of [
        [["--version"], [`biliup-cli ${version}`]],
        [["--help"], ["--user-cookie", "--rust-log"]],
        [
          ["upload", "--help"],
          [
            "--submit",
            "web",
            "--cover",
            "--title",
            "--desc",
            "--tag",
            "--tid",
            "--copyright",
            "--source",
            "--extra-fields",
            "--is-only-self",
          ],
        ],
        [
          ["list", "--help"],
          ["--from-page", "--max-pages", "--is-pubing", "--not-pubed"],
        ],
        [["show", "--help"], ["<VID>"]],
      ]) {
        const result = await run(file, args, 10_000);
        const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
        if (
          result.exitCode !== 0 ||
          !strings.every((flag) => output.includes(flag))
        )
          throw failure("adapter_unavailable");
      }
      return file;
    })();
    return probe;
  }

  async function accountContext(manifest) {
    const alias = manifest.accountAlias;
    const uid = id(manifest.accountUid);
    if (typeof alias !== "string" || !aliasPattern.test(alias) || !uid)
      throw failure("auth_required");
    let root;
    let workspace;
    try {
      root = await realpath(privateRoot);
      workspace = await realpath(path.dirname(videoRoot));
      if (execute === executeBiliup && !inside(await realpath(homedir()), root))
        throw failure("auth_required");
      if (inside(workspace, root)) throw failure("auth_required");
    } catch {
      throw failure("auth_required");
    }
    const { resolved, data } = await privateJson(configPath, root, workspace);
    if (data?.schemaVersion !== 1 || data.acceptPersonalResearchTerms !== true)
      throw failure("terms_required");
    const entry =
      data.accounts && Object.hasOwn(data.accounts, alias)
        ? data.accounts[alias]
        : undefined;
    if (!entry || id(entry.uid) !== uid) throw failure("account_mismatch");
    const { nickname, cookieFile } = entry;
    if (
      typeof nickname !== "string" ||
      !nickname.trim() ||
      controls.test(nickname) ||
      typeof cookieFile !== "string" ||
      !/^[0-9A-Za-z][0-9A-Za-z._-]{0,63}\.json$/i.test(cookieFile)
    )
      throw failure("auth_required");
    const cookie = await privateJson(
      path.join(path.dirname(resolved), cookieFile),
      root,
      workspace,
    );
    checkCookie(cookie.data, uid);
    return {
      alias,
      uid,
      nickname,
      cookieFile: cookie.resolved,
      root,
      workspace,
    };
  }

  async function call(context, args, timeout) {
    const file = await capabilities();
    const result = await run(
      file,
      ["--user-cookie", context.cookieFile, "--rust-log", logFilter, ...args],
      timeout,
      path.dirname(context.cookieFile),
    );
    // The pinned CLI can refresh the private file. Recheck identity without logging credentials.
    checkCookie(
      (await privateJson(context.cookieFile, context.root, context.workspace))
        .data,
      context.uid,
    );
    return result;
  }

  async function list(context, filter = []) {
    const result = await call(context, ["list", ...listWindow, ...filter]);
    if (result.exitCode !== 0) throw failure(classify(result));
    authenticated(result.stdout, context.nickname);
    return rows(result.stdout);
  }

  async function currentContext(manifest, account) {
    const previous = accounts.get(account);
    const context = await accountContext(manifest);
    if (
      !previous ||
      previous.alias !== context.alias ||
      previous.uid !== context.uid ||
      previous.nickname !== context.nickname ||
      previous.cookieFile !== context.cookieFile
    )
      throw failure("account_mismatch");
    return context;
  }

  async function readOwnerArchive(context, bvid, aid) {
    if (!ownerFetch) return undefined;
    try {
      const { data } = await privateJson(
        context.cookieFile,
        context.root,
        context.workspace,
      );
      checkCookie(data, context.uid);
      const session = data.cookie_info.cookies.find(
        (cookie) => cookie?.name === "SESSDATA",
      ).value;
      if (/[\u0000-\u0020\u007f;]/u.test(session)) return undefined;
      const url = new URL(creatorArchiveUrl);
      url.searchParams.set("bvid", bvid);
      const response = await ownerFetch(url, {
        method: "GET",
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
        headers: {
          accept: "application/json",
          referer: creatorReferer,
          "user-agent": creatorUserAgent,
          cookie: `SESSDATA=${session}; DedeUserID=${context.uid}`,
        },
      });
      if (response.status !== 200 || response.redirected) return undefined;
      const payload = await response.json();
      const archive = payload?.data?.archive;
      if (
        payload?.code === 0 &&
        archive?.bvid === bvid &&
        typeof archive.aid === "number" &&
        id(archive.aid) &&
        (aid === undefined || id(archive.aid) === aid) &&
        typeof archive.mid === "number" &&
        id(archive.mid) === context.uid
      )
        return payload.data;
    } catch {
      // Network, auth and schema failures leave the already matched CLI
      // observation intact. The credential, response and error stay local.
    }
    return undefined;
  }

  async function inspectStatus(manifest, context, state, all) {
    const receipt = state?.receipt;
    const expectedBvid = bvidPattern.test(receipt?.bvid ?? "")
      ? receipt.bvid
      : undefined;
    const expectedAid = id(receipt?.aid);
    const uncertain = uncertainStatus(manifest);
    if (!expectedBvid && !expectedAid) return uncertain;
    if (
      expectedBvid &&
      !all.some(
        (row) => row.bvid === expectedBvid && row.title === manifest.title,
      )
    )
      return uncertain;

    const result = await call(context, [
      "show",
      expectedBvid ?? `av${expectedAid}`,
    ]);
    if (result.exitCode !== 0) return { ...uncertain, code: classify(result) };
    authenticated(result.stdout, context.nickname);
    const shown = showResult(result.stdout);
    const archive = shown?.archive;
    const bvid = archive?.bvid ?? expectedBvid;
    const aid = id(archive?.aid);
    if (
      !archive ||
      !bvidPattern.test(bvid ?? "") ||
      !aid ||
      (expectedBvid && bvid !== expectedBvid) ||
      (expectedAid ? aid !== expectedAid : !archive.bvid) ||
      (Object.hasOwn(shown, "bvid") && shown.bvid !== bvid) ||
      (Object.hasOwn(shown, "aid") && id(shown.aid) !== aid) ||
      archive.title !== manifest.title ||
      !all.some((row) => row.bvid === bvid && row.title === manifest.title)
    )
      return uncertain;

    const needsFullDescription = archive.desc !== manifest.description;
    if (
      needsFullDescription &&
      (typeof manifest.description !== "string" ||
        archive.desc !== [...manifest.description].slice(0, 250).join(""))
    )
      return uncertain;

    const candidates = [archive, shown];
    let settings = remoteSettings(manifest, candidates);
    if (needsFullDescription || settings.aiDeclarationStatus === "pending") {
      const ownerArchive = (await readOwnerArchive(context, bvid, aid))
        ?.archive;
      // The CLI can return the first 250 characters. Only the matching
      // owner's full metadata can corroborate that truncated description.
      if (
        needsFullDescription &&
        (ownerArchive?.title !== manifest.title ||
          ownerArchive?.desc !== manifest.description)
      )
        return uncertain;
      if (ownerArchive)
        settings = remoteSettings(manifest, [...candidates, ownerArchive]);
    }

    const requestedCover = coverUrl(receipt.coverUrl);
    const remoteCover = coverUrl(archive.cover);
    const coverStatus =
      requestedCover && remoteCover === requestedCover
        ? "confirmed"
        : "cover_pending";
    const matches = (row) => row.bvid === bvid && row.title === manifest.title;
    let status = "submitted";
    if (
      typeof archive.reject_reason === "string" &&
      archive.reject_reason.trim() &&
      (await list(context, ["--not-pubed"])).some(matches)
    ) {
      status = "rejected";
    } else if ((await list(context, ["--is-pubing"])).some(matches)) {
      status = "pending_review";
    }
    // Preserve a stronger previous workflow observation. The settings above
    // still came from the matching archive, independently of review state.
    if (
      state.status === "published" ||
      (state.status === "rejected" && status !== "rejected")
    )
      return { ...uncertain, ...settings };
    if (state.status === "pending_review" && status === "submitted")
      status = "pending_review";
    return {
      status,
      bvid,
      aid,
      ...(manifest.visibility !== "private"
        ? { url: `https://www.bilibili.com/video/${bvid}/` }
        : {}),
      coverStatus,
      ...(requestedCover ? { coverUrl: requestedCover } : {}),
      ...settings,
    };
  }

  return {
    async readCreatorArchive(manifest, bvid) {
      if (typeof bvid !== "string" || !bvidPattern.test(bvid))
        throw new Error("Invalid Bilibili BV number.");
      const context = await accountContext(manifest);
      const result = await readOwnerArchive(context, bvid);
      if (!result) throw failure("adapter_unconfirmed");
      return result;
    },

    async doctor() {
      try {
        await capabilities();
        return {
          mode: "doctor",
          adapter: "biliup",
          adapterStatus: "available",
          toolVersion: version,
          accountCheck: "requires_manual_setup",
          coverInput: "approved_local_jpeg",
          aiDeclarationInput: "web_creation_statement",
          aiDeclarationReadback: "authenticated_creator_archive",
          privateVisibilityInput: "is_only_self",
          publicPlaybackCheck: "manual",
        };
      } catch {
        return {
          mode: "doctor",
          adapter: "biliup",
          adapterStatus: "unavailable",
          toolVersion: null,
          accountCheck: "requires_manual_setup",
          code: "adapter_unavailable",
        };
      }
    },

    async account(manifest) {
      const context = await accountContext(manifest);
      await list(context);
      const account = Object.freeze({
        alias: context.alias,
        uid: context.uid,
        nickname: context.nickname,
        toolVersion: version,
      });
      accounts.set(account, context);
      return account;
    },

    async preflight(manifest, account) {
      const context = await currentContext(manifest, account);
      await reviewedUploadArgs(manifest);
      const filename = path.basename(manifest.videoPath);
      const candidateTitles = new Set(
        [
          manifest.title,
          filename,
          path.basename(filename, path.extname(filename)),
        ].map(normalizeDuplicateTitle),
      );
      if (
        (await list(context)).some(({ title }) =>
          candidateTitles.has(normalizeDuplicateTitle(title)),
        )
      )
        throw failure("duplicate_candidate");
    },

    async submit(manifest, account) {
      const args = await reviewedUploadArgs(manifest);
      const context = await currentContext(manifest, account);
      if ((await checkBinary()) !== (await capabilities()))
        throw failure("adapter_unavailable");
      const result = await call(context, args, 45 * 60_000);
      try {
        authenticated(result.stdout, context.nickname);
      } catch {
        throw failure(
          result.exitCode === 0 ? "account_mismatch" : classify(result),
        );
      }
      const receipt = responseReceipt(result.stdout);
      return {
        ...receipt,
        coverStatus: "cover_pending",
        ...remoteSettings(manifest),
        ...(receipt.bvid || receipt.aid
          ? result.exitCode === 0
            ? {}
            : { code: classify(result) }
          : {
              code:
                result.exitCode === 0
                  ? "adapter_unconfirmed"
                  : classify(result),
            }),
      };
    },

    async status(manifest, account, state) {
      const context = await currentContext(manifest, account);
      const all = await list(context);
      return inspectStatus(manifest, context, state, all);
    },

    async findExisting(manifest, account) {
      const context = await currentContext(manifest, account);
      const all = await list(context);
      const bvids = new Set(
        all
          .filter((row) => row.title === manifest.title)
          .map((row) => row.bvid),
      );
      if (bvids.size !== 1) return uncertainStatus(manifest);
      const [bvid] = bvids;
      return inspectStatus(manifest, context, { receipt: { bvid } }, all);
    },
  };
}
