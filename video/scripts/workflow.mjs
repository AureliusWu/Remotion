import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  dimensions,
  editionNames,
  loadEdition,
  platforms,
  qaFrames,
  videoRoot,
  workflowConfig,
} from "./lib/workflow-config.mjs";

const help = `Remotion workflow (run from video/)
  npm run workflow -- list
  npm run workflow -- doctor
  npm run workflow -- check --edition all
  npm run workflow -- qa --edition ai-weekly --platform all [--quick]
  npm run workflow -- preview --edition ai-weekly --platform douyin
  npm run workflow -- audio --edition ai-weekly [--check]
  npm run workflow -- master --edition ai-weekly [--check]
  npm run workflow -- render --edition ai-weekly --platform all [--hardware if-possible] [--concurrency 4] [--frames 0-119]
  npm run workflow -- package --edition ai-weekly --platform bilibili --profile hires-pcm --source out/FILE.mp4
  npm run workflow -- package --edition ai-weekly --platform bilibili --profile atmos --source out/FILE.mp4 --audio out/atmos.eac3 --atmos-evidence out/qc.json
  npm run workflow -- smoke

check/qa do not export a complete film. master requires local original WAV caches.
Atmos packaging requires externally authored/encoded Atmos audio and matching QC evidence.
`;
let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      edition: { type: "string" },
      platform: { type: "string" },
      profile: { type: "string" },
      source: { type: "string" },
      audio: { type: "string" },
      "atmos-evidence": { type: "string" },
      hardware: { type: "string" },
      concurrency: { type: "string" },
      frames: { type: "string" },
      quick: { type: "boolean" },
      check: { type: "boolean" },
      help: { type: "boolean" },
    },
  });
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const { values, positionals } = parsed;
const action = positionals[0] ?? "help";
if (values.help || action === "help") {
  console.log(help);
  process.exit(0);
}
const allowed = {
  list: [],
  doctor: [],
  smoke: [],
  check: ["edition"],
  qa: ["edition", "platform", "quick"],
  preview: ["edition", "platform"],
  audio: ["edition", "check"],
  master: ["edition", "check"],
  render: ["edition", "platform", "hardware", "concurrency", "frames"],
  package: [
    "edition",
    "platform",
    "profile",
    "source",
    "audio",
    "atmos-evidence",
  ],
};
if (!Object.hasOwn(allowed, action) || positionals.length !== 1) {
  console.error("Unknown command or extra argument.\n" + help);
  process.exit(1);
}
for (const key of Object.keys(values))
  if (!allowed[action].includes(key)) {
    console.error(`--${key} is not valid for ${action}`);
    process.exit(1);
  }
process.chdir(videoRoot);
const runDir = path.join(
  videoRoot,
  "out/workflow",
  `${new Date().toISOString().replace(/[:.]/g, "-")}-${action}-${process.pid}`,
);
mkdirSync(runDir, { recursive: true });
const report = {
  action,
  options: values,
  scope: values.check
    ? "preflight-only"
    : action === "render" && values.frames
      ? "partial-render"
      : action,
  startedAt: new Date().toISOString(),
  status: "running",
  steps: [],
};
const save = () =>
  writeFileSync(
    path.join(runDir, "report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
save();

async function execute(executable, args, label) {
  const step = {
    label,
    executable,
    args,
    startedAt: new Date().toISOString(),
    status: "running",
  };
  report.steps.push(step);
  save();
  const chunks = [];
  const child = spawn(executable, args, {
    cwd: videoRoot,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => {
    process.stdout.write(chunk);
    chunks.push(chunk);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(chunk);
    chunks.push(chunk);
  });
  const result = await new Promise((resolve) => {
    child.once("error", (error) =>
      resolve({ code: null, error: error.message }),
    );
    child.once("close", (code, signal) => resolve({ code, signal }));
  });
  const log = `${String(report.steps.length).padStart(2, "0")}-${label.replace(/[^a-zA-Z0-9-]/g, "-")}.log`;
  writeFileSync(path.join(runDir, log), Buffer.concat(chunks));
  Object.assign(step, result, {
    completedAt: new Date().toISOString(),
    log,
    status: result.code === 0 ? "passed" : "failed",
  });
  save();
  if (result.code !== 0)
    throw new Error(
      `${label} failed: ${result.error ?? `exit ${result.code} / ${result.signal ?? ""}`}`,
    );
}
const node = (file, args = [], label = file) =>
  execute(
    process.execPath,
    [path.join(videoRoot, "scripts", file), ...args],
    label,
  );
const npm = (script) => {
  if (!process.env.npm_execpath)
    throw new Error(
      "Run via npm run workflow so the exact npm installation is reused.",
    );
  return execute(
    process.execPath,
    [process.env.npm_execpath, "run", script],
    script,
  );
};
const python = () => {
  const file =
    process.env.REMOTION_PYTHON ??
    path.join(
      videoRoot,
      "out/ai-history-tts/venv",
      process.platform === "win32" ? "Scripts/python.exe" : "bin/python",
    );
  if (!existsSync(file))
    throw new Error(
      "Local audio runtime missing. Set REMOTION_PYTHON to the existing numpy/soundfile/TTS Python; CI does not synthesize voices.",
    );
  return file;
};

try {
  if (action === "list") console.log(JSON.stringify(workflowConfig, null, 2));
  if (action === "doctor") await npm("check:environment");
  if (action === "check") {
    const names = editionNames(values.edition ?? "all");
    for (const script of ["check:versions", "lint", "test:workflow", "build"])
      await npm(script);
    for (const name of names) {
      const edition = loadEdition(name);
      await node(
        edition.contentValidator,
        name === "daily-ten" ? [] : [name],
        `content-${name}`,
      );
    }
  }
  if (action === "qa")
    for (const name of editionNames(values.edition)) {
      const edition = loadEdition(name);
      for (const platform of platforms(values.platform)) {
        const { width, height } = dimensions(platform);
        await node(
          "verify-composition.mjs",
          [
            edition.compositions[platform],
            `--seconds=${edition.seconds}`,
            `--fps=${edition.fps}`,
            `--width=${width}`,
            `--height=${height}`,
            `--frames=${qaFrames(edition, values.quick).join(",")}`,
            `--voiceover=${name}/voiceover-manifest.json`,
          ],
          `qa-${name}-${platform}`,
        );
      }
    }
  if (action === "preview") {
    const edition = loadEdition(
      values.edition ?? workflowConfig.defaultEdition,
    );
    const platform = values.platform ?? "douyin";
    dimensions(platform);
    console.log(
      `Composition: http://localhost:3000/${edition.compositions[platform]}`,
    );
    await execute(
      process.execPath,
      [
        path.join(videoRoot, "node_modules/@remotion/cli/remotion-cli.js"),
        "studio",
        "--no-open",
      ],
      "studio",
    );
  }
  if (action === "audio" || action === "master") {
    const names = editionNames(values.edition);
    if (names.length !== 1)
      throw new Error("Select one edition for local audio work.");
    const edition = loadEdition(names[0]);
    const script =
      action === "master" ? "build-lossless-master.py" : edition.audioGenerator;
    const args =
      action === "master"
        ? [edition.name]
        : edition.name === "daily-ten"
          ? [`effects/${edition.name}/storyboard.json`, "--speed=1.03"]
          : [];
    // The legacy Daily Ten generator has no check mode; never silently synthesize.
    if (action === "audio" && edition.name === "daily-ten" && values.check)
      throw new Error(
        "Daily Ten legacy audio has no read-only --check. Use workflow check --edition daily-ten.",
      );
    if (values.check) args.push("--check");
    await execute(
      python(),
      [path.join(videoRoot, "scripts", script), ...args],
      `${action}-${edition.name}`,
    );
  }
  if (action === "render") {
    const args = [
      "--edition",
      values.edition ?? workflowConfig.defaultEdition,
      "--platform",
      values.platform ?? "all",
    ];
    for (const key of ["hardware", "concurrency", "frames"])
      if (values[key]) args.push(`--${key}`, values[key]);
    await node("render-news.mjs", args, "render");
  }
  if (action === "package") {
    const args = ["--edition", values.edition ?? workflowConfig.defaultEdition];
    for (const key of [
      "platform",
      "profile",
      "source",
      "audio",
      "atmos-evidence",
    ])
      if (values[key]) args.push(`--${key}`, values[key]);
    await node("package-audio.mjs", args, "package");
  }
  if (action === "smoke") await node("ci-smoke.mjs", [], "smoke");
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.stack ?? String(error);
  console.error(error.message);
  process.exitCode = 1;
} finally {
  report.completedAt = new Date().toISOString();
  save();
  console.log(
    `Workflow ${report.status}: ${path.relative(videoRoot, path.join(runDir, "report.json"))}`,
  );
}
