# Remotion Video Lab

统一流程入口：`npm run workflow -- help`；完整操作、本地与GitHub分工、PCM24母带和外部Atmos接口见 [工作流说明](../docs/WORKFLOW.md)。

AI一周热点观察（10.26—10.30截至目前）：`AiWeekly-Bilibili` / `AiWeekly-Douyin`，9条AI进展，180秒/60fps，横1920×1080、竖1080×1920。
`npm run verify:ai-weekly-content` 校验文稿与声音；`npm run verify:ai-weekly-bilibili` / `verify:ai-weekly-douyin` 检查画面与音频；
`npm run render:ai-weekly` 导出并验收两版MP4。来源、开放状态与复现见[本期AI周报](../docs/AI-WEEKLY-20261030.md)。

Studio：<http://localhost:3000/AiWeekly-Bilibili> / <http://localhost:3000/AiWeekly-Douyin>。

本周汇总《这一周，世界留下什么》（10.26—10.30截至目前）：
`WeeklyTen-Bilibili` / `WeeklyTen-Douyin`，180秒/60fps，横1920×1080、竖1080×1920。
`npm run verify:weekly-ten-content` 核对稿件与旁白，`npm run verify:weekly-ten-bilibili` / `verify:weekly-ten-douyin` 检查两版画面与音频，
`npm run render:weekly-ten` 正式导出并检查完整MP4和实际混音。见[本期说明](../docs/WEEKLY-TEN-20261030.md)。
前期日报及其双平台版本继续保留。

近期热点短片《此刻，世界在发生什么》（2026-10-30）：`DailyTen20261030`，3分钟、1080p/60fps，
十则已核验新闻、本地中文神经旁白、逐句字幕、原创配乐与SVG动效。预览：
<http://localhost:3000/DailyTen20261030>；全部场景可在 `Effects/DailyTen-Scenes` 单独编辑。
来源、制作及验证范围见[本期说明](../docs/DAILY-TEN-20261030.md)。
`npm run verify:daily-ten-content` 核对原稿、24条字幕与音频哈希，`npm run verify:daily-ten` 检查23帧和12段音频。
此片当前交付本地Studio预览，未导出完整MP4。

双平台适配入口：B站横版 `DailyTen-Bilibili`（1920×1080），抖音竖版 `DailyTen-Douyin`（1080×1920），
均为60fps/180秒。分别打开 <http://localhost:3000/DailyTen-Bilibili> 与
<http://localhost:3000/DailyTen-Douyin>；竖版全部12场可在 `DailyTen-Portrait-Scenes` 单独编辑。
`npm run verify:daily-ten-bilibili` / `npm run verify:daily-ten-douyin` 检查各自规格和音频。
竖版为纵向重新排版，正文完整保留，并为右侧按钮与底部信息留出设计余量。

本目录是视频工程，完整介绍见[仓库 README](../README.md)。

AI 历史长片：`AiHistory30m`，30 分钟、1080p/60 fps。源码位于 `effects/ai-history/`，
免费本地神经语音工具位于 `scripts/ai-history-tts/`。
`npm run render:ai-history` 使用已完成的语音/时间轴并复用章节缓存；完整步骤见
[制作说明](../docs/AI-HISTORY-PRODUCTION.md)。

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
