import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { getMediaTools } from "./lib/media-tools.mjs";
import { assertCurrentMaster } from "./lib/master-integrity.mjs";
import {
  dimensions,
  loadEdition,
  readJson,
  videoRoot,
  workflowConfig,
} from "./lib/workflow-config.mjs";

const { values } = parseArgs({
  options: {
    edition: { type: "string" },
    platform: { type: "string" },
    profile: { type: "string" },
    source: { type: "string" },
    audio: { type: "string" },
    "atmos-evidence": { type: "string" },
  },
});
const edition = loadEdition(values.edition ?? workflowConfig.defaultEdition);
const platform = values.platform;
const size = dimensions(platform);
const profile = values.profile;
assert(
  ["hires-pcm", "atmos"].includes(profile),
  "Select --profile hires-pcm or atmos",
);
assert(values.source, "--source is required; use an existing complete video");
const source = path.resolve(videoRoot, values.source);
assert(existsSync(source), "Source video does not exist");
const { ffmpeg, ffprobe } = getMediaTools();
const run = (binary, args) =>
  execFileSync(binary, args, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 128 * 1024 * 1024,
  });
const probe = (file) =>
  JSON.parse(
    run(ffprobe, [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      file,
    ]),
  );
const sourceVideo = probe(source).streams.filter(
  (stream) => stream.codec_type === "video",
);
assert.equal(sourceVideo.length, 1);
const video = sourceVideo[0];
assert.equal(video.width, size.width);
assert.equal(video.height, size.height);
assert.equal(
  Number(video.nb_frames),
  edition.seconds * edition.fps,
  "Only a complete edition may receive a new audio master",
);
assert.equal(Number(video.duration), edition.seconds);
assert.equal(
  video.codec_name,
  "h264",
  "Current packaging contract expects the validated H.264 video",
);
let audio, master;
if (profile === "hires-pcm") {
  assert(
    !values.audio && !values["atmos-evidence"],
    "hires-pcm uses its verified local master only",
  );
  audio = path.join(
    videoRoot,
    "out",
    `${edition.name}-master/master-48k24.wav`,
  );
  master = readJson(path.join(path.dirname(audio), "master-manifest.json"));
  assert.equal(master.status, "passed", "Build a passed lossless master first");
  assertCurrentMaster({
    master,
    root: videoRoot,
    edition: edition.name,
    seconds: edition.seconds,
    file: audio,
  });
  const currentStoryboard = createHash("sha256")
    .update(
      readFileSync(
        path.join(videoRoot, "effects", edition.name, "storyboard.json"),
      ),
    )
    .digest("hex");
  assert.equal(
    master.storyboardSha256,
    currentStoryboard,
    "Lossless master is stale",
  );
  // The master builder and this packager bind the actual file, not only its path.
  const expectedHash = master.sha256 ?? master.output?.sha256;
  assert(expectedHash, "Master manifest is missing its WAV SHA256");
  assert.equal(
    createHash("sha256").update(readFileSync(audio)).digest("hex"),
    expectedHash,
  );
} else {
  assert(
    values.audio && values["atmos-evidence"],
    "Atmos requires --audio externally encoded E-AC-3 JOC and --atmos-evidence from actual external QC",
  );
  audio = path.resolve(videoRoot, values.audio);
  assert(
    existsSync(audio) &&
      existsSync(path.resolve(videoRoot, values["atmos-evidence"])),
  );
}
const folder = path.join(
  videoRoot,
  "out/workflow-packages",
  edition.name,
  profile,
);
mkdirSync(folder, { recursive: true });
const extension = workflowConfig.profiles[profile].container;
const output = path.join(
  folder,
  `${edition.name}-${edition.date}-${platform}-${profile}.${extension}`,
);
assert.notEqual(output, source);
assert.notEqual(output, audio);
const stateFile = `${output}.package.json`;
const report = {
  status: "running",
  profile,
  edition: edition.name,
  platform,
  source,
  audio,
  output,
  startedAt: new Date().toISOString(),
};
const save = () =>
  writeFileSync(stateFile, JSON.stringify(report, null, 2) + "\n");
save();
try {
  const { assertAudioProfile } = await import("./lib/media-profiles.mjs");
  const audioInfo = probe(audio);
  const inputAudio = audioInfo.streams.filter(
    (stream) => stream.codec_type === "audio",
  );
  assert.equal(
    inputAudio.length,
    1,
    "Exactly one master audio stream is required",
  );
  inputAudio[0].duration ??= audioInfo.format?.duration;
  // The final export validator additionally binds Atmos QC to the packaged
  // stream index and verifies the actual compressed track checksum.
  assertAudioProfile(inputAudio[0], { seconds: edition.seconds, profile });
  run(ffmpeg, [
    "-v",
    "error",
    "-y",
    "-i",
    source,
    "-i",
    audio,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "copy",
    "-map_metadata",
    "-1",
    "-movflags",
    "+faststart",
    output,
  ]);
  execFileSync(
    process.execPath,
    [
      path.join(videoRoot, "scripts/verify-export.mjs"),
      output,
      String(edition.seconds),
      String(edition.fps),
      String(size.width),
      String(size.height),
      `--profile=${profile}`,
      ...(values["atmos-evidence"]
        ? [
            `--atmos-evidence=${path.resolve(videoRoot, values["atmos-evidence"])}`,
          ]
        : []),
    ],
    { stdio: "inherit", windowsHide: true },
  );
  const packetHash = (file) => {
    const result = JSON.parse(
      run(ffprobe, [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_packets",
        "-show_entries",
        "packet=data_hash",
        "-show_data_hash",
        "sha256",
        "-of",
        "json",
        file,
      ]),
    );
    const packets = result.packets.map((packet) => packet.data_hash);
    assert(packets.length > 0 && packets.every(Boolean));
    return {
      packets: packets.length,
      sha256: createHash("sha256").update(packets.join("\n")).digest("hex"),
    };
  };
  report.originalVideoPackets = packetHash(source);
  report.packagedVideoPackets = packetHash(output);
  assert.deepEqual(
    report.packagedVideoPackets,
    report.originalVideoPackets,
    "Video packets changed during remux",
  );
  if (master)
    assertCurrentMaster({
      master,
      root: videoRoot,
      edition: edition.name,
      seconds: edition.seconds,
      file: audio,
    });
  report.audioOrigin = master
    ? {
        sourceNativeSampleRate: master.sourceNativeSampleRate ?? 24000,
        resampled: true,
        note: "48kHz/24bit delivery from native 24kHz narration; no new source detail is claimed",
      }
    : {
        externalAtmosEvidence: path.resolve(
          videoRoot,
          values["atmos-evidence"],
        ),
      };
  report.status = "passed";
  report.completedAt = new Date().toISOString();
  save();
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.status = "failed";
  report.error = error.stack ?? String(error);
  save();
  throw error;
}
