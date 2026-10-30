import { spawn } from "node:child_process";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "out/ai-history-render");
await mkdir(output, { recursive: true });
const run = (script, args = [], quiet = false) =>
  new Promise((resolve, reject) => {
    const processHandle = spawn(
      process.execPath,
      [path.join(root, "scripts", script), ...args],
      {
        cwd: root,
        windowsHide: true,
        stdio: quiet ? ["ignore", "pipe", "pipe"] : "inherit",
      },
    );
    let result = "",
      error = "";
    if (quiet) {
      processHandle.stdout.on("data", (b) => (result += b));
      processHandle.stderr.on("data", (b) => (error += b));
    }
    processHandle.on("error", reject);
    processHandle.on("close", (code) =>
      code === 0
        ? resolve(result)
        : reject(Error(`${script} exited ${code}: ${error.slice(-2000)}`)),
    );
  });
const json = async (file) => JSON.parse(await readFile(file, "utf8"));
let lastReady = "";
for (;;) {
  const voice = await json(
    path.join(root, "public/ai-history/voiceover-manifest.json"),
  );
  if (voice.status === "failed")
    throw Error(`Voice generation failed: ${voice.error}`);
  await run("prepare-ai-history.mjs", ["progress"], true);
  const film = await json(path.join(root, "effects/ai-history/film-data.json"));
  const ready = film.readyChapters.join(",");
  if (ready && ready !== lastReady) {
    console.log(
      `${new Date().toISOString()} Ready narration chapters: ${ready}`,
    );
    await run("render-ai-history.mjs", [`--chapters=${ready}`]);
    lastReady = ready;
  }
  if (film.status === "final" && voice.status === "passed") break;
  console.log(
    `Waiting for narration: ${voice.scenes.length}/60 scenes; rendering cache retained`,
  );
  await new Promise((resolve) => setTimeout(resolve, 15000));
}
await run("prepare-ai-history.mjs", ["assemble"], true);
await run("build-ai-history-audio.mjs");
await run("render-ai-history.mjs", ["--mux-only"]);
await run("verify-export.mjs", ["out/ai-history-1080p60.mp4", "1800", "60"]);
await writeFile(
  path.join(output, "production-complete.json"),
  JSON.stringify(
    {
      status: "passed",
      finishedAt: new Date().toISOString(),
      file: "out/ai-history-1080p60.mp4",
    },
    null,
    2,
  ) + "\n",
);
console.log("PRODUCTION COMPLETE: verified 1800s / 1080p / 60fps MP4");
