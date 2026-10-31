import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import path from "node:path";

export const AUDIO_PROFILES = ["standard", "hires-pcm", "atmos"];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const rational = (value) => {
  if (typeof value !== "string") return NaN;
  const [a, b = 1] = value.split("/").map(Number);
  return a / b;
};
export const assertVideoProfile = (video, { width, height, seconds, fps }) => {
  assert(
    video &&
      video.width === width &&
      video.height === height &&
      video.codec_name === "h264" &&
      rational(video.avg_frame_rate) === fps &&
      Number(video.nb_frames) === seconds * fps &&
      Number.isFinite(Number(video.duration)) &&
      Math.abs(Number(video.duration) - seconds) <= 1 / fps,
    `Exported video does not match the requested ${width}x${height} H.264 frame rate, frame count or duration`,
  );
};
export const assertAudioProfile = (audio, { seconds, profile }) => {
  assert(AUDIO_PROFILES.includes(profile), `Unknown audio profile: ${profile}`);
  assert(
    audio &&
      Number.isFinite(Number(audio.duration)) &&
      Math.abs(Number(audio.duration) - seconds) <= 0.1,
    "Exported audio is missing or has the wrong duration",
  );
  if (profile === "standard") {
    assert.equal(audio.codec_name, "aac", "standard requires AAC audio");
  } else if (profile === "hires-pcm") {
    const bits =
      Number(audio.bits_per_raw_sample) || Number(audio.bits_per_sample);
    assert(
      audio.codec_name === "pcm_s24le" &&
        Number(audio.sample_rate) === 48000 &&
        audio.channels === 2 &&
        bits >= 24,
      "hires-pcm requires pcm_s24le, 48000 Hz, 2 channels, and at least 24 declared bits per sample",
    );
  } else {
    assert(
      audio.codec_name === "eac3" &&
        [6, 8].includes(audio.channels) &&
        Number(audio.bit_rate) >= 320000,
      "atmos requires E-AC-3, 6 or 8 channels, and a declared audio-track bitrate of at least 320000 bps; these alone do not prove JOC",
    );
  }
};

/** Hash elementary compressed audio packets, with each file range checked against
 * ffprobe's SHA256 of the demuxed packet. Does not remux or depend on an EAC3 muxer. */
export const compressedAudioTrackSha256 = (file, audio, ffprobe) => {
  assert(
    Number.isSafeInteger(audio.index) && audio.index >= 0,
    "Audio stream index is unavailable",
  );
  const info = JSON.parse(
    execFileSync(
      ffprobe,
      [
        "-v",
        "error",
        "-select_streams",
        String(audio.index),
        "-show_packets",
        "-show_data_hash",
        "sha256",
        "-show_entries",
        "packet=stream_index,pos,size,data_hash",
        "-of",
        "json",
        file,
      ],
      {
        encoding: "utf8",
        windowsHide: true,
        shell: false,
        maxBuffer: 64 * 1024 * 1024,
      },
    ),
  );
  assert(
    Array.isArray(info.packets) && info.packets.length > 0,
    "Cannot inspect compressed audio packets",
  );
  const size = statSync(file).size;
  const descriptor = openSync(file, "r");
  const hash = createHash("sha256");
  try {
    for (const packet of info.packets) {
      const position = Number(packet.pos),
        bytes = Number(packet.size);
      assert(
        packet.stream_index === audio.index &&
          Number.isSafeInteger(position) &&
          position >= 0 &&
          Number.isSafeInteger(bytes) &&
          bytes > 0 &&
          bytes <= 16 * 1024 * 1024 &&
          position + bytes <= size,
        "Container cannot expose a verifiable raw audio packet range",
      );
      const buffer = Buffer.alloc(bytes);
      let offset = 0;
      while (offset < bytes) {
        const read = readSync(
          descriptor,
          buffer,
          offset,
          bytes - offset,
          position + offset,
        );
        assert(read > 0, "Truncated compressed audio packet");
        offset += read;
      }
      assert.equal(
        String(packet.data_hash).toLowerCase(),
        `sha256:${sha256(buffer)}`,
        "Demuxed packet differs from its container byte range; refusing an unverifiable audio-track hash",
      );
      hash.update(buffer);
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
};

/** Explicit external-QC evidence contract; it does not authenticate the report's
 * producer. Retain the original Dolby report for independent human audit.
 * Dolby documents JOC + Validation result: PASSED in its Stream Validator output:
 * https://d2mee59kmfnfxw.cloudfront.net/2021/Dolby_Atmos_Live_Store_CloudFront.pdf */
export const assertAtmosEvidence = ({
  evidenceFile,
  audio,
  audioTrackSha256,
}) => {
  assert(
    evidenceFile,
    "Atmos JOC is NOT VERIFIED: --atmos-evidence=JSON with original external Dolby QC is required; codec/channel labels are insufficient",
  );
  const evidenceBytes = readFileSync(evidenceFile);
  const evidence = JSON.parse(
    evidenceBytes.toString("utf8").replace(/^\uFEFF/, ""),
  );
  assert.equal(
    evidence.schema,
    "remotion-atmos-qc/v1",
    "Unsupported Atmos evidence schema",
  );
  assert.equal(
    evidence.audioStreamIndex,
    audio.index,
    "Atmos evidence targets a different audio stream",
  );
  assert(
    /^[a-f0-9]{64}$/i.test(evidence.audioTrackSha256 ?? ""),
    "Atmos evidence is missing the compressed-audio SHA256",
  );
  assert.equal(
    evidence.audioTrackSha256.toLowerCase(),
    audioTrackSha256,
    "Atmos evidence audio-track SHA256 mismatch",
  );
  const qc = evidence.qc;
  assert(
    qc?.tool === "Dolby Stream Validator" &&
      typeof qc.version === "string" &&
      qc.version.trim() &&
      qc.status === "passed",
    "Atmos requires a passed external Dolby Stream Validator QC result with tool version; a self-declared joc flag is insufficient",
  );
  assert(
    typeof qc.originalReportFile === "string" &&
      qc.originalReportFile.trim() &&
      /^[a-f0-9]{64}$/i.test(qc.originalReportSha256 ?? ""),
    "Original external Dolby QC report and its SHA256 are required",
  );
  const originalFile = path.resolve(
    path.dirname(evidenceFile),
    qc.originalReportFile,
  );
  assert.notEqual(
    originalFile,
    path.resolve(evidenceFile),
    "An evidence wrapper is not an original external QC report",
  );
  const original = readFileSync(originalFile);
  assert(
    original.length > 0 && original.length <= 10 * 1024 * 1024,
    "Original QC report is empty or too large",
  );
  assert.equal(
    sha256(original),
    qc.originalReportSha256.toLowerCase(),
    "Original Dolby QC report SHA256 mismatch",
  );
  const text = original.toString("utf8").replace(/<[^>]+>/g, " ");
  assert(
    /Dolby\s+Stream\s+Validator/i.test(text),
    "Original report is not identifiable as Dolby Stream Validator output",
  );
  assert(
    /Validation\s+result\s*:\s*PASSED\b/i.test(text),
    "External Dolby QC did not explicitly pass validation",
  );
  assert(
    !/\b(?:FAILED|FAILURE)\b|\bJOC\s*[:=]\s*(?:false|no|absent|0)\b|\b(?:no|not|without)\s+JOC\b/i.test(
      text,
    ),
    "External QC reports a failure or missing JOC",
  );
  assert(
    /\bJOC\s*[:=]\s*(?:true|yes|present|1)\b|\bAudio\s+Track\b[^\n]*\b(?:EC3|E-AC-3)\b[^\n]*[,;]\s*JOC(?:\s|[,;]|$)/i.test(
      text,
    ),
    "Original external QC report does not positively identify JOC in the E-AC-3 track",
  );
  return {
    status: "passed",
    joc: "externally-verified",
    evidenceFile: path.resolve(evidenceFile),
    evidenceSha256: sha256(evidenceBytes),
    audioTrackSha256,
    hashDefinition:
      "SHA256 of compressed audio packets in demuxed order; each packet checked against ffprobe data_hash",
    qcTool: qc.tool,
    qcToolVersion: qc.version,
    originalReportFile: originalFile,
    originalReportSha256: sha256(original),
    limitation:
      "Integrity and explicit QC conclusions checked; producer authenticity and device/platform playback require independent audit.",
  };
};
