# SmokeTest 验证记录

验证日期：2026-10-29。

本轮记录恢复 Remotion 官方推荐的 Zod `4.5.4`、移除 `overrides` 后的重新验证。
此前使用 Zod `4.6.6` 的已通过结果属于历史基线，不作为本轮通过的证据。

## 环境与工程

- Windows 10，Node.js `24.14.1`，npm `11.11.0`。
- Remotion 及配套包：`4.0.539`；React / React DOM：`19.2.3`。
- Zod：`4.5.4`，直接固定版本，无 `overrides`，未关闭版本检查或修改上游检查代码。
- 工程目录：`video/`；合成 ID：`SmokeTest`。
- 规格：1920×1080，30 fps，180 帧，6 秒，无音轨。

## 本轮重新验证

| 检查                     | 当前结果                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| 干净依赖安装             | `npm ci` 通过，使用官方推荐 Zod `4.5.4`                                                         |
| 依赖版本检查             | `npm run check:versions` 退出码 0，明确输出 `All packages have the correct version`             |
| ESLint + TypeScript      | `npm run lint` 退出码 0，无版本差异提示                                                         |
| 工程构建                 | `npm run build` 退出码 0，无版本差异提示                                                        |
| Zod 与 Remotion 辅助类型 | Zod 以及 `@remotion/zod-types` 的 `zColor()`、`zTextarea()` 有效与无效输入解析检查通过          |
| Studio 页面              | 重启后 `SmokeTest` 正常加载                                                                     |
| Studio 元数据            | 1920×1080、30 fps、180 帧，与注册信息一致                                                       |
| Studio 播放              | 实际播放帧数从 0 推进到 6、58；按钮从 Play 切换为 Pause，暂停于 62 帧后定位到 90 帧             |
| Studio 错误状态          | `get_current_error` 返回 `null`                                                                 |
| MP4 渲染                 | `npm run render:test` 退出码 0，日志中版本差异和 Zod 版本提示均为 0 次                          |
| 静帧渲染                 | `npm run still:test` 退出码 0，日志中版本差异和 Zod 版本提示均为 0 次                           |
| MP4 媒体检查             | FFprobe 确认 H.264、1920×1080、30/1 fps、180 帧、6.000 秒，无音轨，673897 字节                  |
| 成片抽帧                 | 本轮成片首帧、中间帧、末帧实际解码全部退出码 0；MP4 与此前已验证示例的 SHA-256 一致             |
| 依赖审计                 | `npm audit --json` 退出码 1，报告 `10 high`；唯一公告对象为 `GHSA-mrhx-c7xc-m3w5`，未隐藏或清零 |

审计的实际退出状态、计数、唯一公告来源及 CVE 官方状态已记录在
[`dependency-audit.json`](dependency-audit.json)。CVE 已被拒绝与 GHSA 尚未同步是两项不同状态，
不能把原始审计退出码 1 改记为通过。

本轮 FFprobe 实测像素格式为 `yuvj420p`、色彩范围为 `pc`，即 H.264 4:2:0 全范围视频。
媒体信息见 [`examples/media-info.json`](../examples/media-info.json)。

本轮已重新执行渲染。新生成的 MP4 与此前 `examples/smoke-test.mp4` 的 SHA-256
均为：

```text
32217236fd593161a479e262f959cf66f61145190b45b907f9de2db0c023edb7
```

此前示例的中文显示、布局和末帧 100% 进度条已目视验证；本轮渲染产物的哈希保持一致。

## 示例文件

- [`examples/smoke-test.mp4`](../examples/smoke-test.mp4)：本轮重新渲染验证的测试成片，673897 字节。
- [`examples/smoke-test.png`](../examples/smoke-test.png)：第 90 帧封面。
- [`examples/studio-preview.png`](../examples/studio-preview.png)：Studio 预览验证截图。

日常生成文件保留在被忽略的 `video/out/`；这里仅提交小型测试示例。

## 安全公告状态与验证边界

1. `CVE-2023-54404` 已被 CNA 拒绝，原先“必须覆盖 Zod `4.5.4`”的依据已更新。
   本轮审计仍报告 `10 high`，其唯一公告对象为该 CVE 对应的 GHSA；保留实际审计结果，
   不隐藏输出，也不宣称审计已经清零。原始证据及精确时间见[依赖说明](DEPENDENCIES.md)。
2. 本次验证视频画面与无音轨 MP4 流程，不代表已经覆盖音频混音、外部素材下载、云端渲染或不同系统的字体。
3. 初次下载官方模板时直连 GitHub 超时；使用本机已有代理后成功。
   本次代理仅作用于相应命令进程，没有写入全局 npm 或 Git 配置。
