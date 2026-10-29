import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Read-only diagnostics: the only output is out/environment-check.json.
// In particular, a missing or incompatible Chrome never triggers a download.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const reportPath = path.join(root, "out/environment-check.json");
const browserVersionFile = path.join(
  root,
  "node_modules/.remotion/chrome-headless-shell/VERSION",
);
const json = (file) =>
  JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
const concise = (value) =>
  String(value)
    .replace(/\u001b\[[0-9;]*m/g, "")
    .trim();
const report = {
  checkedAt: new Date().toISOString(),
  platform: { os: process.platform, arch: process.arch, release: os.release() },
  node: { version: process.versions.node, executable: process.execPath },
  npm: {},
  dependencies: {},
  browser: { versionFile: browserVersionFile },
  remotionVersions: {},
  ffmpeg: {},
  ffprobe: {},
  status: "running",
};

const runNode = (args) => {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    timeout: 30000,
    maxBuffer: 2 * 1024 * 1024,
    env: { ...process.env, CI: "1", NO_COLOR: "1" },
  });
  if (result.error) throw result.error;
  const output = concise(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  if (result.status !== 0) {
    throw new Error(
      `Exit ${result.status ?? result.signal}: ${output.slice(-1200)}`,
    );
  }
  return output;
};

const check = async (section, action) => {
  try {
    const details = await action();
    report[section] = { ...report[section], ...details, status: "passed" };
  } catch (error) {
    report[section] = {
      ...report[section],
      status: "failed",
      error: error.message,
    };
  }
};

let semver;
try {
  process.chdir(root);
  const pkg = json(path.join(root, "package.json"));
  const lock = json(path.join(root, "package-lock.json"));

  await check("npm", () => {
    const npmCli = process.env.npm_execpath;
    if (!npmCli) {
      throw new Error(
        "npm_execpath 未设置。请通过 package.json 中的 npm script 运行本诊断；单独运行时，先将 npm_execpath 设置为本机 npm-cli.js 的绝对路径。不会尝试安装或查找其他 npm。",
      );
    }
    const cliPath = path.resolve(npmCli);
    const version = runNode([cliPath, "--version"]);
    // Reuse npm's own semver, resolved from that exact npm installation.
    const npmRequire = createRequire(cliPath);
    const semverPath = npmRequire.resolve("semver");
    semver = npmRequire(semverPath);
    if (!semver.valid(version))
      throw new Error(`Unexpected npm version: ${version}`);
    if (pkg.engines?.npm && !semver.satisfies(version, pkg.engines.npm)) {
      throw new Error(`npm ${version} does not satisfy ${pkg.engines.npm}`);
    }
    return { version, cliPath, engine: pkg.engines?.npm ?? null, semverPath };
  });

  await check("node", () => {
    const engine = pkg.engines?.node;
    if (!engine) throw new Error("package.json is missing engines.node");
    if (!semver)
      throw new Error(
        "Node engine 检查需要上一步从 npm 解析的 semver；请通过 npm script 运行。",
      );
    if (!semver.satisfies(process.versions.node, engine)) {
      throw new Error(
        `Node ${process.versions.node} does not satisfy ${engine}`,
      );
    }
    return { engine };
  });

  await check("dependencies", () => {
    if (!lock.packages?.[""])
      throw new Error("Expected an npm lockfile with a packages table");
    const items = {};
    report.dependencies = { lockfileVersion: lock.lockfileVersion, items };
    for (const group of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
    ]) {
      const names = new Set([
        ...Object.keys(pkg[group] ?? {}),
        ...Object.keys(lock.packages[""][group] ?? {}),
      ]);
      for (const name of [...names].sort()) {
        const item = {
          group,
          declared: pkg[group]?.[name] ?? null,
          lockDeclared: lock.packages[""][group]?.[name] ?? null,
          locked: lock.packages[`node_modules/${name}`]?.version ?? null,
        };
        try {
          item.installed = json(
            path.join(root, "node_modules", ...name.split("/"), "package.json"),
          ).version;
          item.status =
            /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
              item.declared ?? "",
            ) &&
            item.declared === item.lockDeclared &&
            item.declared === item.locked &&
            item.declared === item.installed
              ? "passed"
              : "failed";
        } catch (error) {
          item.status = "failed";
          item.error = error.message;
        }
        items[name] = item;
      }
    }
    const mismatches = Object.keys(items).filter(
      (name) => items[name].status !== "passed",
    );
    if (mismatches.length)
      throw new Error(
        `Direct dependency versions disagree: ${mismatches.join(", ")}`,
      );
    return { count: Object.keys(items).length };
  });

  let cliPath;
  await check("remotionVersions", () => {
    const cliPackagePath = require.resolve("@remotion/cli/package.json");
    const cliPackage = json(cliPackagePath);
    const bin =
      typeof cliPackage.bin === "string"
        ? cliPackage.bin
        : cliPackage.bin?.remotion;
    if (!bin) throw new Error("@remotion/cli has no remotion bin entry");
    cliPath = path.resolve(path.dirname(cliPackagePath), bin);
    const output = runNode([cliPath, "versions"]);
    return {
      version: cliPackage.version,
      cliPath,
      summary:
        output
          .split(/\r?\n/)
          .find((line) => /All packages have the correct version/.test(line)) ??
        "Version check exited successfully",
    };
  });

  await check("browser", async () => {
    try {
      report.browser.version = readFileSync(browserVersionFile, "utf8").trim();
    } catch {
      report.browser.version = null;
    }
    const { ensureBrowser } = await import("@remotion/renderer");
    const browser = await ensureBrowser({
      logLevel: "error",
      onBrowserDownload: () => {
        throw new Error(
          "浏览器缺失或不匹配，先定位后运行 npm run browser:ensure",
        );
      },
    });
    if (!browser.path)
      throw new Error(`Existing browser unavailable: ${browser.type}`);
    return { path: browser.path, type: browser.type };
  });

  for (const binary of ["ffmpeg", "ffprobe"]) {
    await check(binary, () => {
      if (!cliPath)
        throw new Error("The project Remotion CLI could not be resolved");
      const output = runNode([cliPath, binary, "-version"]);
      const version = output.match(
        new RegExp(`^${binary} version (\\S+)`, "m"),
      )?.[1];
      if (!version) throw new Error(`No ${binary} version found in CLI output`);
      return { version, invokedVia: cliPath };
    });
  }
} catch (error) {
  report.error = error.message;
} finally {
  const sections = [
    "node",
    "npm",
    "dependencies",
    "browser",
    "remotionVersions",
    "ffmpeg",
    "ffprobe",
  ];
  report.status =
    !report.error &&
    sections.every((section) => report[section].status === "passed")
      ? "passed"
      : "failed";
  mkdirSync(path.dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `Environment ${report.status}: Node ${report.node.version}, npm ${report.npm.version ?? "unavailable"}, Remotion ${report.remotionVersions.version ?? "unavailable"}`,
  );
  console.log(`Report: ${reportPath}`);
  for (const section of sections)
    if (report[section].error)
      console.error(`${section}: ${report[section].error}`);
  if (report.error) console.error(report.error);
  process.exitCode = report.status === "passed" ? 0 : 1;
}
