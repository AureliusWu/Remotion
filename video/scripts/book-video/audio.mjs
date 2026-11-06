import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import console from "node:console";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL, URL } from "node:url";
import { promisify } from "node:util";
import { getMediaTools } from "../lib/media-tools.mjs";
import { videoRoot } from "../lib/workflow-config.mjs";

const execute = promisify(execFile);
const helper = fileURLToPath(new URL("./audio.py", import.meta.url));

async function kokoroPython() {
  const configured = process.env.REMOTION_KOKORO_PYTHON;
  const python =
    process.platform === "win32"
      ? ["Scripts", "python.exe"]
      : ["bin", "python"];
  const roots = [videoRoot, path.resolve(videoRoot, "../../Remotion/video")];
  const candidates = configured
    ? [path.resolve(configured)]
    : roots.map((root) =>
        path.join(root, "out", "ai-history-tts", "venv", ...python),
      );
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  throw new Error(
    "未找到本地 Kokoro Python 环境。请设置 REMOTION_KOKORO_PYTHON。",
  );
}

export async function buildBookAudio({
  scriptPath,
  outputDir,
  speakerId = 3,
  speed = 1,
}) {
  assert(
    Number.isInteger(speakerId) && speakerId >= 0,
    "Invalid Kokoro speaker ID",
  );
  assert(
    Number.isFinite(speed) && speed >= 0.85 && speed <= 1.05,
    "Kokoro speed must be between 0.85 and 1.05",
  );
  const output = path.resolve(outputDir);
  const python = await kokoroPython();
  const { ffmpeg } = getMediaTools();
  await execute(
    python,
    [
      helper,
      path.resolve(scriptPath),
      output,
      ffmpeg,
      String(speakerId),
      String(speed),
    ],
    { windowsHide: true, encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
  );
  const manifestPath = path.join(output, "voiceover-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  assert.equal(manifest.status, "passed");
  return {
    timelinePath: path.join(output, "timeline.json"),
    narrationPath: path.join(output, "narration.wav"),
    manifestPath,
    durationInFrames: manifest.durationInFrames,
    fps: manifest.fps,
    audioMeasurement: manifest.audioMeasurement,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [scriptPath, outputDir] = process.argv.slice(2);
    assert(
      scriptPath && outputDir && process.argv.length === 4,
      "Usage: node scripts/book-video/audio.mjs SCRIPT.json OUTPUT_DIR",
    );
    console.log(
      JSON.stringify(await buildBookAudio({ scriptPath, outputDir }), null, 2),
    );
  } catch (error) {
    console.error(error.stderr?.trim() || error.message);
    process.exitCode = 1;
  }
}
