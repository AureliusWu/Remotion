import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import console from "node:console";
import { randomUUID } from "node:crypto";
import {
  link,
  mkdir,
  mkdtemp,
  readFile,
  rmdir,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";
import { videoRoot } from "../lib/workflow-config.mjs";
import { runPublish } from "../publish/command.mjs";
import { createReplacementReader } from "../publish/replace-readback.mjs";
import { validStandaloneEdition } from "../publish/source-evidence.mjs";
import { recoverStalePublishLock, withPublishLock } from "../publish/state.mjs";
import {
  fileHash,
  fingerprintOf,
  jsonBytes,
  readJson,
  sha256,
  validDate,
  validateMetadata,
} from "../publish/verify.mjs";

const usage =
  "npm run book -- BOOK YYYY-MM-DD script|audio|render|submit|release|status [--category ID] [--account ALIAS] [--approval-ref REF] [--unlock TOKEN]";
const fps = 60;
const frameSize = { width: 1920, height: 1080 };
const relative = (file) =>
  path.relative(videoRoot, file).split(path.sep).join("/");
const progress = (message) => console.error(`[读书视频] ${message}`);
const privateRoot = path.join(
  process.env.LOCALAPPDATA ?? homedir(),
  "Remotion-Biliup",
);

function node(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: videoRoot,
      stdio: ["ignore", process.stderr, process.stderr],
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${path.basename(args[0])} failed (${signal ?? code})`),
        );
    });
  });
}

function readBookScript(bytes) {
  const script = JSON.parse(bytes);
  assert(
    script.title?.trim() && script.author?.trim(),
    "Book title and author are required",
  );
  validateMetadata(script.publish, { partial: true });
  assert(
    script.publish.title &&
      script.publish.description &&
      script.publish.tags?.length,
    "Publish title, description and tags are required",
  );
  assert(
    Array.isArray(script.sources) &&
      script.sources.length > 0 &&
      script.sources.every(
        ({ label, url }) => label?.trim() && /^https:\/\//.test(url),
      ),
    "Book source references are required",
  );
  assert(
    Array.isArray(script.scenes) && script.scenes.length >= 2,
    "A book script needs at least two scenes",
  );
  const ids = new Set();
  for (const scene of script.scenes) {
    assert(
      validStandaloneEdition(scene.id) && !ids.has(scene.id),
      "Scene IDs must be unique",
    );
    ids.add(scene.id);
    assert(
      scene.kicker?.trim() &&
        scene.heading?.trim() &&
        scene.subheading?.trim() &&
        scene.visual?.trim(),
      "Each scene needs editorial text and a visual cue",
    );
    assert(
      Array.isArray(scene.lines) &&
        scene.lines.length > 0 &&
        scene.lines.every(
          (line) =>
            typeof line === "string" &&
            line.trim() &&
            [...line].length <= 36 &&
            !/[\r\n]/.test(line),
        ),
      "Each spoken line must fit one caption",
    );
  }
  return script;
}

async function writeScript(script, file) {
  const scenes = script.scenes.map((scene, index) =>
    [
      `## ${index + 1}. ${scene.heading}`,
      "",
      `*${scene.visual}*`,
      "",
      scene.lines.join("  \n"),
    ].join("\n"),
  );
  const lines = [
    `# 《${script.title}》口播与分镜`,
    "",
    `原著作者 ${script.author}`,
    "",
    ...scenes.flatMap((scene) => [scene, ""]),
    "## 投稿文案",
    "",
    script.publish.title,
    "",
    script.publish.description,
    "",
    script.publish.tags.join("、"),
    "",
    "## 资料",
    "",
    ...script.sources.map(({ label, url }) => `- [${label}](${url})`),
    "",
  ];
  await writeFile(file, lines.join("\n"));
  return file;
}

function checkedTimeline(timeline, script, scriptSha256, audioSha256) {
  assert(
    timeline.schemaVersion === 1 &&
      timeline.fps === fps &&
      timeline.scriptSha256 === scriptSha256 &&
      timeline.narrationSha256 === audioSha256 &&
      Number.isSafeInteger(timeline.durationInFrames) &&
      timeline.durationInFrames > 0 &&
      timeline.scenes?.length === script.scenes.length,
    "Run the audio stage for the current script first",
  );
  let endFrame = 0;
  for (const [index, scene] of timeline.scenes.entries()) {
    const expected = script.scenes[index];
    assert(
      scene.id === expected.id &&
        scene.startFrame === endFrame &&
        Number.isSafeInteger(scene.endFrame) &&
        scene.endFrame > scene.startFrame &&
        scene.lines?.length === expected.lines.length,
      "Audio scenes do not match the script or have a timing gap",
    );
    let endLine = scene.startFrame;
    for (const [lineIndex, line] of scene.lines.entries()) {
      assert(
        line.text === expected.lines[lineIndex] &&
          Number.isSafeInteger(line.startFrame) &&
          Number.isSafeInteger(line.endFrame) &&
          line.startFrame >= endLine &&
          line.endFrame > line.startFrame &&
          line.endFrame <= scene.endFrame,
        "Caption timing does not match the narration",
      );
      endLine = line.endFrame;
    }
    endFrame = scene.endFrame;
  }
  assert(
    endFrame === timeline.durationInFrames,
    "Last scene does not match the video duration",
  );
  return timeline;
}

function timestamp(frame) {
  const seconds = Math.floor(frame / fps);
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

async function releaseInputs(ctx) {
  const timelinePath = path.join(ctx.assets, "timeline.json");
  const audioPath = path.join(ctx.assets, "narration.wav");
  const [scriptSha256, timelineSha256, audioSha256, compositionSha256] =
    await Promise.all(
      [ctx.scriptPath, timelinePath, audioPath, ctx.compositionPath].map(
        fileHash,
      ),
    );
  const timeline = checkedTimeline(
    await readJson(timelinePath, "Book timeline"),
    ctx.script,
    scriptSha256,
    audioSha256,
  );
  const fingerprint = fingerprintOf({
    scriptSha256,
    timelineSha256,
    audioSha256,
    compositionSha256,
  });
  return { timeline, fingerprint };
}

async function renderRelease(ctx) {
  const { timeline, fingerprint } = await releaseInputs(ctx);
  const renderFolder = path.join(ctx.output, "renders", fingerprint);
  const renderRecord = path.join(renderFolder, "render.json");
  const video = path.join(renderFolder, `${ctx.releaseId}-bilibili.mp4`);
  const cover = path.join(renderFolder, "cover.png");
  const cached = await readJson(renderRecord, "Book render record").catch(
    (error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    },
  );
  if (cached) {
    assert(
      cached.fingerprint === fingerprint &&
        cached.videoSha256 === (await fileHash(video)) &&
        cached.coverSha256 === (await fileHash(cover)),
      "Saved book output changed; preserve its record and render into a clean folder",
    );
    return { timeline, video, cover, ...cached };
  }

  await mkdir(path.dirname(renderFolder), { recursive: true });
  const staging = await mkdtemp(
    path.join(path.dirname(renderFolder), "rendering-"),
  );
  const stagedVideo = path.join(staging, path.basename(video));
  const stagedCover = path.join(staging, "cover.png");
  const cli = path.join(
    videoRoot,
    "node_modules/@remotion/cli/remotion-cli.js",
  );
  progress("生成投稿封面");
  await node([
    cli,
    "still",
    `${ctx.compositionPrefix}-Cover`,
    stagedCover,
    "--log=warn",
  ]);
  progress(`渲染 1920×1080 / 60 FPS / ${timestamp(timeline.durationInFrames)}`);
  await node([
    cli,
    "render",
    `${ctx.compositionPrefix}-Bilibili`,
    stagedVideo,
    "--codec=h264",
    "--pixel-format=yuv420p",
    "--crf=19",
    "--audio-codec=aac",
    "--audio-bitrate=320k",
    "--image-format=jpeg",
    "--jpeg-quality=88",
    "--concurrency=5",
    "--log=warn",
  ]);
  await node([
    "scripts/verify-export.mjs",
    stagedVideo,
    String(timeline.durationInFrames / fps),
    String(fps),
  ]);
  assert.equal(
    (await releaseInputs(ctx)).fingerprint,
    fingerprint,
    "Book inputs changed during render",
  );
  const record = {
    fingerprint,
    videoSha256: await fileHash(stagedVideo),
    coverSha256: await fileHash(stagedCover),
  };
  await mkdir(renderFolder, { recursive: true });
  await link(stagedVideo, video);
  await link(stagedCover, cover);
  await link(`${stagedVideo}.validation.json`, `${video}.validation.json`);
  await writeFile(renderRecord, jsonBytes(record), { flag: "wx" });
  await Promise.all(
    [stagedVideo, stagedCover, `${stagedVideo}.validation.json`].map((file) =>
      unlink(file),
    ),
  );
  await rmdir(staging);
  return { timeline, video, cover, ...record };
}

async function targetAccount(alias) {
  const config = await readJson(
    process.env.REMOTION_BILIUP_CONFIG ??
      path.join(privateRoot, "publish-config.json"),
    "Private Bilibili config",
  );
  const aliases = Object.keys(config.accounts ?? {});
  const accountAlias = alias ?? (aliases.length === 1 ? aliases[0] : null);
  const accountUid = String(config.accounts?.[accountAlias]?.uid ?? "");
  assert(
    accountAlias &&
      /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(accountAlias) &&
      /^[1-9]\d{0,18}$/.test(accountUid),
    "Select the approved private Bilibili account with --account",
  );
  return { accountAlias, accountUid };
}

async function prepareAndSubmit(ctx, rendered, flags) {
  const account = await targetAccount(flags.account);
  const categoryId = Number(flags.category);
  assert(
    Number.isSafeInteger(categoryId) && categoryId > 0 && categoryId <= 65535,
    "Supply the verified Bilibili category with --category",
  );
  const approvalReference = flags["approval-ref"];
  assert(
    /^[A-Za-z0-9._:-]{1,96}$/.test(approvalReference ?? ""),
    "Supply --approval-ref for the explicit authorization of this exact book and date",
  );
  const evidence = {
    schema: "remotion-publish-source/v1",
    edition: ctx.book,
    releaseId: ctx.releaseId,
    periodStart: ctx.date,
    periodEnd: ctx.date,
    retrievedOn: ctx.date,
    compositionId: `${ctx.compositionPrefix}-Bilibili`,
    video: { path: relative(rendered.video), sha256: rendered.videoSha256 },
    cover: { path: relative(rendered.cover), sha256: rendered.coverSha256 },
    profile: { ...frameSize, fps, frames: rendered.timeline.durationInFrames },
    metadata: {
      ...ctx.script.publish,
      description: `${ctx.script.publish.description}\n\n${rendered.timeline.scenes.map((scene, index) => `${timestamp(scene.startFrame)} ${ctx.script.scenes[index].heading}`).join("｜")}\n\n旁白使用本地 AI 合成，画面为原创动画。`,
    },
    sources: ctx.script.sources,
  };
  const evidenceFile = path.join(ctx.output, "source-evidence.json");
  const metadataFile = path.join(ctx.output, "publish-metadata.json");
  await writeFile(evidenceFile, jsonBytes(evidence));
  await writeFile(
    metadataFile,
    jsonBytes({
      ...evidence.metadata,
      ...account,
      categoryId,
      copyrightType: "self-made",
      aiDeclaration: true,
      visibility: "public",
    }),
  );
  const request = { edition: ctx.book, "release-id": ctx.releaseId };
  progress("复核成片并准备原创新稿，附 AI 合成声明");
  const prepared = await runPublish({
    ...request,
    mode: "prepare",
    "source-evidence": relative(evidenceFile),
    metadata: relative(metadataFile),
  });
  const approval = path.join(
    videoRoot,
    "out",
    "publish",
    `${ctx.releaseId}-${randomUUID()}-approval.json`,
  );
  await writeFile(
    approval,
    jsonBytes({
      schemaVersion: 1,
      authorization: "explicit-user-request",
      approvedAt: new Date().toISOString(),
      approvalReference,
      platform: "bilibili",
      edition: ctx.book,
      releaseId: ctx.releaseId,
      ...account,
      fingerprint: prepared.fingerprint,
    }),
    { flag: "wx" },
  );
  progress("提交 B 站并回查稿件");
  return runPublish({
    ...request,
    mode: "submit",
    "approval-file": relative(approval),
  });
}

async function publicationReport(result) {
  const bvid = result.receipt?.verified === true && result.receipt.bvid;
  if (!bvid) return result;
  let publicReadback;
  try {
    const read = createReplacementReader({ videoRoot, ...result.identity });
    const snapshot = await read(bvid);
    assert.equal(snapshot.aid, result.receipt.aid);
    publicReadback = {
      state: snapshot.state,
      aiDeclaration: snapshot.aiDeclaration,
      publicSetting: snapshot.publicSetting,
      cid: snapshot.publicCid,
      anonymousPlayback: snapshot.anonymousPlayback,
      checkedAt: snapshot.checkedAt,
    };
  } catch {
    publicReadback = null;
  }
  return {
    ...result,
    ...(publicReadback?.state === 0 &&
      publicReadback.aiDeclaration &&
      publicReadback.publicSetting &&
      publicReadback.anonymousPlayback && {
        status: "published",
        publisherStatus: result.status,
      }),
    bvid,
    url: `https://www.bilibili.com/video/${bvid}/`,
    publicReadback,
  };
}

async function followPublication(request, result) {
  const deadline = Date.now() + 3 * 60_000;
  let report = await publicationReport(result);
  while (
    result.startedAt &&
    !report.publicReadback?.anonymousPlayback &&
    !["rejected", "needs_attention"].includes(result.status) &&
    Date.now() < deadline
  ) {
    await delay(Math.min(15_000, Math.max(0, deadline - Date.now())));
    try {
      result = await runPublish({ ...request, remote: true });
      report = await publicationReport(result);
    } catch {
      // A failed read never starts another submission. Keep the prior receipt.
    }
  }
  return report;
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      category: { type: "string" },
      account: { type: "string" },
      "approval-ref": { type: "string" },
      unlock: { type: "string" },
      help: { type: "boolean" },
    },
  });
  if (values.help) return { usage };
  const [book, date, mode = "script"] = positionals;
  assert(
    positionals.length <= 3 &&
      validStandaloneEdition(book) &&
      validDate(date) &&
      ["script", "audio", "render", "submit", "release", "status"].includes(
        mode,
      ),
    usage,
  );
  const releaseId = `${book}-${date.replaceAll("-", "")}`;
  const request = { edition: book, "release-id": releaseId, mode: "status" };
  if (mode === "status") {
    const result = await runPublish({
      ...request,
      remote: true,
      ...(values.unlock && { unlock: values.unlock }),
    }).catch((error) => {
      if (!values.unlock && error.code === "ENOENT")
        return { status: "new", edition: book, releaseId };
      throw error;
    });
    return publicationReport(result);
  }
  const effect = path.join(videoRoot, "effects", book);
  const compositionPrefix = book
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
  const scriptPath = path.join(effect, "script.json");
  const script = readBookScript(await readFile(scriptPath, "utf8"));
  const output = path.join(videoRoot, "out", releaseId);
  const assets = path.join(videoRoot, "public", book);
  const ctx = {
    book,
    date,
    releaseId,
    output,
    assets,
    script,
    scriptPath,
    compositionPrefix,
    compositionPath: path.join(effect, `${compositionPrefix}Film.tsx`),
  };
  const identity = {
    platform: "bilibili",
    edition: "book-video",
    accountAlias: "book-workflow",
    releaseId: book,
    videoSha256: sha256(book),
  };
  const lockRoot = path.join(videoRoot, "out", ".book-locks");
  if (values.unlock)
    await recoverStalePublishLock(lockRoot, identity, values.unlock);
  return withPublishLock(lockRoot, identity, async () => {
    if (["submit", "release"].includes(mode)) {
      const prior = await runPublish(request).catch((error) => {
        if (
          error.code !== "ENOENT" &&
          error.message !== "No prepared manifest for this edition and release"
        )
          throw error;
        return null;
      });
      if (
        prior?.receipt ||
        prior?.startedAt ||
        [
          "uploading",
          "uncertain",
          "submitted",
          "pending_review",
          "published",
          "rejected",
        ].includes(prior?.status)
      ) {
        return publicationReport(
          await runPublish({ ...request, remote: true }),
        );
      }
    }
    await mkdir(output, { recursive: true });
    const manuscript = await writeScript(
      script,
      path.join(output, "script.md"),
    );
    if (mode === "script")
      return {
        manuscript,
        scenes: script.scenes.length,
        lines: script.scenes.flatMap((scene) => scene.lines).length,
      };
    if (["audio", "release"].includes(mode)) {
      progress("从定稿合成旁白并测量句子时长");
      const { buildBookAudio } = await import("./audio.mjs");
      const audio = await buildBookAudio({ scriptPath, outputDir: assets });
      if (mode === "audio") return { manuscript, ...audio };
    }
    const rendered = await renderRelease(ctx);
    if (mode === "render")
      return {
        manuscript,
        video: rendered.video,
        cover: rendered.cover,
        frames: rendered.timeline.durationInFrames,
      };
    return followPublication(
      request,
      await prepareAndSubmit(ctx, rendered, values),
    );
  });
}

try {
  const result = await main();
  console.log(JSON.stringify(result, null, 2));
  if (result.status) {
    const acknowledged =
      ["submitted", "pending_review", "published"].includes(result.status) &&
      result.receipt?.verified === true &&
      result.checks?.aiDeclarationStatus === "confirmed";
    process.exitCode = acknowledged ? 0 : 2;
  }
} catch (error) {
  console.error(`[读书视频] ${error.message}`);
  if (error.code === "PUBLISH_LOCKED" && error.lock)
    console.error(JSON.stringify(error.lock));
  process.exitCode = 1;
}
