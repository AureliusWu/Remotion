# 依赖版本与安全公告状态

核对日期：2026-10-29。

## 当前选择

- `remotion` 和已安装的 `@remotion/*` 配套包固定为 `4.0.539`。
- 已运行官方 `npx remotion add zod`，将 Zod 直接固定为该 Remotion 版本推荐的 `4.5.4`，
  由 `package-lock.json` 记录实际依赖树；随后 `npm ci` 干净安装通过。
- 移除此前强制使用 Zod `4.6.6` 的 `overrides`，保留 Remotion 版本检查和 npm 审计。
  不修改 `node_modules` 中的版本检查代码，不安装本地兼容补丁。

## 为什么撤销此前的版本覆盖

此前文档依据 `GHSA-mrhx-c7xc-m3w5` 将 Zod `4.5.4` 视为受影响版本，并通过
`overrides` 使用 `4.6.6`。新的原始证据已改变这项判断的依据：

1. [CVE 官方 API](https://cveawg.mitre.org/api/cve/CVE-2023-54404) 的
   `cveMetadata.state` 为 `REJECTED`；`dateRejected` 和 `dateUpdated` 均为
   **`2026-10-28T21:17:22.423Z`**，即上海时间 **2026-10-29 05:17:22.423**。
2. CNA 为 VulnCheck。拒绝理由认为，所描述的内存增长与已分配的输入体积成比例，
   仅在应用未限制请求大小时可达，属于验证器的预期行为，而不是 Zod 的缺陷。
3. [Zod 维护者的撤销申请 PR #10750](https://github.com/github/advisory-database/pull/10750)
   已追加 CVE 被拒绝的说明；核对时该 PR 仍为 Open。
4. [GitHub 公告 GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
   核对时仍显示 High 及旧版本范围，尚未与 CVE 的拒绝状态同步。

本工程据此恢复官方推荐版本，以解决严格辅助依赖检查的版本提示。
这不等于宣称 npm 审计为 0，也不构成对所有 Zod 使用场景的整体安全结论。

## 检查与记录方式

在 `video/` 目录执行：

```powershell
npm run check:versions
npm audit
npm audit --json
```

- `check:versions` 使用原生 `remotion versions`，核对 Remotion 及辅助依赖版本。
  本轮退出码为 0，输出 `All packages have the correct version`。
- 本轮 `npm audit --json` 退出码为 1，实际报告 `10 high`；逐条核对 `via` 和依赖链后，
  唯一公告对象 URL 为上述 `GHSA-mrhx-c7xc-m3w5`。
  [审计摘要](dependency-audit.json)保留退出码、计数、公告来源和 CVE 官方状态。
- 不把多个传递依赖关联项直接解释为多个彼此独立、已经确认的漏洞，也不忽略其他公告。
- 不通过关闭审计、过滤输出或降低退出阈值制造“已清零”的结果。

本轮代码、预览、渲染和媒体信息的实测结果见[验证记录](VALIDATION.md)。
