import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual, promisify } from "node:util";
import { getMediaTools } from "../lib/media-tools.mjs";
import {
  assertAudioProfile,
  assertVideoProfile,
  rational,
} from "../lib/media-profiles.mjs";
import { resolveNewsCount } from "../lib/news-contract.mjs";
import {
  parseStandaloneEvidence,
  releaseDate,
  validDate,
  validSha,
  validStandaloneEdition,
} from "./source-evidence.mjs";

export { validDate, validSha };

const exec = promisify(execFile);
const archives = {
  "weekly-ten": [
    "bilibili-export-validation.json",
    "bilibili-export-audio-validation.json",
    "bilibili-composition-validation.json",
  ],
  "ai-weekly": [
    "bilibili-final-export.json",
    "bilibili-final-audio.json",
    "bilibili-preview-validation.json",
  ],
};
const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
export const sha256 = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export const jsonBytes = (value) => `${JSON.stringify(value, null, 2)}\n`;
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : record(value)
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value;
export const fingerprintOf = ({
  fingerprint: _stored,
  preparedAt: _time,
  ...value
}) => sha256(JSON.stringify(canonical(value)));

export const inside = (root, file) => {
  const relative = path.relative(root, file);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
};

export async function scopedFile(
  root,
  input,
  extension,
  label,
  maxBytes = Infinity,
) {
  assert(
    typeof input === "string" && input.trim() && !/[\u0000-\u001f]/.test(input),
    `Invalid ${label} path`,
  );
  const file = path.resolve(root, input);
  assert(
    inside(root, file) && path.extname(file).toLowerCase() === extension,
    `${label} must be a ${extension} file in the permitted directory`,
  );
  let resolved;
  try {
    resolved = await realpath(file);
  } catch {
    throw new Error(`${label} is missing or unreadable`);
  }
  assert(
    inside(root, resolved) &&
      path.extname(resolved).toLowerCase() === extension,
    `${label} resolves outside the permitted directory or has the wrong extension`,
  );
  const info = await stat(resolved);
  assert(
    info.isFile() && info.size > 0 && info.size <= maxBytes,
    `${label} must be a readable nonempty regular file of an allowed size`,
  );
  return resolved;
}

export async function fileHash(file) {
  const hash = createHash("sha256");
  for await (const block of createReadStream(file)) hash.update(block);
  return hash.digest("hex");
}

export async function readJson(file, label, limit = 2 * 1024 * 1024) {
  const info = await stat(file);
  assert(
    info.isFile() && info.size > 0 && info.size <= limit,
    `${label} has an invalid file size`,
  );
  try {
    const value = JSON.parse(
      (await readFile(file, "utf8")).replace(/^\uFEFF/, ""),
    );
    if (record(value)) return value;
  } catch {
    // JSON parse diagnostics can quote arbitrary input. Do not log that input.
  }
  throw new Error(`${label} is not a valid JSON object`);
}

function httpsUrl(value) {
  if (typeof value !== "string" || value.length > 2048 || /\s/.test(value))
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.hostname.includes(".") &&
      ![...url.searchParams.keys()].some((key) =>
        /^(token|access[_-]?token|sessdata|bili_jct|cookie|authorization)$/i.test(
          key,
        ),
      )
    );
  } catch {
    return false;
  }
}

const metadataFields = [
  "title",
  "description",
  "tags",
  "accountAlias",
  "accountUid",
  "categoryId",
  "copyrightType",
  "sourceUrl",
];
const optionalMetadataFields = [
  "aiDeclaration",
  "visibility",
  "existingUpload",
];
export const metadataFrom = (manifest) =>
  Object.fromEntries(
    [
      ...metadataFields,
      ...optionalMetadataFields.filter(
        (key) => Object.hasOwn(manifest, key) && manifest[key] !== undefined,
      ),
    ].map((key) => [key, manifest[key]]),
  );
const secretText =
  /(?:SESSDATA|bili_jct|access[_-]?token|authorization|cookie)\s*[:=]/i;
function textField(value, label, limit, multiline = false) {
  const controls = multiline
    ? /[\u0000-\u0009\u000b-\u001f\u007f]/
    : /[\u0000-\u001f\u007f]/;
  assert(
    typeof value === "string" &&
      value.trim() === value &&
      value.length > 0 &&
      Array.from(value).length <= limit &&
      !controls.test(value) &&
      !secretText.test(value),
    `Invalid ${label}`,
  );
}

export function validateMetadata(value, { partial = false } = {}) {
  assert(
    record(value) &&
      Object.keys(value).every(
        (key) =>
          metadataFields.includes(key) || optionalMetadataFields.includes(key),
      ),
    "Upload metadata contains unsupported fields",
  );
  if (!partial || Object.hasOwn(value, "title"))
    textField(value.title, "title", 80);
  if (!partial || Object.hasOwn(value, "description"))
    textField(value.description, "description", 2000, true);
  if (!partial || Object.hasOwn(value, "tags")) {
    assert(
      Array.isArray(value.tags) &&
        value.tags.length >= 1 &&
        value.tags.length <= 10,
      "Tags must contain 1–10 entries",
    );
    for (const tag of value.tags) {
      textField(tag, "tag", 20);
      assert(!/[,，]/.test(tag), "Tags cannot contain commas");
    }
    assert.equal(
      new Set(value.tags.map((tag) => tag.normalize("NFC").toLowerCase())).size,
      value.tags.length,
      "Tags must be unique",
    );
  }
  if (!partial || Object.hasOwn(value, "accountAlias"))
    assert(
      value.accountAlias === null ||
        (typeof value.accountAlias === "string" &&
          /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(value.accountAlias)),
      "Invalid local account alias",
    );
  if (!partial || Object.hasOwn(value, "accountUid"))
    assert(
      value.accountUid === null ||
        (typeof value.accountUid === "string" &&
          /^[1-9]\d{0,17}$/.test(value.accountUid)),
      "Account UID must be a positive decimal string",
    );
  if (!partial || Object.hasOwn(value, "categoryId"))
    assert(
      value.categoryId === null ||
        (Number.isSafeInteger(value.categoryId) &&
          value.categoryId > 0 &&
          value.categoryId <= 65535),
      "Invalid category ID",
    );
  if (!partial || Object.hasOwn(value, "copyrightType"))
    assert(
      [null, "self-made", "repost"].includes(value.copyrightType),
      "Copyright type must be self-made, repost, or null",
    );
  if (!partial || Object.hasOwn(value, "sourceUrl"))
    assert(
      value.sourceUrl === null || httpsUrl(value.sourceUrl),
      "Invalid repost source URL",
    );
  if (!partial && value.copyrightType === "repost")
    assert(value.sourceUrl !== null, "Repost requires a source URL");
  if (!partial && value.accountUid !== null)
    assert(
      value.accountAlias !== null,
      "Account UID requires a local account alias",
    );
  for (const key of ["aiDeclaration", "existingUpload"])
    if (Object.hasOwn(value, key))
      assert(typeof value[key] === "boolean", `${key} must be a boolean`);
  if (Object.hasOwn(value, "visibility"))
    assert(
      ["private", "public"].includes(value.visibility),
      "Visibility must be private or public",
    );
  assert(
    value.aiDeclaration !== true || value.copyrightType !== "repost",
    "AI declaration requires self-made copyright",
  );
  return value;
}

export async function releaseContext(
  { edition, options = {}, videoRoot, outputRoot },
  { verifyFiles = true } = {},
) {
  assert(validStandaloneEdition(edition), "Invalid publication edition");
  const archived = Object.hasOwn(archives, edition);
  assert(
    !archived || options["source-evidence"] == null,
    "Archived editions must use archived Bilibili delivery evidence",
  );
  assert(
    options.platform == null || options.platform === "bilibili",
    "Publication preparation supports bilibili only",
  );
  const root = await realpath(videoRoot);
  const repo = path.dirname(root);
  const out = path.join(root, "out");
  const output = path.resolve(outputRoot ?? path.join(out, "publish"));
  assert(inside(out, output), "Publish output must stay inside video/out");
  const context = { edition, options, root, repo, out, output };
  let storyboard, storyboardFile, date, sourceEvidence;
  if (!archived) {
    if (
      options["source-evidence"] != null &&
      (verifyFiles || options["release-id"] == null)
    ) {
      sourceEvidence = await loadSourceEvidence(
        context,
        options["source-evidence"],
      );
      storyboard = sourceEvidence.value;
      date = releaseDate(edition, storyboard.releaseId);
    } else {
      assert(
        options["release-id"] != null,
        "Standalone edition requires --source-evidence for prepare or --release-id for readback",
      );
      date = releaseDate(edition, options["release-id"]);
    }
  } else if (verifyFiles || options["release-id"] == null) {
    storyboardFile = await scopedFile(
      path.join(root, "effects", edition),
      "storyboard.json",
      ".json",
      "storyboard",
      1024 * 1024,
    );
    storyboard = await readJson(storyboardFile, "storyboard");
    assert(
      validDate(storyboard.periodStart) &&
        validDate(storyboard.periodEnd) &&
        validDate(storyboard.retrievedOn) &&
        storyboard.periodStart <= storyboard.periodEnd &&
        storyboard.periodEnd <= storyboard.retrievedOn,
      "Invalid content and retrieval dates",
    );
    date = storyboard.periodEnd.replaceAll("-", "");
  } else {
    date = releaseDate(edition, options["release-id"]);
  }
  const releaseId = `${edition}-${date}`;
  assert(
    options["release-id"] == null || options["release-id"] === releaseId,
    "Release ID must match the selected episode's content date",
  );
  const directory = path.join(output, edition, releaseId);
  return {
    ...context,
    directory,
    date,
    releaseId,
    storyboard,
    storyboardFile,
    ...(archived ? {} : { sourceKind: "standalone", sourceEvidence }),
  };
}

async function bind(file, context) {
  return {
    path: repoRelative(file, context),
    sha256: await fileHash(file),
    bytes: (await stat(file)).size,
  };
}

const repoRelative = (file, context) =>
  path.relative(context.repo, file).split(path.sep).join("/");

async function loadSourceEvidence(context, input) {
  const limit = 64 * 1024;
  const file = await scopedFile(
    context.out,
    path.resolve(context.root, input),
    ".json",
    "standalone source evidence",
    limit,
  );
  const bytes = await readFile(file);
  assert(bytes.length <= limit, "Standalone source evidence is too large");
  return {
    file,
    bytes,
    ref: {
      path: repoRelative(file, context),
      sha256: sha256(bytes),
      bytes: bytes.length,
    },
    value: parseStandaloneEvidence(bytes, context.edition),
  };
}

async function verifyStandaloneInputs(
  context,
  { video, cover, sourceEvidence },
) {
  const evidence =
    sourceEvidence == null
      ? context.sourceEvidence
      : await loadSourceEvidence(context, sourceEvidence);
  assert(evidence, "Standalone prepare requires explicit --source-evidence");
  assert(
    evidence.value.releaseId === context.releaseId &&
      (!context.sourceEvidence ||
        isDeepStrictEqual(evidence.ref, context.sourceEvidence.ref)) &&
      (await fileHash(evidence.file)) === evidence.ref.sha256,
    "Standalone source evidence or its selected release changed",
  );
  const { value } = evidence;
  const defaults = validateMetadata({
    ...value.metadata,
    accountAlias: null,
    accountUid: null,
    categoryId: null,
    copyrightType: null,
    sourceUrl: null,
  });
  for (const { label, url } of value.sources) {
    textField(label, "source label", 160);
    assert(httpsUrl(url), "Invalid standalone source URL");
  }
  const resolveMedia = async (reference, override, extension, label, limit) => {
    const file = await scopedFile(
      context.out,
      path.resolve(context.root, reference.path),
      extension,
      label,
      limit,
    );
    if (override != null)
      assert.equal(
        await scopedFile(
          context.out,
          path.resolve(context.root, override),
          extension,
          label,
          limit,
        ),
        file,
        `${label} path differs from standalone source evidence`,
      );
    const ref = await bind(file, context);
    assert.equal(
      ref.sha256,
      reference.sha256,
      `${label} SHA256 differs from standalone source evidence`,
    );
    return { file, ref };
  };
  const [videoInput, coverInput] = await Promise.all([
    resolveMedia(value.video, video, ".mp4", "Standalone video"),
    resolveMedia(
      value.cover,
      cover,
      ".png",
      "Standalone cover",
      16 * 1024 * 1024,
    ),
  ]);
  const expected = {
    ...value.profile,
    seconds: value.profile.frames / value.profile.fps,
  };
  return {
    compositionId: value.compositionId,
    expected,
    videoFile: videoInput.file,
    videoRef: videoInput.ref,
    coverFile: coverInput.file,
    coverRef: coverInput.ref,
    coverBytes: await readCover(coverInput.file, coverInput.ref, expected),
    coverFrame: null,
    defaults,
    provenance: {
      kind: "standalone",
      sourceEvidence: evidence.ref,
      sources: value.sources,
    },
  };
}

function episodeDraft(context, guide, sources) {
  const lines = guide.replaceAll("\r\n", "\n").split("\n");
  const title = lines
    .find((line) => line.startsWith("B站标题："))
    ?.match(/`([^`]+)`/)?.[1];
  const descriptionLine = lines.findIndex((line) => line.startsWith("简介："));
  assert(
    title && descriptionLine >= 0,
    "Missing Bilibili title or description draft in the edition guide",
  );
  const description = [lines[descriptionLine].slice(3)];
  for (let index = descriptionLine + 1; lines[index]?.trim(); index++)
    description.push(lines[index]);
  const tagsLine = lines.find((line) => line.startsWith("标签："));
  const tags = tagsLine
    ? [...tagsLine.matchAll(/`([^`]+)`/g)].map((match) => match[1])
    : ["新闻周记", "本周回顾"];
  const period = `内容范围 ${context.storyboard.periodStart} 至 ${context.storyboard.periodEnd}，资料检索 ${context.storyboard.retrievedOn}。`;
  return validateMetadata({
    title,
    description: [
      description.join("\n").trim(),
      period,
      ...sources.map((source) => `${source.label} ${source.url}`),
    ].join("\n"),
    tags,
    accountAlias: null,
    accountUid: null,
    categoryId: null,
    copyrightType: null,
    sourceUrl: null,
  });
}

async function readCover(file, ref, expected) {
  const bytes = await readFile(file);
  assert(
    bytes.length >= 33 &&
      bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")) &&
      bytes.toString("ascii", 12, 16) === "IHDR" &&
      bytes.readUInt32BE(16) === expected.width &&
      bytes.readUInt32BE(20) === expected.height &&
      sha256(bytes) === ref.sha256,
    "Cover must be a complete PNG with the expected landscape dimensions",
  );
  return bytes;
}

/** Bind exact media and recheck the current source inputs. */
export async function verifyInputs(
  context,
  { video, cover, sourceEvidence } = {},
) {
  if (context.sourceKind === "standalone")
    return verifyStandaloneInputs(context, { video, cover, sourceEvidence });
  assert(
    sourceEvidence == null,
    "Archived editions must use archived Bilibili delivery evidence",
  );
  const { edition, root, repo, out, storyboard, storyboardFile, date } =
    context;
  const refs = {};
  const inputJson = async (scope, name, label) => {
    const file = await scopedFile(scope, name, ".json", label, 2 * 1024 * 1024);
    refs[label] = await bind(file, context);
    return readJson(file, label);
  };
  const config = await inputJson(
    root,
    "workflow.config.json",
    "workflowConfig",
  );
  const settings = config.editions?.[edition];
  const compositionId = settings?.compositions?.bilibili;
  const fps = settings?.fps ?? config.fps;
  const seconds = settings?.durationSeconds ?? config.durationSeconds;
  const expected = { width: 1920, height: 1080, fps, seconds };
  assert(
    typeof compositionId === "string" &&
      Number.isSafeInteger(fps) &&
      fps > 0 &&
      Number.isFinite(seconds) &&
      seconds > 0,
    "Invalid Bilibili composition settings",
  );
  const examples = path.join(repo, "examples", edition);
  const [exportName, audioName, coverName] = archives[edition];
  const delivery = await inputJson(
    examples,
    "delivery-validation.json",
    "delivery",
  );
  const rendered = await inputJson(examples, "render-state.json", "render");
  const exportQa = await inputJson(examples, exportName, "exportQa");
  const audioQa = await inputJson(examples, audioName, "audioQa");
  const coverQa = await inputJson(examples, coverName, "coverQa");
  const contentQa = await inputJson(
    examples,
    "content-validation.json",
    "contentQa",
  );
  const final = (delivery.films ?? delivery.platforms)?.find(
    (item) => item.platform === "bilibili",
  );
  const render = rendered.platforms?.find(
    (item) => item.platform === "bilibili",
  );
  const defaultVideo = `${edition}-${date}-bilibili-1080p60.mp4`;
  const videoFile = await scopedFile(
    out,
    video == null ? defaultVideo : path.resolve(root, video),
    ".mp4",
    "final Bilibili MP4",
  );
  const videoRef = await bind(videoFile, context);
  assert(
    delivery.status === "passed" &&
      final?.fullDecode === "passed" &&
      rendered.status === "passed" &&
      render?.status === "passed" &&
      render.id === compositionId &&
      path.win32.basename(render.file) === defaultVideo &&
      render.sizeBytes === videoRef.bytes &&
      render.width === expected.width &&
      render.height === expected.height &&
      validSha(rendered.inputHash) &&
      (delivery.inputHash == null || delivery.inputHash === rendered.inputHash),
    "Missing matching passed render and delivery evidence",
  );
  assert(
    exportQa.status === "passed" &&
      exportQa.fullDecode === "passed" &&
      exportQa.file === defaultVideo &&
      exportQa.sha256 === videoRef.sha256 &&
      final.sha256 === videoRef.sha256 &&
      exportQa.sizeBytes === videoRef.bytes &&
      final.sizeBytes === videoRef.bytes,
    "MP4 does not match the verified final export SHA-256 and size",
  );
  for (const proof of [exportQa, final]) {
    assert(
      proof.video?.width === expected.width &&
        proof.video.height === expected.height &&
        proof.video.codec === "h264" &&
        proof.video.fps === fps &&
        proof.video.frames === seconds * fps &&
        Math.abs(proof.video.durationSeconds - seconds) <= 1 / fps &&
        proof.audio?.codec === "aac" &&
        proof.audio.sampleRate === 48000 &&
        proof.audio.channels === 2 &&
        Math.abs(proof.audio.durationSeconds - seconds) <= 0.1,
      "Archived export media specifications do not match the composition",
    );
  }
  const period = [storyboard.periodStart, storyboard.periodEnd];
  assert(
    isDeepStrictEqual(
      delivery.period ?? [delivery.periodStart, delivery.periodEnd],
      period,
    ) &&
      isDeepStrictEqual(contentQa.period, period) &&
      contentQa.retrievedOn === storyboard.retrievedOn &&
      contentQa.edition === edition &&
      contentQa.status === "passed",
    "Source and delivery periods do not match",
  );
  refs.storyboard = await bind(storyboardFile, context);
  const voiceRoot = path.join(root, "public", edition);
  const voice = await inputJson(
    voiceRoot,
    "voiceover-manifest.json",
    "voiceover",
  );
  const inputEvidence = audioQa.inputs;
  assert(
    audioQa.status === "passed" &&
      audioQa.decode?.status === "passed" &&
      audioQa.decode.fullTrackDecoded === true &&
      inputEvidence?.export?.sha256 === videoRef.sha256 &&
      inputEvidence.export.bytes === videoRef.bytes &&
      inputEvidence.storyboard?.sha256 === refs.storyboard.sha256 &&
      validSha(inputEvidence.manifest?.sha256),
    "Audio QA does not bind the final export and current storyboard",
  );
  if (refs.voiceover.sha256 !== inputEvidence.manifest.sha256) {
    const archived = await inputJson(
      out,
      `${edition}-render/bundle/public/${edition}/voiceover-manifest.json`,
      "renderVoiceover",
    );
    assert(
      refs.renderVoiceover.sha256 === inputEvidence.manifest.sha256 &&
        isDeepStrictEqual(voice, archived),
      "Current voiceover differs from the exact manifest bound to the rendered audio",
    );
  }
  if (rendered.sourceFingerprint) {
    const entries = rendered.sourceFingerprint.files;
    assert(
      rendered.sourceFingerprint.sha256 === rendered.inputHash &&
        Array.isArray(entries) &&
        entries.some(
          (item) =>
            item.file === `effects/${edition}/storyboard.json` &&
            item.sha256 === refs.storyboard.sha256,
        ) &&
        entries.some(
          (item) =>
            item.file === `public/${edition}/voiceover-manifest.json` &&
            item.sha256 === inputEvidence.manifest.sha256,
        ),
      "Render source fingerprint does not bind the episode storyboard and voiceover",
    );
  }
  const newsCount = resolveNewsCount(storyboard, edition);
  assert(
    voice.status === "passed" &&
      voice.storyboardSha256 === refs.storyboard.sha256 &&
      voice.scenes?.length === storyboard.shots.length &&
      audioQa.windows?.length === voice.scenes.length &&
      contentQa.scenes?.length === voice.scenes.length &&
      contentQa.newsCount === newsCount,
    "Storyboard, voiceover and QA scene counts do not match",
  );
  const sources = [];
  let startFrame = 0;
  let captionCount = 0;
  for (const [index, shot] of storyboard.shots.entries()) {
    const clip = voice.scenes[index];
    const checked = contentQa.scenes[index];
    const window = audioQa.windows[index];
    const frames = shot.durationSeconds * fps;
    assert(
      Number.isSafeInteger(frames) &&
        frames > 0 &&
        clip.id === shot.id &&
        clip.sceneDurationSeconds === shot.durationSeconds &&
        checked.id === shot.id &&
        checked.startFrame === startFrame &&
        checked.endFrame === startFrame + frames - 1 &&
        window.id === shot.id &&
        window.status === "passed" &&
        window.digitalSilence === false &&
        window.clippedSamples === 0 &&
        Array.isArray(clip.captions) &&
        isDeepStrictEqual(
          shot.narration,
          clip.captions.map((caption) => caption.text),
        ),
      "Narration and archived QA timing do not match the storyboard",
    );
    assert(
      typeof clip.file === "string" && /^[a-zA-Z0-9_-]+\.mp3$/.test(clip.file),
      "Invalid narration asset filename",
    );
    const clipFile = await scopedFile(
      voiceRoot,
      clip.file,
      ".mp3",
      "narration audio",
    );
    const clipRef = await bind(clipFile, context);
    assert(
      clipRef.sha256 === clip.sha256,
      "Narration asset SHA-256 differs from its manifest",
    );
    refs[`narration-${index}`] = clipRef;
    captionCount += clip.captions.length;
    if (index > 0 && index < storyboard.shots.length - 1) {
      const publishedOn = shot.publishedOn?.slice(0, 10);
      assert(
        validDate(publishedOn) &&
          publishedOn >= period[0] &&
          publishedOn <= period[1] &&
          httpsUrl(shot.sourceUrl) &&
          checked.source === shot.sourceUrl &&
          typeof shot.sourceLabel === "string" &&
          shot.sourceLabel.trim() &&
          typeof shot.eventOn === "string" &&
          shot.eventOn.trim(),
        "Missing, invalid or out-of-period story source",
      );
      sources.push({
        id: shot.id,
        label: shot.sourceLabel,
        url: shot.sourceUrl,
        publishedOn: shot.publishedOn,
        eventOn: shot.eventOn,
      });
    }
    startFrame += frames;
  }
  assert(
    startFrame === seconds * fps && captionCount === contentQa.captionCount,
    "Content timeline or caption QA totals differ",
  );
  const sourceGuide = await scopedFile(
    path.join(repo, "docs"),
    `${edition.toUpperCase()}-${date}.md`,
    ".md",
    "edition source guide",
    1024 * 1024,
  );
  refs.sourceGuide = await bind(sourceGuide, context);
  const guide = await readFile(sourceGuide, "utf8");
  assert(
    sources.every((source) => guide.includes(source.url)),
    "Edition source guide does not contain the checked story sources",
  );
  const coverFile = await scopedFile(
    cover == null ? examples : out,
    cover == null ? "bilibili-cover.png" : path.resolve(root, cover),
    ".png",
    "reviewed cover",
    16 * 1024 * 1024,
  );
  const coverRef = await bind(coverFile, context);
  const coverBytes = await readCover(coverFile, coverRef, expected);
  const frame = coverQa.frames?.find(
    (item) => item.sha256 === coverRef.sha256 && item.bytes === coverRef.bytes,
  );
  assert(
    coverQa.status === "passed" &&
      coverQa.composition === compositionId &&
      coverQa.expected?.width === expected.width &&
      coverQa.expected.height === expected.height &&
      coverQa.expected.fps === fps &&
      coverQa.expected.durationInFrames === seconds * fps &&
      Number.isSafeInteger(frame?.frame) &&
      frame.frame >= 0 &&
      frame.frame < seconds * fps,
    "Cover is not a hash-matched QA frame for this Bilibili composition",
  );
  return {
    compositionId,
    expected,
    videoFile,
    videoRef,
    coverFile,
    coverRef,
    coverBytes,
    coverFrame: frame.frame,
    defaults: episodeDraft(context, guide, sources),
    provenance: {
      files: refs,
      renderInputHash: rendered.inputHash,
      renderedVoiceoverSha256: inputEvidence.manifest.sha256,
      storyboardSha256: refs.storyboard.sha256,
      narrationWindows: audioQa.windows.length,
      captionCount,
      sources,
    },
  };
}

const runOptions = {
  windowsHide: true,
  shell: false,
  maxBuffer: 16 * 1024 * 1024,
  timeout: 10 * 60 * 1000,
};
export async function verifyMedia(video, expected) {
  const { ffprobe, ffmpeg } = getMediaTools();
  let info;
  try {
    const { stdout } = await exec(
      ffprobe,
      [
        "-v",
        "error",
        "-protocol_whitelist",
        "file,pipe",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        video,
      ],
      runOptions,
    );
    info = JSON.parse(stdout);
  } catch {
    throw new Error("FFprobe could not read the final Bilibili MP4");
  }
  assert(
    info.format?.format_name?.split(",").includes("mp4") &&
      info.streams?.length === 2,
    "Bilibili MP4 must contain one video and one audio stream",
  );
  const videoStream = info.streams.find(
    (stream) => stream.codec_type === "video",
  );
  const audio = info.streams.find((stream) => stream.codec_type === "audio");
  assertVideoProfile(videoStream, expected);
  assertAudioProfile(audio, { seconds: expected.seconds, profile: "standard" });
  assert(
    Number(audio.sample_rate) === 48000 && audio.channels === 2,
    "Bilibili export requires 48 kHz stereo AAC",
  );
  try {
    await exec(
      ffmpeg,
      [
        "-v",
        "error",
        "-xerror",
        "-nostdin",
        "-protocol_whitelist",
        "file,pipe",
        "-i",
        video,
        "-map",
        "0:v:0",
        "-map",
        "0:a:0",
        "-c:v",
        "rawvideo",
        "-c:a",
        "pcm_s16le",
        "-f",
        "null",
        "-",
      ],
      runOptions,
    );
  } catch {
    throw new Error("FFmpeg complete Bilibili video and audio decode failed");
  }
  return {
    status: "passed",
    fullDecode: "passed",
    video: {
      width: videoStream.width,
      height: videoStream.height,
      fps: rational(videoStream.avg_frame_rate),
      frames: Number(videoStream.nb_frames),
      codec: videoStream.codec_name,
      durationSeconds: Number(videoStream.duration),
    },
    audio: {
      codec: audio.codec_name,
      sampleRate: Number(audio.sample_rate),
      channels: audio.channels,
      durationSeconds: Number(audio.duration),
    },
  };
}

export async function makeUploadCover(png, expected) {
  const { ffmpeg } = getMediaTools();
  let jpeg, decoded;
  try {
    const { stdout } = await exec(
      ffmpeg,
      [
        "-v",
        "error",
        "-xerror",
        "-nostdin",
        "-protocol_whitelist",
        "file,pipe",
        "-i",
        png,
        "-map",
        "0:v:0",
        "-frames:v",
        "1",
        "-an",
        "-map_metadata",
        "-1",
        "-threads",
        "1",
        "-flags:v",
        "+bitexact",
        "-c:v",
        "mjpeg",
        "-q:v",
        "2",
        "-pix_fmt",
        "yuvj420p",
        "-f",
        "image2pipe",
        "pipe:1",
      ],
      { ...runOptions, encoding: "buffer" },
    );
    jpeg = stdout;
    // The bundled build has image2pipe and the JPEG decoder, but does not
    // auto-detect JPEG from stdin. Decode with the codec explicitly selected.
    decoded = execFileSync(
      ffmpeg,
      [
        "-v",
        "error",
        "-xerror",
        "-f",
        "image2pipe",
        "-c:v",
        "mjpeg",
        "-i",
        "pipe:0",
        "-frames:v",
        "1",
        "-an",
        "-c:v",
        "png",
        "-f",
        "image2pipe",
        "pipe:1",
      ],
      { ...runOptions, input: jpeg, stdio: ["pipe", "pipe", "pipe"] },
    );
  } catch {
    throw new Error(
      "Could not generate and fully decode the upload JPEG with the installed FFmpeg tools",
    );
  }
  assert(
    Buffer.isBuffer(jpeg) &&
      jpeg.length > 4 &&
      jpeg[0] === 255 &&
      jpeg[1] === 216 &&
      decoded.length >= 33 &&
      decoded.toString("ascii", 12, 16) === "IHDR" &&
      decoded.readUInt32BE(16) === expected.width &&
      decoded.readUInt32BE(20) === expected.height,
    "Upload JPEG has incorrect format or decoded dimensions",
  );
  return jpeg;
}
