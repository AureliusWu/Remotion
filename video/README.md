# Remotion Video Lab

本目录是视频工程，完整介绍见[仓库 README](../README.md)。

```powershell
npm ci
npm run dev
npm run lint
npm run build
npm run render:test
npm run still:test
```

测试合成：`SmokeTest`，1920×1080、30 fps、180 帧（6 秒）。
默认输出：`out/smoke-test.mp4`；该目录不会上传 GitHub。

本次已验证的小型示例另存于仓库的 `examples/` 目录。
依赖覆盖、版本提示与验证范围见[验证记录](../docs/VALIDATION.md)。

Remotion 使用条款见[官方许可证说明](https://www.remotion.dev/license)。
