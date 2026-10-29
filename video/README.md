# Remotion Video Lab

本目录是视频工程，完整介绍见[仓库 README](../README.md)。

```powershell
npm ci
npm run dev
npm run check:versions
npm run lint
npm run build
npm run render:test
npm run still:test
```

测试合成：`SmokeTest`，1920×1080、30 fps、180 帧（6 秒）。
默认输出：`out/smoke-test.mp4`；该目录不会上传 GitHub。

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
