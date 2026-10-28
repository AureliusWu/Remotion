# SmokeTest 验证记录

验证日期：2026-10-29。

## 环境与工程

- Windows 10，Node.js `24.14.1`，npm `11.11.0`。
- Remotion 及配套包：`4.0.539`；React / React DOM：`19.2.3`。
- 工程目录：`video/`；合成 ID：`SmokeTest`。
- 规格：1920×1080，30 fps，180 帧，6 秒，无音轨。

## 已通过

| 检查                | 结果                                                                |
| ------------------- | ------------------------------------------------------------------- |
| ESLint + TypeScript | `npm run lint` 退出码 0                                             |
| 工程构建            | `npm run build` 退出码 0                                            |
| Studio 页面         | `http://localhost:3000/SmokeTest` 正常加载                          |
| Studio 元数据       | 1920×1080、30 fps、180 帧                                           |
| Studio 播放         | 播放按钮切换为暂停，时间轴帧数推进并循环                            |
| Studio 错误覆盖层   | 无错误                                                              |
| MP4 渲染            | `npm run render:test` 退出码 0，编码 180 帧                         |
| 静帧渲染            | `npm run still:test` 退出码 0，第 90 帧正常                         |
| MP4 媒体检查        | FFprobe 确认 H.264、1920×1080、30/1 fps、180 帧、6.000 秒           |
| 成片抽帧            | 解码首帧、中间帧、末帧；中文无方框、布局无裁切、末帧进度条达到 100% |
| 依赖安装审计        | 覆盖 Zod 后报告 0 个漏洞                                            |

渲染结果为 H.264 4:2:0 全范围视频；FFprobe 将像素格式标记为 `yuvj420p`、
色彩范围标记为 `pc`。原始媒体信息见 [`examples/media-info.json`](../examples/media-info.json)。

## 示例文件

- [`examples/smoke-test.mp4`](../examples/smoke-test.mp4)：本次测试成片，约 674 KB。
- [`examples/smoke-test.png`](../examples/smoke-test.png)：第 90 帧封面。
- [`examples/studio-preview.png`](../examples/studio-preview.png)：Studio 预览验证截图。

日常生成文件保留在被忽略的 `video/out/`；这里仅提交小型测试示例。

## 已知提示与验证边界

1. Zod 使用修复版 `4.6.6`，与 Remotion 当前上游建议的 `4.5.4` 不同。
   CLI 会输出版本差异提示；没有关闭版本检查或隐藏提示。本次上述流程均已实测通过。
2. 本次验证视频画面与无音轨 MP4 流程，不代表已经覆盖音频混音、外部素材下载、云端渲染或不同系统的字体。
3. 初次下载官方模板时直连 GitHub 超时；使用本机已有代理后成功。
   本次代理仅作用于相应命令进程，没有写入全局 npm 或 Git 配置。
