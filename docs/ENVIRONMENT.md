# Remotion 本地环境

检查日期：2026-10-29（Asia/Shanghai）。当前工作区是 `H:\CodexAI`，已有仓库为
`H:\CodexAI\Remotion`；唯一 npm 工程根是 `H:\CodexAI\Remotion\video`。
本轮复用该工程，没有在工作区父目录或动画子目录重复初始化。

## 已安装且兼容

| 工具 | 实测版本 | 状态 |
| --- | --- | --- |
| Node.js | 24.14.1 | `F:\node.exe`，满足工程 engines |
| npm | 11.11.0 | `F:\npm.cmd` / `F:\npm.ps1`，可正常执行 |
| Remotion 与 `@remotion/*` | 4.0.539 | 声明、锁文件和实装一致，配套版本检查通过 |
| React / React DOM | 19.2.3 | 已安装，共享根依赖 |
| TypeScript | 5.9.3 | 已安装，类型检查通过 |
| Zod | 4.5.4 | 保持当前 Remotion 推荐版本 |
| Chrome Headless Shell | 157.0.8080.0 | 已缓存，与当前 Windows 渲染器要求相符 |
| FFmpeg / FFprobe | n7.1 | 已随 compositor 安装，官方 CLI 入口可执行 |

本轮没有执行 npm install / npm ci、升级依赖、重复下载浏览器或安装全局 FFmpeg。
`package-lock.json` 保持原样。工程 engines 为 `^20.19.0 || ^22.13.0 || >=24`；
当前 Node 满足工程及 ESLint 等开发工具的要求。
项目 `.npmrc` 设置 `save-exact=true`，后续按需安装默认保存精确版本，不改变现有依赖。

## 使用入口

以下命令均在 `video/` 执行：

```powershell
npm run check:environment
npm run dev -- --no-open
npm run ffmpeg -- -version
npm run ffprobe -- -version
```

`check:environment` 输出简洁结果及 `out/environment-check.json`，仅诊断，不自动安装。
FFmpeg / FFprobe 不在系统 PATH 中并不表示工程缺少它们；Remotion 使用
`node_modules/@remotion/compositor-win32-x64-msvc/` 中与其版本配套的原生程序和 DLL。
使用上述 npm 命令或 `npx --no-install remotion ffmpeg / ffprobe`，无需修改系统 PATH。

Chrome 位于
`node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe`，
缓存版本标记为 `node_modules/.remotion/chrome-headless-shell/VERSION`。
仅当诊断确认浏览器缺失或不匹配时，执行 `npm run browser:ensure`；官方命令会复用匹配的缓存。

## 新增动画

1. 创建 `video/effects/<name>/`，编写组件及明确的 `<Composition>` 注册，设置唯一 ID、规格与时长。
2. 在 `video/effects/index.tsx` 导入该注册组件并添加 JSX 节点，Studio 自动显示于 Effects 文件夹。
3. 素材放 `video/public/<name>/`，输出放 `video/out/`；全部使用 `video/package.json` 的共享依赖。
4. 额外依赖按需在 `video/` 安装。Remotion 配套包用 `npx --no-install remotion add <package>`，
   保持相同精确版本，完成后运行 `npm run check:versions`。

保留 `src/` 中已有作品，无需为目录规范移动已有视频。
维护约定在 `video/AGENTS.md`，诊断样例在 `video/effects/environment-test/`。

## 排查顺序

- **命令找不到**：先 `Get-Command node,npm -All` 核对实际路径；FFmpeg 用工程官方入口，
  不因全局命令缺失重复安装。PowerShell 脚本执行策略报错时可先使用现有 `npm.cmd`，不必降低全局策略。
- **依赖告警**：先比较声明、锁文件、实装和 `npm run check:versions`；不修改上游检查器，
  不运行无针对性的 upgrade / audit fix。Windows 未装其他平台 optional compositor 属正常。
- **浏览器启动或下载失败**：先确认缓存版本、可执行路径、原始日志与网络条件，再修复浏览器缺项。
  不为此删除全部依赖或改动画源码。
- **媒体命令失败**：先查看工程二进制的 `-filters` / `-encoders` / `-formats`。
  当前精简 FFmpeg 不含 `volumedetect`、`wrapped_avframe` 编码器和 `s16le` muxer；
  音量计算可解码为 WAV/PCM，完整解码到 null 时显式指定 `rawvideo` / `pcm_s16le`。
- **预览或渲染失败**：区分 Studio 编译错误、浏览器错误、媒体错误和磁盘/网络问题，保留具体报错。
  静帧成功不代替 MP4 完整解码检查。

## 诊断样例与复现

`EnvironmentTest` 是 1920×1080、60 fps、240 帧（4 秒）的简单移动图形，配低音量测试正弦音。
仅用于编译、中文字体、逐帧动画、媒体合成与导出验证，不制作正式动画。

```powershell
npm run lint
npm run build
npm run verify:environment
npm run render:environment
npm run verify:environment-export
```

音频源是本地生成的 4 秒、16 kHz、单声道 PCM WAV，生成命令：

```powershell
npx --no-install remotion ffmpeg -f lavfi -i sine=frequency=440:sample_rate=16000:duration=4 -c:a pcm_s16le public/environment-test/tone.wav
```

本轮上述五项命令均通过。关键帧为 0 / 120 / 239，Studio 可正常播放；实际 MP4 为 H.264、
1920×1080、60 fps、240 帧、4 秒，带 AAC 48 kHz 双声道音轨，完整解码通过。
测试成片约 239 KB，保存在 `video/out/environment-test.mp4`，不纳入 Git。
实际像素格式为 `yuvj420p`、全范围 `pc`；音轨 4.011 秒含编码补齐，符合 0.1 秒容差。

官方依据：[系统要求](https://www.remotion.dev/docs#system-requirements)、
[浏览器检查](https://www.remotion.dev/docs/renderer/ensure-browser)、
[配套二进制目录](https://www.remotion.dev/docs/options/binaries-directory)。

## 2026-10-30：D盘新闻短片环境修复

当前 checkout 位于 D:\AI项目\Remotion，初始 node_modules 与浏览器缓存均不存在。
按锁文件执行 npm ci（348包），再用 npm run browser:ensure 安装匹配的Chrome Headless Shell 157.0.8080.0。
实测 Node 24.14.0、npm 11.9.0，Remotion配套包全为4.0.539；check:environment和check:versions通过。
未升级或改动package-lock.json。

本地语音隔离环境本轮为Python3.14.4，固定sherpa-onnx2.0.1可安装Windows cp314 wheel。
Kokoro模型校验成功后，kaldifst仍无法从含中文的工程路径读FST。新generate-hotspot-audio.py使用
C:\Users\84046\.codex\runtimes\remotion-kokoro-05d79370联接至唯一原模型缓存，为底层库提供ASCII路径。
不改旧AI历史片的生成脚本或音频资产。下次遇到同类问题，先检查路径编码而非重装模型。

Studio的WebMCP播放命令可能返回playing=true而首帧不动；必须再核对帧号实际增加。
本轮实际点击Play按钮激活媒体后恢复推进。详细来源与验证范围见DAILY-TEN-20261030.md。

## 周报正式导出验收补充（2026-10-30）

当前实际GPU为GTX1660 SUPER、CPU为Ryzen5 3600，不能将其他机器的历史记录视为本机现状。
先用现有H.264 NVENC生成120帧样片，再完整解码核对；没有安装驱动或升级Remotion。
verify-export.mjs原先固定1920×1080，现支持FILE SECONDS FPS [WIDTH HEIGHT]，默认行为保留，允许竖版准确验收。
新增verify-weekly-ten-media.mjs读取最终MP4的AAC并完整解码到out下PCM WAV，测量真实混音的12个语音窗口；
源MP3成功不能替代成片音轨成功。音量为RMS/peak dBFS，不标成LUFS或自然度评分。
