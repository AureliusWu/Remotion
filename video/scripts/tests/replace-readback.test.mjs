import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createReplacementReader } from "../publish/replace-readback.mjs";

const { Response } = globalThis;
const bvid = "BV1ip4y1x7Gi";
const aid = 170001;
const cid = 30303;
const mid = 92847;
const title = "换源测试";
const cover = "https://i1.hdslb.com/bfs/archive/verified.jpg";
const owner = {
  archive: {
    bvid,
    aid,
    mid,
    title,
    cover,
    desc: "创作说明",
    state: 0,
    is_only_self: 0,
    creation_statement: { id: 1 },
  },
  videos: [{ bvid, aid, cid, title: "mix-revised", duration: 180, index: 1 }],
  replace_check: { can_replace: true },
};
const publicVideo = {
  bvid,
  aid,
  title,
  state: 0,
  cid,
  pic: cover,
  owner: { mid },
  pages: [{ cid, part: "mix-revised", duration: 180 }],
};

async function fixture(t, options = {}) {
  const root = await mkdtemp(path.join(homedir(), ".remotion-readback-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const privateRoot = path.join(root, "private");
  const videoRoot = path.join(root, "workspace", "video");
  await mkdir(privateRoot, { mode: 0o700 });
  await mkdir(videoRoot, { recursive: true });
  const configPath = path.join(privateRoot, "publish-config.json");
  const cookiePath = path.join(privateRoot, "editor.json");
  const writePrivate = (file, data) =>
    writeFile(file, JSON.stringify(data), { mode: 0o600 });
  await Promise.all([
    writePrivate(configPath, {
      schemaVersion: 1,
      acceptPersonalResearchTerms: true,
      accounts: {
        editor: {
          uid: String(mid),
          nickname: "Editor",
          cookieFile: "editor.json",
        },
      },
    }),
    writePrivate(cookiePath, {
      token_info: { mid },
      cookie_info: {
        cookies: [
          { name: "DedeUserID", value: String(mid) },
          { name: "SESSDATA", value: "test-session" },
          { name: "bili_jct", value: "test-csrf" },
        ],
      },
    }),
  ]);
  const calls = [];
  const read = createReplacementReader({
    videoRoot,
    privateRoot,
    configPath,
    accountAlias: "editor",
    accountUid: String(mid),
    fetchImpl: async (url, { method, headers, redirect }) => {
      calls.push({
        host: url.hostname,
        path: url.pathname,
        method,
        headers,
        redirect,
      });
      if (url.pathname === "/x/vupre/web/archive/view")
        return Response.json({ code: 0, data: options.owner ?? owner });
      if (url.pathname === "/x/web-interface/view")
        return Response.json({
          code: 0,
          data: options.publicVideo ?? publicVideo,
        });
      if (url.pathname === "/x/player/playurl") {
        assert.equal(url.searchParams.get("cid"), String(cid));
        return Response.json({
          code: 0,
          data: {
            durl: [
              { url: options.mediaUrl ?? "https://unit.bilivideo.com/clip" },
            ],
          },
        });
      }
      assert.equal(url.pathname, "/clip");
      return new Response(new Uint8Array(1024), {
        status: options.rangeStatus ?? 206,
        headers: {
          "content-range": "bytes 0-1023/2048",
          "content-length": "1024",
        },
      });
    },
  });
  return { read, calls };
}

test("the creator GET is bound to the owner and the exact public CID has anonymous playback", async (t) => {
  const { read, calls } = await fixture(t);
  const ownerOnly = await read(bvid, { ownerOnly: true });
  assert.equal(calls.length, 1);
  assert.equal(ownerOnly.publicCid, null);
  const result = await read(bvid);
  assert.equal(result.metadataFingerprint, ownerOnly.metadataFingerprint);
  assert.equal(result.aiDeclaration, true);
  assert.equal(result.canReplace, true);
  assert.equal(result.publicCid, String(cid));
  assert.equal(result.anonymousDetails, true);
  assert.equal(result.anonymousPlayback, true);
  assert.equal(calls.length, 5);
  for (const call of calls) {
    assert.equal(call.method, "GET");
    assert.equal(call.redirect, "error");
    if (call.host === "member.bilibili.com")
      assert.equal(
        call.headers.cookie,
        `SESSDATA=test-session; DedeUserID=${mid}`,
      );
    else assert.equal(Object.hasOwn(call.headers, "cookie"), false);
  }
  assert.equal(calls.at(-1).headers.range, "bytes=0-1023");
});

test("different creator identity cannot reach public requests", async (t) => {
  const { read, calls } = await fixture(t, {
    owner: { ...owner, archive: { ...owner.archive, mid: mid + 1 } },
  });
  await assert.rejects(read(bvid), { code: "adapter_unconfirmed" });
  assert.equal(calls.length, 1);
});

test("a stale public CID never counts as a confirmed replacement", async (t) => {
  const { read, calls } = await fixture(t, {
    publicVideo: {
      ...publicVideo,
      cid: cid - 1,
      pages: [{ ...publicVideo.pages[0], cid: cid - 1 }],
    },
  });
  const result = await read(bvid);
  assert.equal(result.publicCid, String(cid - 1));
  assert.equal(result.anonymousDetails, false);
  assert.equal(result.anonymousPlayback, false);
  assert.equal(calls.length, 2);
});

test("matching public metadata does not prove playback without an anonymous range response", async (t) => {
  const { read } = await fixture(t, { rangeStatus: 200 });
  const result = await read(bvid);
  assert.equal(result.anonymousDetails, true);
  assert.equal(result.anonymousPlayback, false);
});

test("a media URL outside approved Bilibili domains is never requested", async (t) => {
  const { read, calls } = await fixture(t, {
    mediaUrl: "https://bilivideo.com.example.invalid/clip",
  });
  const result = await read(bvid);
  assert.equal(result.anonymousPlayback, false);
  assert.equal(calls.length, 3);
});
