# Remotion 视频生成与渲染联调

本仓库用于联合调试 Remotion，开展基于 Remotion 的视频生成、效果预览与渲染验证。

## 协作范围

- 视频生成：开发和调试视频代码、场景、动画及素材组织。
- 效果预览：检查画面、时间轴、字幕和音频效果。
- 视频渲染：验证视频导出流程，排查渲染失败、性能和输出问题。
- 联合调试：记录可复现的问题、调试过程及验证结果。

## 工程结构

```text
video/                  Remotion + React + TypeScript 工程
  src/Composition.tsx   SmokeTest 测试视频与合成注册
  out/                  本地渲染输出（不纳入 Git）
examples/               已验证的小型测试成片、封面和媒体信息
docs/VALIDATION.md      预览、构建与渲染验证记录
```

## 安装与预览

在终端进入仓库根目录后执行：

```powershell
cd video
npm ci
npm run dev
```

打开终端打印的 Studio 地址，选择 `SmokeTest`。本次使用
`http://localhost:3000/SmokeTest`。在 Codex 中启动且不弹出系统浏览器时，可使用
`npm run dev -- --no-open`。

## 检查与渲染

以下命令在 `video` 目录中执行：

```powershell
npm run lint
npm run build
npm run render:test
npm run still:test
```

- `render:test`：导出 `video/out/smoke-test.mp4`，H.264、1920×1080、30 fps、6 秒。
- `still:test`：导出第 90 帧到 `video/out/smoke-test.png`。
- 首次渲染会自动下载 Chrome Headless Shell，需要网络连接。
- `node_modules`、构建缓存和日常渲染输出均被 Git 忽略。

## 测试视频

`SmokeTest` 包含英文标题、中文副标题、旋转图形、逐帧计数和进度条；动画由
Remotion 帧数驱动。共 180 帧，没有外部素材或音轨。

![SmokeTest 第 90 帧](examples/smoke-test.png)

[下载测试 MP4](examples/smoke-test.mp4) ·
[查看验证记录](docs/VALIDATION.md) ·
[媒体信息](examples/media-info.json)

## 依赖说明

- Remotion 及其配套包固定为 `4.0.539`，通过 `package-lock.json` 锁定依赖。
- 上游当前锁定的 Zod `4.5.4` 受
  [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
  影响；本工程通过 `overrides` 使用修复版 `4.6.6`，安装审计为 0 个漏洞。
- Remotion CLI 仍会提示 Zod 与上游建议版本不同；该提示予以保留。当前覆盖版本已通过
  本次代码检查、构建、Studio 预览、MP4 渲染和静帧导出验证。升级 Remotion 时需重新核对。
- 中文使用系统字体回退；本次在 Windows 微软雅黑环境验证。跨平台字体外观可能不同。
