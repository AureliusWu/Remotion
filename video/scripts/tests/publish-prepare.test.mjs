import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  preparePackage,
  readPreparedPackage,
  withPackageLock,
} from "../publish/prepare.mjs";
import {
  fileHash,
  jsonBytes,
  makeUploadCover,
  sha256,
  validateMetadata,
} from "../publish/verify.mjs";
import {
  publishIdentity,
  readPublishState,
  withPublishLock,
} from "../publish/state.mjs";

const edition = "ai-weekly";
const releaseId = "ai-weekly-20261030";
const compositionId = "AiWeekly-Bilibili";
const source = "https://example.org/news";
const videoName = `${releaseId}-bilibili-1080p60.mp4`;
const jpeg = Buffer.from([255, 216, 3, 4, 255, 217]);
const configured = {
  accountAlias: "test-account",
  accountUid: "123456",
  categoryId: 1,
  copyrightType: "self-made",
};
const videoProof = {
  width: 1920,
  height: 1080,
  fps: 60,
  frames: 360,
  durationSeconds: 6,
  codec: "h264",
};
const audioProof = {
  sampleRate: 48000,
  channels: 2,
  durationSeconds: 6,
  codec: "aac",
};
const stubMedia = {
  mediaVerifier: async () => ({
    status: "passed",
    fullDecode: "passed",
    video: videoProof,
    audio: audioProof,
  }),
  coverMaker: async () => jpeg,
};

async function fixture(t) {
  const temp = await realpath(
    await mkdtemp(path.join(tmpdir(), "remotion-publish-prepare-")),
  );
  t.after(async () => {
    const base = await realpath(tmpdir());
    assert.equal(path.dirname(await realpath(temp)), base);
    assert(path.basename(temp).startsWith("remotion-publish-prepare-"));
    await rm(temp, { recursive: true });
  });
  const videoRoot = path.join(temp, "video");
  const outputRoot = path.join(videoRoot, "out", "publish-validation", "demo");
  const request = {
    edition,
    options: { platform: "bilibili" },
    videoRoot,
    outputRoot,
  };
  const create = async (relative, contents) => {
    const file = path.join(temp, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, contents);
    return file;
  };
  const json = (relative, value) => create(relative, jsonBytes(value));
  const video = await create(
    `video/out/${videoName}`,
    Buffer.from("fixture binary, media decode injected only in test"),
  );
  const videoSha256 = await fileHash(video);
  const videoBytes = (await readFile(video)).length;
  const storyboard = {
    periodStart: "2026-10-26",
    periodEnd: "2026-10-30",
    retrievedOn: "2026-10-30",
    newsCount: 1,
    shots: [
      { id: "intro", durationSeconds: 2, narration: ["开场。"] },
      {
        id: "story",
        durationSeconds: 2,
        narration: ["新闻。"],
        sourceLabel: "来源",
        sourceUrl: source,
        publishedOn: "2026-10-29",
        eventOn: "2026-10-28",
      },
      { id: "outro", durationSeconds: 2, narration: ["结束。"] },
    ],
  };
  const storyboardFile = await json(
    `video/effects/${edition}/storyboard.json`,
    storyboard,
  );
  const storyboardSha256 = await fileHash(storyboardFile);
  const voice = { status: "passed", storyboardSha256, scenes: [] };
  for (const shot of storyboard.shots) {
    const file = `${shot.id}.mp3`;
    const audio = await create(
      `video/public/${edition}/${file}`,
      `narration-${shot.id}`,
    );
    voice.scenes.push({
      id: shot.id,
      file,
      sha256: await fileHash(audio),
      sceneDurationSeconds: 2,
      captions: [
        { text: shot.narration[0], startSeconds: 0.1, endSeconds: 0.5 },
      ],
    });
  }
  const voiceFile = await json(
    `video/public/${edition}/voiceover-manifest.json`,
    voice,
  );
  const voiceSha256 = await fileHash(voiceFile);
  await json("video/workflow.config.json", {
    fps: 60,
    durationSeconds: 6,
    editions: { [edition]: { compositions: { bilibili: compositionId } } },
  });
  const expected = {
    width: 1920,
    height: 1080,
    fps: 60,
    durationInFrames: 360,
  };
  const cover = Buffer.alloc(33);
  Buffer.from("89504e470d0a1a0a", "hex").copy(cover);
  cover.writeUInt32BE(13, 8);
  cover.write("IHDR", 12);
  cover.writeUInt32BE(expected.width, 16);
  cover.writeUInt32BE(expected.height, 20);
  const coverPath = await create(
    `examples/${edition}/bilibili-cover.png`,
    cover,
  );
  await json(`examples/${edition}/bilibili-preview-validation.json`, {
    status: "passed",
    composition: compositionId,
    expected,
    frames: [{ frame: 12, bytes: cover.length, sha256: sha256(cover) }],
  });
  const inputHash = "a".repeat(64);
  await json(`examples/${edition}/render-state.json`, {
    status: "passed",
    inputHash,
    platforms: [
      {
        platform: "bilibili",
        id: compositionId,
        status: "passed",
        width: 1920,
        height: 1080,
        sizeBytes: videoBytes,
        file: `out/${videoName}`,
      },
    ],
    sourceFingerprint: {
      sha256: inputHash,
      files: [
        {
          file: `effects/${edition}/storyboard.json`,
          sha256: storyboardSha256,
        },
        {
          file: `public/${edition}/voiceover-manifest.json`,
          sha256: voiceSha256,
        },
      ],
    },
  });
  const exported = {
    file: videoName,
    status: "passed",
    fullDecode: "passed",
    sizeBytes: videoBytes,
    sha256: videoSha256,
    video: videoProof,
    audio: audioProof,
  };
  await json(`examples/${edition}/bilibili-final-export.json`, exported);
  const period = [storyboard.periodStart, storyboard.periodEnd];
  await json(`examples/${edition}/delivery-validation.json`, {
    status: "passed",
    inputHash,
    period,
    films: [{ platform: "bilibili", ...exported }],
  });
  const audioReport = await json(
    `examples/${edition}/bilibili-final-audio.json`,
    {
      status: "passed",
      decode: { status: "passed", fullTrackDecoded: true },
      inputs: {
        export: { bytes: videoBytes, sha256: videoSha256 },
        storyboard: { sha256: storyboardSha256 },
        manifest: { sha256: voiceSha256 },
      },
      windows: storyboard.shots.map((shot) => ({
        id: shot.id,
        status: "passed",
        digitalSilence: false,
        clippedSamples: 0,
      })),
    },
  );
  await json(`examples/${edition}/content-validation.json`, {
    edition,
    status: "passed",
    period,
    retrievedOn: storyboard.retrievedOn,
    newsCount: 1,
    captionCount: 3,
    scenes: storyboard.shots.map((shot, index) => ({
      id: shot.id,
      startFrame: index * 120,
      endFrame: (index + 1) * 120 - 1,
      source: shot.sourceUrl ?? null,
    })),
  });
  await create(
    "docs/AI-WEEKLY-20261030.md",
    `B站标题：\`本周观察\`\n简介：回看一条新闻。\n\n标签：\`科技\`\n\n[来源](${source})\n`,
  );
  return {
    request,
    outputRoot,
    json,
    create,
    video,
    coverPath,
    voiceFile,
    voice,
    voiceSha256,
    audioReport,
  };
}

test("prepare creates a local reviewed revision, reuses exact inputs, and leaves source files alone", async (t) => {
  const setup = await fixture(t);
  const before = await Promise.all(
    [setup.video, setup.coverPath, setup.voiceFile, setup.audioReport].map(
      fileHash,
    ),
  );
  const first = await preparePackage(setup.request, stubMedia);
  assert.equal(first.manifest.status, "ready_for_review");
  assert.equal(first.manifest.mediaQa, "passed");
  assert.equal(first.manifest.sourceReview, "manual-required");
  assert.equal(first.manifest.copyrightType, null);
  assert.equal(first.manifest.accountUid, null);
  assert.equal(first.manifest.categoryId, null);
  assert.equal(first.manifest.releaseId, releaseId);
  assert.equal(first.manifest.coverFrame, 12);
  assert.equal(await fileHash(first.manifest.uploadCoverPath), sha256(jpeg));
  assert.deepEqual(await readPreparedPackage(setup.request), first);
  assert.deepEqual(await preparePackage(setup.request, stubMedia), first);
  assert.deepEqual(
    await Promise.all(
      [setup.video, setup.coverPath, setup.voiceFile, setup.audioReport].map(
        fileHash,
      ),
    ),
    before,
  );
});

test("configured draft revisions retain older reviewed files and become ready in account state", async (t) => {
  const setup = await fixture(t);
  const initial = await preparePackage(setup.request, stubMedia);
  await setup.json("video/out/posting.json", {
    ...configured,
    title: "审阅后的标题",
  });
  const second = await preparePackage(
    { ...setup.request, options: { metadata: "out/posting.json" } },
    stubMedia,
  );
  assert.notEqual(second.fingerprint, initial.fingerprint);
  assert.equal(second.manifest.title, "审阅后的标题");
  assert.equal(
    await fileHash(initial.manifest.uploadCoverPath),
    initial.manifest.uploadCoverSha256,
  );
  assert.equal(
    await fileHash(initial.manifest.uploadMetadataPath),
    initial.manifest.uploadMetadataSha256,
  );
  const stateRoot = path.join(setup.outputRoot, ".state");
  const state = await readPublishState(
    stateRoot,
    publishIdentity(second.manifest),
  );
  assert.equal(state.status, "ready_for_review");
  assert.equal(state.fingerprint, second.fingerprint);
  assert.deepEqual(await preparePackage(setup.request, stubMedia), second);
  await withPublishLock(
    stateRoot,
    publishIdentity(second.manifest),
    async (tx) => {
      await tx.transition("approved", {
        approval: {
          fingerprint: second.fingerprint,
          approvedAt: new Date().toISOString(),
        },
      });
      await tx.transition("uploading");
    },
  );
  await setup.json("video/out/posting.json", { title: "上传后试图换标题" });
  await assert.rejects(
    preparePackage(
      { ...setup.request, options: { metadata: "out/posting.json" } },
      stubMedia,
    ),
    /already started/,
  );
  assert.deepEqual(
    await readPreparedPackage({ ...setup.request, verifyFiles: false }),
    second,
  );
});

test("missing, partial, failed media QA and mismatched cover never activate a package", async (t) => {
  const setup = await fixture(t);
  await assert.rejects(
    preparePackage(setup.request, {
      ...stubMedia,
      mediaVerifier: async () => {
        throw new Error("fixture full decode failed");
      },
    }),
    /full decode failed/,
  );
  await assert.rejects(
    readPreparedPackage({ ...setup.request, verifyFiles: false }),
    /No prepared manifest/,
  );
  await setup.create("video/out/partial.mp4", "truncated fixture");
  await assert.rejects(
    preparePackage(
      { ...setup.request, options: { video: "out/partial.mp4" } },
      stubMedia,
    ),
    /render|SHA-256/,
  );
  const fakeCover = await readFile(setup.coverPath);
  fakeCover[fakeCover.length - 1] ^= 1;
  await setup.create("video/out/wrong.png", fakeCover);
  await assert.rejects(
    preparePackage(
      { ...setup.request, options: { cover: "out/wrong.png" } },
      stubMedia,
    ),
    /hash-matched QA frame/,
  );
  await unlink(setup.video);
  await assert.rejects(
    preparePackage(setup.request, stubMedia),
    /final Bilibili MP4 is missing/,
  );
});

test("path traversal, redirected input and fake release dates are rejected", async (t) => {
  const setup = await fixture(t);
  await assert.rejects(
    preparePackage(
      { ...setup.request, options: { metadata: "../outside.json" } },
      stubMedia,
    ),
    /permitted directory/,
  );
  await assert.rejects(
    preparePackage(
      { ...setup.request, options: { "release-id": "ai-weekly-20261031" } },
      stubMedia,
    ),
    /content date/,
  );
  const outside = await setup.create(
    `outside/${videoName}`,
    await readFile(setup.video),
  );
  await symlink(
    path.dirname(outside),
    path.join(setup.request.videoRoot, "out", "redirected"),
    process.platform === "win32" ? "junction" : "dir",
  );
  await assert.rejects(
    preparePackage(
      { ...setup.request, options: { video: `out/redirected/${videoName}` } },
      stubMedia,
    ),
    /resolves outside/,
  );
  const coverAlias = await setup.create(
    "video/out/reviewed-copy.png",
    await readFile(setup.coverPath),
  );
  const result = await preparePackage(
    {
      ...setup.request,
      options: { video: `out/${videoName}`, cover: "out/reviewed-copy.png" },
    },
    stubMedia,
  );
  assert.equal(result.manifest.coverSourcePath, coverAlias);
  assert.deepEqual(await readPreparedPackage(setup.request), result);
});

test("rendered voiceover byte hash is required when tracked JSON was reformatted", async (t) => {
  const setup = await fixture(t);
  await writeFile(setup.voiceFile, JSON.stringify(setup.voice));
  await assert.rejects(
    preparePackage(setup.request, stubMedia),
    /renderVoiceover is missing/,
  );
  const exact = await setup.json(
    `video/out/${edition}-render/bundle/public/${edition}/voiceover-manifest.json`,
    setup.voice,
  );
  assert.equal(await fileHash(exact), setup.voiceSha256);
  assert.equal(
    (await preparePackage(setup.request, stubMedia)).manifest.provenance
      .renderedVoiceoverSha256,
    setup.voiceSha256,
  );
  setup.voice.scenes[0].captions[0].text = "changed narration";
  await writeFile(setup.voiceFile, JSON.stringify(setup.voice));
  await assert.rejects(
    preparePackage(setup.request, stubMedia),
    /Current voiceover differs/,
  );
});

test("mutated revision and lost media reject verification while status remains readable", async (t) => {
  const setup = await fixture(t);
  const result = await preparePackage(setup.request, stubMedia);
  await writeFile(
    result.manifest.uploadCoverPath,
    Buffer.from([255, 216, 0, 1, 255, 217]),
  );
  await assert.rejects(
    readPreparedPackage(setup.request),
    /JPEG SHA-256 changed/,
  );
  await unlink(setup.video);
  await unlink(setup.coverPath);
  assert.deepEqual(
    await readPreparedPackage({
      ...setup.request,
      verifyFiles: false,
      options: { "release-id": releaseId },
    }),
    result,
  );
});

test("release-wide lock prevents preparing while another operation owns the package", async (t) => {
  const setup = await fixture(t);
  await withPackageLock(setup.request, async () => {
    await assert.rejects(preparePackage(setup.request, stubMedia), {
      code: "PUBLISH_LOCKED",
    });
  });
  assert.equal(
    (await preparePackage(setup.request, stubMedia)).manifest.status,
    "ready_for_review",
  );
});

test("strict metadata rejects invalid, secret-bearing and ambiguous values", () => {
  const common = {
    ...configured,
    title: "标题",
    description: "简介",
    tags: ["科技"],
    sourceUrl: null,
  };
  assert.deepEqual(validateMetadata(common), common);
  for (const invalid of [
    { accountUid: 123 },
    { accountUid: "0123" },
    { accountAlias: "账号" },
    { categoryId: 65536 },
    { title: "标题\n注入" },
    { description: "SESSDATA=example" },
    { password: "example" },
    { tags: ["AI", "ai"] },
    { tags: ["AI,新闻"] },
    { copyrightType: "repost" },
    { sourceUrl: "https://example.org/?access_token=example" },
  ])
    assert.throws(() => validateMetadata({ ...common, ...invalid }));
});

test("bundled tools generate a deterministic, fully decodable upload JPEG", async () => {
  const png = fileURLToPath(
    new URL("../../../examples/ai-weekly/bilibili-cover.png", import.meta.url),
  );
  const first = await makeUploadCover(png, { width: 1920, height: 1080 });
  assert(first.length > 1000);
  assert(
    first.equals(await makeUploadCover(png, { width: 1920, height: 1080 })),
  );
  await assert.rejects(
    makeUploadCover(png, { width: 1080, height: 1920 }),
    /dimensions/,
  );
});
