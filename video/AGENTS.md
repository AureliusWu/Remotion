# Remotion 项目维护

本目录是唯一 npm 工程根，继承上级 `AGENTS.md` 的视频验证与经验记录要求。

- `effects/<name>/`：新动画独立模块；在 `effects/index.tsx` 注册，显示于 Studio 的 Effects。
- `src/Root.tsx`：总入口；`src/` 中已有视频保持原结构。素材用 `public/<name>/`，输出用 `out/`。
- 所有动画共享本目录的依赖和锁文件，禁止在子目录创建新项目或重复安装基础包。
- 不随意升级，保留 `.npmrc` 的 `save-exact=true`。所有 `remotion` / `@remotion/*` 包保持相同精确版本；额外包按需在本目录通过
  `npx --no-install remotion add <package>` 安装，完成后执行 `npm run check:versions`。
- 先用 `npm run check:environment` 定位 Node、依赖、原生二进制和浏览器问题，再修复缺项。
  诊断命令不自动下载安装；仅浏览器缺失或版本不符时使用 `npm run browser:ensure`。
- FFmpeg/FFprobe 使用 `npm run ffmpeg -- <args>` / `npm run ffprobe -- <args>`，不需要全局 PATH。
- 开发先启动 Studio；修改后运行 `npm run lint`、`npm run build`。环境回归使用
  `npm run verify:environment`、`npm run render:environment`、`npm run verify:environment-export`。
- 报错先保留日志并区分依赖、网络、浏览器、媒体与源码原因；不盲目删 node_modules、清缓存、
  更新全部包或修改上游代码。平台限定的 macOS/Linux 可选包未安装不属于 Windows 缺项。
- 实际有效的修复记录到 `../docs/ENVIRONMENT.md` 与 `../docs/VIDEO-ENGINEERING-LOG.md`。
