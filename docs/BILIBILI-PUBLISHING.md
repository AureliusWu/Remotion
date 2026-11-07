# B 站投稿工作流

## 独立成片与读书视频

读书视频使用 `npm run book` 从同一份脚本导出标题、简介、章节和标签。完成本地渲染并明确授权本期公开投稿后，在 `video/` 下运行 `npm run book -- <book> <YYYY-MM-DD> submit --category <分区ID> --approval-ref <本期授权记录>`。首次需要按下文配置本机 biliup 账号。配置多位账号时用 `--account` 选择已获授权的账号。

命令把独立成片的确切帧数、成片及封面哈希、来源和文案一起交给审核包。AI 合成声明随稿件提交，并用创作中心回读。提交回执保存在本机的 `out/publish/`，用同一期次的 `book … status` 回查。公开成功需要同时核对原稿件身份和匿名取流。 [读书视频工作流](WORKFLOW.md#读书视频)

从 `video/` 运行。默认生成待审核包，实际投稿由操作者在本机终端确认。

## R0 审计

2026-11-06 检查远端 `main` 为 `8d8d693a71040a6acd2333d6136628a951fa2f20`，已包含 PR #4 与任务书。原工作树在 `7f68e1c7cef748002bee3ce8d04314bf76cf2052`，无未提交文件。本轮从远端 `main` 建立独立工作树，复用唯一 npm 工程 `video/`、Remotion 4.0.539、统一工作流、FFprobe／FFmpeg 全片验收和已有封面。现有代码里没有 B 站投稿模块。

两份本地成片在 `video/out/`，均为 2026-10-30 期的 1920×1080、60 fps、180 秒 MP4。本轮直接引用已有成片。同一批次的封面和媒体验收记录在 `examples/<edition>/`。

| 节目 | MP4 字节数 | MP4 SHA-256 | B 站原封面 SHA-256 |
| --- | ---: | --- | --- |
| `weekly-ten` | 125955655 | `10fed5d57eb83be9b0791a389060d97ac60cc76626785e3a546e67a24cd6a07a` | `1b2928a05d37cd95faf227d1f8adb06811b0b90323fa84b1c261b365230013d5` |
| `ai-weekly` | 111061998 | `5ec64376cab3816737213698458b9ca10ebb356f1044a19e0e14b5686fbe103c` | `4b7a85465e321daf1a404d6d4322d38cffb24a22a2f2acb4331fb33b1b6a908a` |

## 1. 生成并审阅

```powershell
npm run workflow -- publish --doctor
npm run workflow -- publish --edition weekly-ten --platform bilibili --mode prepare
npm run workflow -- publish --edition ai-weekly --platform bilibili --mode prepare
npm run workflow -- publish --edition weekly-ten --mode status
```

`prepare` 检查真实 MP4、成片与当期稿件/旁白的归属、封面归属，并重新完整解码。输出目录为 `out/publish/<edition>/<release-id>/`。打开 `manifest.json` 中的成片和封面，核对 `upload-metadata.json` 及审核资料。原 PNG 与上传用 JPEG 均绑定哈希。包可在登录前准备，`ready_for_review` 表示可人工审阅，来源、版权、音乐授权和分区由操作者核实。

可在 `out/` 中另建 `bilibili-metadata.json`，填写以下字段后通过 `--metadata out/bilibili-metadata.json` 重新准备。使用创作中心核对当前账号可用的真实分区 ID。版权类型取 `self-made` 或 `repost`，转载须填写实际 HTTPS `sourceUrl`。`title`、`description`、`tags` 可按当期内容覆盖。账号 UID 用十进制字符串。

```json
{
  "accountAlias": "my-local-account",
  "accountUid": null,
  "categoryId": null,
  "copyrightType": null
}
```

`--video` 和 `--cover` 只接受 `video/out/` 中可核对归属的媒体文件。遇到缺片、片段或证据不匹配时先补齐验收证据。旧版已验收成片如依赖当时的渲染快照，应保留该次 `out/<edition>-render/bundle/public/<edition>/voiceover-manifest.json`。

本轮已登记综合周报与 AI 周报的 2026-10-30 交付证据。新一期或更换成片时，先登记对应的渲染、交付、内容和封面证据。旧期回查可通过 `--release-id weekly-ten-20261030` 选择。

## 2. 首次登录和账号核对

适配器采用经过离线核对的 Windows x64 `biliup-cli 1.3.4`。先阅读第三方工具的个人学习研究使用条款和 B 站平台规则。适用时，从官方 GitHub Release 下载并放到 `%LOCALAPPDATA%\Remotion-Biliup\1.3.4\biliup.exe`，或在当前终端用 `REMOTION_BILIUP_EXE` 指定校验通过的绝对路径。[固定版本下载](https://github.com/biliup/biliup/releases/tag/v1.3.4) · [biliup 源码及使用条款](https://github.com/biliup/biliup) · [B 站开发者协议](https://openhome.bilibili.com/agreement/developer-service)

Windows x64 发布 ZIP 的 SHA-256 为 `3dde3ec89dc957b5b21f0b02fa6519e182530c8af39c8c06ad4245cf961f7219`，解包后二进制 SHA-256 为 `b508c56277b0ddfb479ee32fcef191e65290411e490973aa82fe5d46af6eebb6`。`--doctor` 校验二进制和命令能力，全程离线。

在本机 PowerShell 中由账号本人扫码。每个别名使用单独的私有登录文件，文件保存在仓库外的当前用户目录。

```powershell
$biliupRoot = Join-Path $env:LOCALAPPDATA 'Remotion-Biliup'
New-Item -ItemType Directory -Force -Path $biliupRoot | Out-Null
$biliupExe = Join-Path $biliupRoot '1.3.4/biliup.exe'
& $biliupExe --version
& $biliupExe --user-cookie (Join-Path $biliupRoot 'my-local-account.json') login
```

在同一私有目录创建 `publish-config.json`。把 UID 和昵称换成创作中心看到的真实值，且与投稿包目标一致。仅在本人确认条款和使用范围后填写 `acceptPersonalResearchTerms: true`。

```json
{
  "schemaVersion": 1,
  "acceptPersonalResearchTerms": true,
  "accounts": {
    "my-local-account": {
      "uid": "123456",
      "nickname": "创作中心中显示的账号昵称",
      "cookieFile": "my-local-account.json"
    }
  }
}
```

配置完成后运行 `npm run workflow -- publish --edition weekly-ten --mode status --remote`。首次只读核对登录，适配器要求本地凭据内的 UID 一致，并匹配已登录 `list` 返回的昵称。该 CLI 的登录输出未独立回显远端 UID，因此操作者还要核对账号本身。登录文件、私有配置和真实账号核查均在本地完成。

## 3. 提交和回查

```powershell
npm run workflow -- publish --edition weekly-ten --mode submit
npm run workflow -- publish --edition weekly-ten --mode status
npm run workflow -- publish --edition weekly-ten --mode status --remote
```

在可交互的 PowerShell 执行 `submit`。终端会展示本期标题、简介、标签、账号、分区、版权类型、视频及封面哈希和审核指纹。操作者核实后亲自输入本次随机确认短语。文件或元数据在确认后发生变化，需要重新审核。

| 状态 | 含义 |
| --- | --- |
| `ready_for_review` | 本地待审核 |
| `uploading` | 本地已记录开始提交 |
| `uncertain` | 平台是否接收仍未知，需要回查 |
| `submitted` / `pending_review` | 已找到对应平台记录，公开观看仍待核实 |
| `rejected` / `needs_attention` | 按原因处理平台拒绝或人工事项 |
| `cover_pending` | 远端封面尚未得到匹配确认 |

`status` 默认只读本地，`--remote` 才联系 B 站。`list` 与 `show` 结合回查确定稿件，程序将 BV 号当作待核候选直到读回对应记录。列表按最近三页核查，超出范围或回包无可关联标识时，需要在创作中心核对。[封面上传实现](https://github.com/biliup/biliup/blob/v1.3.4/crates/biliup-cli/src/uploader.rs#L419-L432) · [Web 提交回包实现](https://github.com/biliup/biliup/blob/v1.3.4/crates/biliup/src/uploader/bilibili.rs#L587-L621)

### 公开稿件的分层回查

1. **稿件身份。** 保留首次提交回执和原期次，在创作中心核对同一账号、BV、稿件 ID、标题和完整简介。遇到超时或只有候选 BV 时，继续回查原尝试。
2. **声明、可见性和封面。** 在创作中心核对作者的 AI 合成声明及公开设置。封面可通过 `show` 或创作中心目视核对，也可对可信 HTTPS 封面地址返回的字节计算 SHA-256，与投稿包的 `uploadCoverSha256` 比对。
3. **公开媒体。** 创作中心显示「开放浏览」后，用未登录会话核对同一 BV 的公开详情和播放。使用独立接口验证时，播放地址的 Range 请求返回 HTTP 206 且读到媒体字节，可记录为「未登录媒体可访问」。浏览器连续实播单独记录。本地适配器可能仍保留 `pending_review` 或 `cover_pending`，公开结论以独立回查为准。

检查结果与原始回执留在本机。账号凭据仅用于同一账号的创作中心查询，公开详情、封面和媒体请求使用未登录会话。GitHub CI 使用离线测试夹具验证投稿逻辑。

## 4. 故障恢复

- 网络超时、进程中断或回包缺失后，先查 `--mode status --remote`，再用创作中心核对。无法可靠确定稿件时保留 `uncertain`。已有上传尝试的一期不会再次进入上传。
- `status` 显示残留的 `packageLock` 或账号 `lock` 时，先确认原进程和上传工具均已退出。随后通过 `--mode status --unlock <lock-token>` 逐个恢复。程序再次检查本机锁主进程已退出，将未收尾的上传转为 `uncertain`。然后执行远端回查。
- 如果恢复进程本身曾崩溃，保留原发布锁和状态。停止其他投稿进程，在原主机核实 `recovery.lock` 中的 PID 已退出后，单独归档该恢复锁，再用原发布锁令牌执行恢复。
- 登录过期、验证或限流由账号本人处理。保留 `out/publish/` 中的状态和证据。同一期换文件或重建待审核包不能绕过曾经的上传尝试。
- 真实发布仅在本机，当前没有定时投稿。GitHub 双系统运行离线合成数据测试、小片和静帧验收。真实账号连通性、分区权限、实际封面与公开播放仍需账号本人验收。
