import { accessSync, constants, statSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(path.join(projectRoot, "package.json"));

// Package names and exported .dir match renderer 4.0.539's
// dist/compositor/get-executable-path.js; Linux selects its actual libc ABI.
export const mediaPackageFor = (platform, arch, libc) => {
  if (platform === "win32" && arch === "x64")
    return "@remotion/compositor-win32-x64-msvc";
  if (platform === "darwin" && ["x64", "arm64"].includes(arch))
    return `@remotion/compositor-darwin-${arch}`;
  if (
    platform === "linux" &&
    ["x64", "arm64"].includes(arch) &&
    ["gnu", "musl"].includes(libc)
  )
    return `@remotion/compositor-linux-${arch}-${libc}`;
  throw new Error(
    `Unsupported media-tool platform/architecture/ABI: ${platform}/${arch}${platform === "linux" ? `/${libc ?? "unknown libc"}` : ""}`,
  );
};

const linuxLibc = () => {
  if (!process.report?.getReport)
    throw new Error(
      "Cannot identify Linux libc: Node diagnostic reports are unavailable",
    );
  const oldExcludeNetwork = process.report.excludeNetwork;
  try {
    if ("excludeNetwork" in process.report)
      process.report.excludeNetwork = true;
    const report = process.report.getReport();
    if (!report || typeof report !== "object" || !report.header)
      throw new Error("Cannot identify Linux libc from Node diagnostic report");
    return report.header.glibcVersionRuntime ? "gnu" : "musl";
  } finally {
    if ("excludeNetwork" in process.report)
      process.report.excludeNetwork = oldExcludeNetwork;
  }
};

/** Resolve already-installed bundled binaries. Never invokes a shell or downloads. */
export const getMediaTools = () => {
  const name = mediaPackageFor(
    process.platform,
    process.arch,
    process.platform === "linux" ? linuxLibc() : undefined,
  );
  let directory;
  try {
    directory = require(name).dir;
  } catch (cause) {
    throw new Error(
      `Missing installed media tools: ${name}. Install this project's locked optional dependencies for ${process.platform}/${process.arch}; no download was attempted.`,
      { cause },
    );
  }
  if (typeof directory !== "string" || !path.isAbsolute(directory))
    throw new Error(`${name} did not export an absolute binary directory`);
  const suffix = process.platform === "win32" ? ".exe" : "";
  const result = {
    ffmpeg: path.join(directory, `ffmpeg${suffix}`),
    ffprobe: path.join(directory, `ffprobe${suffix}`),
  };
  for (const file of Object.values(result)) {
    try {
      if (!statSync(file).isFile()) throw new Error("not a regular file");
      accessSync(
        file,
        process.platform === "win32" ? constants.F_OK : constants.X_OK,
      );
    } catch (cause) {
      throw new Error(
        `Missing or non-executable bundled media tool: ${file}; no download was attempted.`,
        { cause },
      );
    }
  }
  return result;
};
