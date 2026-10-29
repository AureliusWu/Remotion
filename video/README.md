# Remotion Video Lab

本目录是视频工程，完整介绍见[仓库 README](../README.md)。

已有环境先运行 `npm run check:environment`，无需重复安装。新动画放 `effects/<name>/`，
在 `effects/index.tsx` 注册，所有动画共用本目录的依赖。完整说明见
[环境与新增动画](../docs/ENVIRONMENT.md) 和 [维护约定](AGENTS.md)。
仅首次克隆且缺少依赖时使用 `npm ci`。

```powershell
npm run check:environment
npm run dev
npm run check:versions
npm run lint
npm run build
npm run render:test
npm run still:test
```

测试合成：`SmokeTest`，1920×1080、30 fps、180 帧（6 秒）。
默认输出：`out/smoke-test.mp4`；该目录不会上传 GitHub。

骑行合成：`PelicanRide`，1920×1080、60 fps、900 帧（15 秒）。
预览地址：`http://localhost:3000/PelicanRide`。插画与运动逻辑分别放在
`src/pelican-ride/` 下的组件和 `motion.ts` 中，无外部素材、无音轨。

数据合成：`ChinaGenAiTimeline`，1920×1080、60 fps、3600 帧（1 分钟），带中文旁白。
预览地址：`http://localhost:3000/ChinaGenAiTimeline`；各分镜可在 `GenAiScenes` 文件夹
单独编辑。运行 `npm run verify:genai` 检查规格、七个静帧和六段音频；此命令不会导出 MP4。

旁白资产已随源码保存。若改文案，需要在有 Huihui 中文声线的 Windows 环境执行
`powershell -NoProfile -File scripts/generate-genai-voiceover.ps1`，然后重新验证。
通用验证器也可用于其他 1080p 合成，例如：

```powershell
node scripts/verify-composition.mjs SmokeTest --seconds=6 --fps=30
```

数据来源见[来源记录](../docs/CHINA-GENAI-SOURCES.md)，问题修复和可复用工具见
[工程日志](../docs/VIDEO-ENGINEERING-LOG.md)。

科普合成：`PoissonEncounters`，1920×1080、60 fps、10800 帧（3 分钟）。九个分镜位于
`PoissonScenes`，中文旁白与逐句字幕来自 `src/poisson-process/storyboard.json`。
`npm run verify:poisson` 检查合成和音频；`npm run render:poisson` 导出
`out/poisson-process-1080p60.mp4`。完整成片检查命令：

```powershell
node scripts/verify-export.mjs out/poisson-process-1080p60.mp4 180 60
```

该命令核对实际视频/音频流和帧数，再完整解码，并在 MP4 旁写入验证 JSON。
数学、人文与模型边界说明见[作品说明](../docs/POISSON-FILM.md)。

本轮已重新渲染验证的小型示例另存于仓库的 `examples/` 目录；新成片与原示例的
SHA-256 相同，完整验证记录包含一致性证明。
本轮恢复 Remotion 官方推荐的 Zod `4.5.4`，移除强制版本覆盖，并保留版本检查和
npm 审计。依赖及安全公告状态见[依赖说明](../docs/DEPENDENCIES.md)，重新验证的结果与
无音轨、跨平台字体等范围见[验证记录](../docs/VALIDATION.md)。

单独查看审计结果可运行 `npm audit`；如需逐条核对公告来源，运行 `npm audit --json`。
本轮审计仍报告 `10 high`，唯一公告对象为来源 CVE 已被拒绝、但尚未同步撤销的
`GHSA-mrhx-c7xc-m3w5`；[审计摘要](../docs/dependency-audit.json)保留实际退出状态与计数。
本工程不隐藏该输出，也不将其描述为已清零。

Remotion 使用条款见[官方许可证说明](https://www.remotion.dev/license)。
