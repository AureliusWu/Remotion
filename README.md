# Remotion 视频生成与渲染联调

<!-- project-badges:start -->
[![Version](https://img.shields.io/github/v/tag/AureliusWu/Remotion?sort=semver&style=flat-square&label=version)](https://github.com/AureliusWu/Remotion/tags) [![Last commit](https://img.shields.io/github/last-commit/AureliusWu/Remotion?style=flat-square)](https://github.com/AureliusWu/Remotion/commits/main)
<!-- project-badges:end -->

用于 Remotion 视频生成、Studio 预览、动画开发和本地渲染验证。`video/` 是唯一 npm 工程根。

## 当前作品

- `AiHistory30m`：30 分钟 AI 发展史长片，见 `docs/AI-HISTORY-PRODUCTION.md`。
- `PoissonEncounters`：泊松过程科普短片，见 `docs/POISSON-FILM.md`。
- `ChinaGenAiTimeline`：中国生成式 AI 用户规模数据视频，见 `docs/CHINA-GENAI-SOURCES.md`。
- `PelicanRide`：鹈鹕海岸骑行插画动画，见 `docs/PELICAN-RIDE.md`。
- `SmokeTest`：基础渲染与环境联调样例。

## 开发与验证

```powershell
cd video
npm ci
npm run check:environment
npm run dev -- --no-open
```

常用检查：

```powershell
npm run check:versions
npm run lint
npm run build
npm run render:test
npm run still:test
```

日常输出位于 `video/out/`，不进入 Git。

## AI / 维护者入口

修改前先读 [AGENTS.md](AGENTS.md) 与 [video/AGENTS.md](video/AGENTS.md)。

- 新动画放在 `video/effects/<name>/` 并由 `video/effects/index.tsx` 注册；已有作品保持原目录。
- Remotion / `@remotion/*` 包保持相同精确版本，不为消除告警随意升级或修改上游代码。
- 信息类视频先核原始来源，区分统计期、发布日期与检索日期，不把推算写成事实。
- 工程问题、修复和可复用经验写入 `docs/VIDEO-ENGINEERING-LOG.md`。
- 环境与依赖说明分别见 `docs/ENVIRONMENT.md`、`docs/DEPENDENCIES.md`。
- 预览、静帧、局部导出和完整成片是不同验收层级，未实际导出的成片不能写成已完成。

README 只保留工程入口和当前作品索引；详细脚本、来源、验证报告和制作日志放在 `docs/`。