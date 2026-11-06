import { URL, URLSearchParams } from "node:url";
import { createBilibiliAdapter } from "./bilibili-adapter.mjs";
import { fingerprintOf } from "./verify.mjs";

const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

function id(value) {
  if (typeof value === "number" && Number.isSafeInteger(value))
    value = String(value);
  return typeof value === "string" && /^[1-9]\d{0,18}$/.test(value)
    ? value
    : null;
}

function coverPath(value) {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value, "https://member.bilibili.com");
    if (
      ["https:", "http:"].includes(url.protocol) &&
      /(?:^|\.)hdslb\.com$/.test(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname.startsWith("/bfs/archive/")
    )
      return url.pathname;
  } catch {
    // Ignore malformed cover references. Only known CDN paths are evidence.
  }
  return null;
}

function part(value, field) {
  const cid = id(value?.cid);
  const title = value?.[field];
  const duration = value?.duration;
  if (
    !cid ||
    typeof title !== "string" ||
    !Number.isSafeInteger(duration) ||
    duration <= 0
  )
    throw new Error("Bilibili returned an invalid part record.");
  return { cid, title, duration };
}

function ownerSnapshot(bvid, accountUid, { archive, videos, replace_check }) {
  const aid = id(archive.aid);
  const cover = coverPath(archive.cover);
  if (
    !aid ||
    !cover ||
    archive.bvid !== bvid ||
    id(archive.mid) !== accountUid ||
    typeof archive.title !== "string" ||
    !archive.title.trim() ||
    typeof archive.desc !== "string" ||
    !Number.isSafeInteger(archive.state) ||
    ![0, 1].includes(archive.is_only_self) ||
    !Array.isArray(videos)
  )
    throw new Error("Bilibili returned an incomplete creator archive.");
  const ownerParts = videos.map((video, index) => {
    if (
      id(video?.aid) !== aid ||
      video.bvid !== bvid ||
      video.index !== index + 1
    )
      throw new Error("Creator part identity does not match the archive.");
    return part(video, "title");
  });

  return {
    bvid,
    aid,
    accountUid,
    title: archive.title,
    metadataFingerprint: fingerprintOf({
      title: archive.title,
      description: archive.desc,
      descriptionSegments: archive.desc_v2,
      category: archive.tid,
      cover,
      verticalCover: coverPath(archive.cover43),
      tags: archive.tag,
      source: archive.source,
      copyright: archive.copyright,
      noReprint: archive.no_reprint,
      dynamic: archive.dynamic,
      dynamicSegments: archive.dynamic_v2,
      creationStatement: archive.creation_statement?.id,
      onlySelf: archive.is_only_self,
      noPublic: archive.no_public,
    }),
    aiDeclaration: archive.creation_statement?.id === 1,
    publicSetting: archive.is_only_self === 0,
    state: archive.state,
    stateDescription:
      typeof archive.state_desc === "string" ? archive.state_desc : null,
    canReplace: replace_check?.can_replace === true,
    rejected:
      archive.state !== 0 &&
      typeof archive.reject_reason === "string" &&
      archive.reject_reason.trim() !== "",
    ownerParts,
    publicCid: null,
    publicParts: [],
    anonymousDetails: false,
    anonymousPlayback: false,
    checkedAt: new Date().toISOString(),
  };
}

async function readPublic(report, archive, fetchImpl) {
  const referer = `https://www.bilibili.com/video/${report.bvid}/`;
  const request = (url, headers = {}) =>
    fetchImpl(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: globalThis.AbortSignal.timeout(12_000),
      headers: { "user-agent": userAgent, referer, ...headers },
    });
  async function api(endpoint, params) {
    const url = new URL(endpoint, "https://api.bilibili.com");
    url.search = new URLSearchParams({ bvid: report.bvid, ...params });
    const response = await request(url, { accept: "application/json" });
    if (response.status !== 200 || response.redirected) return null;
    const payload = await response.json();
    return payload?.code === 0 ? payload.data : null;
  }

  try {
    const info = await api("/x/web-interface/view");
    if (
      info?.bvid !== report.bvid ||
      id(info.aid) !== report.aid ||
      id(info.owner?.mid) !== report.accountUid ||
      info.state !== 0 ||
      !Array.isArray(info.pages)
    )
      return;
    report.publicCid = id(info.cid);
    report.publicParts = info.pages.map((page) => part(page, "part"));
    const [published] = report.publicParts;
    const [owner] = report.ownerParts;
    report.anonymousDetails =
      info.title === report.title &&
      coverPath(info.pic) === coverPath(archive.cover) &&
      report.publicParts.length === 1 &&
      report.ownerParts.length === 1 &&
      report.publicCid === owner.cid &&
      published.cid === owner.cid &&
      published.title === owner.title;
    if (!report.anonymousDetails) return;
    const play = await api("/x/player/playurl", {
      cid: published.cid,
      qn: 32,
      fnval: 0,
    });
    const media = new URL(play?.durl?.[0]?.url);
    if (
      media.protocol !== "https:" ||
      !/(?:^|\.)(?:bilivideo\.com|bilivideo\.cn|bilibili\.com)$/.test(
        media.hostname,
      ) ||
      media.username ||
      media.password ||
      media.port
    )
      return;
    const response = await request(media, { range: "bytes=0-1023" });
    const end = /^bytes 0-(\d+)\/\d+$/i.exec(
      response.headers.get("content-range") ?? "",
    )?.[1];
    const expectedBytes = Number(end) + 1;
    if (
      response.status !== 206 ||
      response.redirected ||
      expectedBytes < 256 ||
      expectedBytes > 1024 ||
      Number(response.headers.get("content-length")) !== expectedBytes
    ) {
      await response.body?.cancel();
      return;
    }
    report.anonymousPlayback =
      (await response.arrayBuffer()).byteLength === expectedBytes;
  } catch {
    // Anonymous propagation, rate limits, or network errors can be retried.
    // Keep the known owner state and avoid logging signed media URLs.
  }
}

export function createReplacementReader({
  videoRoot,
  accountAlias,
  accountUid,
  fetchImpl = globalThis.fetch,
  privateRoot,
  configPath,
} = {}) {
  const uid = id(accountUid);
  if (!uid) throw new Error("An approved Bilibili account UID is required.");
  const adapter = createBilibiliAdapter({
    videoRoot,
    privateRoot,
    configPath,
    ownerFetch: fetchImpl,
  });
  return async function read(bvid, { ownerOnly = false } = {}) {
    const data = await adapter.readCreatorArchive(
      { accountAlias, accountUid: uid },
      bvid,
    );
    const report = ownerSnapshot(bvid, uid, data);
    if (!ownerOnly && report.state === 0 && report.publicSetting)
      await readPublic(report, data.archive, fetchImpl);
    return report;
  };
}
