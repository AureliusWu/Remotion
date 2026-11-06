# Codex 执行任务：为 Remotion 仓库部署 B 站自动投稿工作流

> **任务类型**：在现有项目上实施并验证功能，不要只输出实施方案。  
> **目标仓库**：`https://github.com/AureliusWu/Remotion`  
> **目标分支**：从最新 `main` 创建独立功能分支，通过 PR 交付；不要直接改写或强推 `main`。  
> **执行环境**：优先本地 Windows（已有 Remotion、语音缓存与视频成片）；GitHub Actions 只承担代码与轻量媒体测试。  
> **默认发布策略**：`review`（人工确认后提交）；禁止默认自动正式投稿。  
> **基线检查日期**：2026-11-06；此前观测 `main` 的 HEAD 为 `b6635b7086e089bee8dfd78575d45270c54ad7aa`，**仅作历史参考**，执行前必须重新读取远端 HEAD。

## 0. 第一优先级：审计现有工作流，避免重复实现

先阅读并遵守：

- 根目录 `AGENTS.md`、`video/AGENTS.md`、`README.md`。
- `docs/WORKFLOW.md`、`docs/ENVIRONMENT.md`、`docs/VALIDATION.md`、`docs/VIDEO-ENGINEERING-LOG.md`。
- `video/package.json`、`video/workflow.config.json`、`video/scripts/workflow.mjs`、`.github/workflows/ci.yml`。
- 相关渲染 / 验收程序与现有测试：`video/scripts/`、`video/scripts/tests/`。

**已知事实（必须重新验证）**：

- `video/` 是唯一 npm 工程根；Remotion 及配套包锁定 `4.0.539`，不要另建 npm 项目。
- `npm run workflow -- list/check/qa/render/...` 是既有统一入口。
- 已有 `daily-ten`、`weekly-ten`、`ai-weekly` 三种新闻节目；B 站版是 `1920×1080、60fps`，现有节目常用时长为 `180s`，但不要将其硬编码到所有作品。
- `video/out/` 已被 Git 忽略，包含渲染成片、验证报告等，本地可能有尚未上传的大文件。
- 现有 GitHub CI 为 Windows + Ubuntu 双平台测试，**不上传整片**，不得加入 B 站登录凭据或直接向 B 站投稿。

执行前：

1. `git status`、`git fetch`，比对本地/远端最新 commit、未提交改动、已有功能分支和未合并 PR；保留现有用户改动。
2. 检索现有发布相关代码、封面生成、媒体清单、音画 QA、成片归档；有实现就复用，不重造。
3. 先检查 `video/out/` 已存在的 MP4 / PNG / JSON、大小和 SHA-256，**不得因重跑而覆盖或重复上传**。
4. 写一份简短实施对照：哪些能力已存在、哪些需要补齐、哪些依赖用户扫码登录。
5. 若现有文件与远端冲突，保护现场、说明冲突；禁止清空 `out/`、删除缓存、强制重置。

## 1. 目标效果

让 Codex 在现有视频生产基础上实现：

```text
指定节目/日期/稿件
    ↓
使用现有 workflow 做资料/原稿/旁白及视频 QA
    ↓
按需渲染 B 站横版成片（已通过的成片可复用）
    ↓
验收完整 MP4 + 匹配封面 + 生成投稿信息
    ↓
形成可复核的待投稿包（本地 dry-run）
    ↓
人工确认该稿件（首次/默认必须）
    ↓
通过投稿适配器提交 B 站
    ↓
回查投稿结果、稿件状态、BV 号
    ↓
保存发布报告 / 可恢复记录；失败时防重试误投稿
```

本轮优先完成**已有视频 → 待投稿包 → 审核 → 投稿 → 核实结果**这条实际可用的链路。新闻选题/脚本/配音/制作沿用现有逻辑；外部 LLM 自动生成新一期可作为第二阶段增强，不能为此重写现有作品。

## 2. 设计约束与实现接口

### 2.1 统一命令入口

扩展现有 `video/scripts/workflow.mjs`，建议新增 `publish` 子命令；不改变已有命令语义。

**预期命令形态**（由你实现；当前仓库不保证已经支持）：

```powershell
cd video

# 查看本地能力、B 站工具是否可用、账号登录是否需要人工操作（不投稿）
npm run workflow -- publish --doctor

# 用现有节目/成片生成 B 站待投稿包，不产生任何网络投稿动作
npm run workflow -- publish --edition weekly-ten --platform bilibili --mode prepare

# 对其他已有节目也可复用
npm run workflow -- publish --edition ai-weekly --platform bilibili --mode prepare

# 明确经过用户批准后才执行真正的投稿动作
npm run workflow -- publish --edition weekly-ten --platform bilibili --mode submit

# 查询并核实投稿结果；未知状态不自动重传
npm run workflow -- publish --edition weekly-ten --platform bilibili --mode status
```

可增设 `--video <绝对或相对路径>` 与 `--cover <路径>` 选择已完成的作品，且必须核对本次稿件与媒体文件的真实归属。路径验证必须阻止目录穿越和意外误读敏感文件。

默认所有命令均为**只读或本地写入**；只有 `submit` 允许投稿。`submit` 必须显示标题、目标账号、视频 SHA、封面、投稿配置和唯一提交指纹，并要求人**亲自在交互终端输入确认短语**（或等效的可审计确认机制），不能因 Codex 自己执行命令就推定用户已经批准；非交互执行默认拒绝。

### 2.2 推荐模块布局（按仓库实际习惯调整）

```text
video/
  scripts/
    publish/                 # 新增：相互独立的工具模块
      prepare.mjs            # 验证/拼装待投稿包
      bilibili-adapter.mjs   # 独立适配器，封装外部工具调用
      state.mjs              # 发布状态、锁、幂等键与原子持久化
      verify.mjs             # 成片/封面/元数据校验
      status.mjs             # 远端核查与结果归档
    tests/
      publish-*.test.mjs     # mock adapter / fixture / 故障测试
  out/
    publish/                 # 本地输出，禁止提交 Git
      <edition>/<release-id>/
        manifest.json
        upload-metadata.json
        approval.json        # 本地批准记录，不含 Cookie
        state.json
        result.json
        publish.log          # 已脱敏日志
        cover.png            # 必要时拷贝到此处，视频可引用原位置
```

如果已有适用的 `lib`、测试工具、原子写入或报告格式，则复用它们。建议在 `docs/` 新增 `BILIBILI-PUBLISHING.md`，记录操作指南、权限、恢复方式、验收结果；将可复用经验追加到 `docs/VIDEO-ENGINEERING-LOG.md`。

### 2.3 元数据契约

投稿包至少含有：

```json
{
  "schemaVersion": 1,
  "edition": "weekly-ten",
  "releaseId": "weekly-ten-YYYYMMDD",
  "platform": "bilibili",
  "compositionId": "WeeklyTen-Bilibili",
  "accountAlias": "user-selected-local-account",
  "videoPath": "resolved-local-file-path",
  "videoSha256": "sha256-of-actual-final-mp4",
  "coverPath": "resolved-local-cover-path",
  "coverSha256": "sha256-of-actual-cover",
  "title": "待确认的真实标题",
  "description": "待确认的真实简介，必要时含来源",
  "tags": ["新闻", "本周回顾"],
  "copyrightType": "self-made-or-repost-as-verified",
  "sourceUrl": null,
  "categoryId": null,
  "sourceReview": "passed-or-manual-required",
  "mediaQa": "passed",
  "status": "ready_for_review"
}
```

上述为**接口示例，不得当作当前真实投稿信息使用**。标题、分区、版权类型、发布日期、简介及标签应从本期内容或用户配置生成，经有效性检查后让用户确认；不凭空填充新闻来源、版权归属或平台分区 ID。`releaseId` 与本期日期应明确区分，不拿旧视频的时间范围冒充新内容。外部程序所需配置由适配器从这个通用契约转换。

## 3. B 站投稿适配器：先验证可用性，再接入

**首选 MVP**：本机 `biliup` 命令行，作为独立的可替换适配器；不将它作为 Remotion 核心依赖。参考：

- https://github.com/biliup/biliup
- https://doc.biliup.rs/guide/configs/config.html

其当前文档列有 `login`、`renew`、`upload`、`list`、`show` 命令，`upload` 支持标题、简介、标签、分区与版权参数。**执行时必须以本地安装版本的 `--help` 为准**，不要盲用旧博客或未核验的命令参数。

执行顺序：

1. 检查支持的平台与本机工具版本，确认用户接受该第三方工具的许可证、使用边界及 B 站平台规则。biliup 仓库注明仅供个人学习研究、禁止商业使用，不保证稳定性；不满足条件时不要强行部署它。
2. 只有用户本人完成 B 站登录、扫码或授权。工具登录文件保存在**仓库之外**的用户专属私有目录，例如 Windows 用户配置目录；不得放入工作区、日志、PR、Artifacts、GitHub Secrets（本阶段不需要）。
3. 使用安全的子进程 API 调用已安装的 `biliup` 可执行文件；参数分离传递，**不要字符串拼接 shell 命令**。对参数与外部输出做校验及脱敏。
4. `prepare` 只形成待投稿包，**不能调用 `biliup upload`**；该命令会发起真实投稿。
5. `submit` 先校验视频/封面/manifest SHA 未变、 QA 为 PASS、人工批准指纹与当前包完全匹配、账号可用，再调用投稿。
6. **封面设置必须真正确认生效**：当前文档的 `--cover` 标注为封面 URL，不能想当然直接传本地 PNG。验证本地版本是否支持封面上传、配置文件或其他合规路径；不支持则标记 `cover_pending` 并阻止宣称“全自动发布成功”。可以使用受控的 Playwright / Computer Use 辅助封面操作，但不能绕过人工批准、登录验证或验证码。
7. 投稿后通过返回信息与 `list` / `show` / 创作中心交叉确认稿件，记录 BV 号、状态与可访问链接。**提交成功、审核中、公开发布是三个不同状态**；不得混为一谈。
8. 若 biliup 不适用，则抽象 `BilibiliPublisher` 接口，预留**经真实授权的官方开放平台 API**或受控浏览器操作适配；不要未经确认使用所谓“官方接口”或逆向接口。始终遵守平台政策。

参考 CLI 命令（**仅供 Codex 做能力侦测，不能作为自动投稿脚本直接执行**）：

```powershell
biliup --version
biliup --help
biliup upload --help
biliup list --help
biliup show --help
# 用户授权登录时，才交互执行：biliup login
```

## 4. QA 与阻断条件

严格复用既有媒体验收系统；新增的 `prepare` 必须在以下条件满足时才进入 `ready_for_review`：

- 真实存在可读、非零大小的**完整最终** MP4，禁止 partial/预览片段冒充正式成片。
- 保留并核对该次 `render/qa/check` 与导出验证记录；按现有脚本对最终文件进行 FFprobe、完整解码、分辨率、fps、时长、视频/音频轨检查。
- B 站版应与所选 composition 的横版规格一致，默认 1920×1080、60fps；不能仅凭文件名判定。
- 对视频及封面计算 SHA-256；检查封面可读、尺寸/比例合理，且确实与本期内容匹配。
- 信息视频检查稿件日期、资料来源及说明，若来源缺失或结论有明显不确定性，阻断全自动发布并请求人工复核。
- 内容真实、知识产权/音乐授权与发布分区要经审查；AI 不能将未验证的内容标为已通过。
- 原稿、配音、成片版本一致；如果生成新的渲染文件，旧的批准必须失效。

**禁止误报**：只有真实完成全片导出和验证才能报告 `mediaQa=passed`；只有在 B 站查到对应投稿记录才能报告 `submitted`；只有审核通过且实际可观看才报告 `published`。

## 5. 幂等、防重复、失败恢复

必须提供可测试的状态机与持久化机制：

```text
new → validating → ready_for_review → approved
    → uploading → submitted → pending_review → published
                                 ↘ rejected / needs_attention
异常（网络超时、进程崩溃、回包丢失）→ uncertain → reconcile → 可恢复状态
```

要求：

1. 幂等键包含至少 `platform + accountAlias + edition/releaseId + videoSha256`。本地已存在 `submitted/pending_review/published` 时绝不重复投稿；同一稿件的内容相同但文件 SHA 变化时也需提醒用户判断是否属于重复一期。
2. 同一幂等键只允许一个上传进程：跨进程锁，异常退出可人工确认后清理；状态与日志原子写入。
3. 进程在“服务端可能已接受稿件”后断线时，写入 `uncertain`，**首先进行远端投稿列表核对**，不得立即再次执行 `upload`。
4. 不完整上传、过期登录、限流、验证码、网络错误分类处理；无资格自动重试时返回 `needs_attention`。验证码与平台安全验证必须交给用户正常完成，不尝试绕过。
5. 同一稿件手动 `retry` 必须先远端核验、再展示重试风险并经用户重新批准。无谓自动重试可能导致重复投稿。
6. 记录精确的文件哈希、工具版本、Git HEAD、投稿开始/结束时间、状态、远端稿件标识和脱敏错误；禁止写入 Cookie、令牌、密钥、完整认证 HTTP 头。
7. 发布报告写入 `video/out/publish/`，大体积 MP4/母带/TTS 模型不得进入 Git 仓库；归档之前先检查已有相同 SHA 的文件，避免重复复制或上传。

## 6. CI、安全与调度

- 不改坏 `.github/workflows/ci.yml` 的双系统验证矩阵与现有状态门禁。
- CI 只测试 `prepare/metadata/state/duplicate/lock/reconcile` 的**模拟环境**，不得访问真实 B 站账号；不可因为 CI PASS 就说投稿已通过。
- 真正上传与浏览器登录阶段在本地可信环境运行；日后若迁移到云端，先单独做威胁建模和权限设计。
- 默认不开启 Cron 自动发稿。如新增定时执行，只能跑“制作/待投稿包生成/状态核查”；正式发布依旧人工批准。
- 如未来新增 `auto` 模式，必须作为独立且默认关闭的显式开关，限定允许的节目、账号、时间窗口，具备熔断与撤销机制。首次交付可先不实现 `auto`。
- 依赖尽量少。不要升级现有 Remotion/React 栈，不运行全量依赖升级，不泄露账号或个人文件。

## 7. 分阶段交付与验收

### R0：只读审计

- 给出 main HEAD / 本地 HEAD、干净程度、现有命令、已有成片/封面和可复用的验证工具。
- 确认没有重复实现的投稿模块；若发现，优先修复扩展。

### R1：待投稿包 MVP（应完整落地）

- 实现 `publish --doctor / --mode prepare / --mode status` 的本地无副作用模式。
- 能对至少 `weekly-ten` 和 `ai-weekly` 生成合法 manifest 与审核报告；若本地缺少完整 MP4，明确阻断，不假装成功。
- 实现 QA 阻断、哈希、幂等、锁、状态持久化和本地 mock 测试。

### R2：真实适配器与人工确认（本次重点）

- 接入已验证的 B 站投稿适配器；人工登录后才能做账号连通性测试。
- 实现 `submit` 的**真实人工确认门禁**；没有用户直接授权时只运行 dry-run/mocked tests。
- 仅当用户明确批准某一个实际稿件及目标账号时，才执行真实投稿；完成后记录投稿标识、封面状态、审核状态及可核验地址。
- 若因缺少凭据、第三方工具许可/兼容性或用户批准而无法真实发布，代码照常交付，但必须明确列出剩余人工操作，不能虚构 BV 号。

### R3：端到端串联（可在 R1/R2 稳定后实现）

- 新增一个 `pipeline --edition ... --platform bilibili` 入口，将既有 `check → qa → render → export verification → publish prepare` 串联。
- 通过缓存及输入哈希跳过已完成的有效阶段；任务中断后根据已落盘证据恢复，不能重新渲染/上传全部步骤。
- 可提供 Windows 任务计划程序配置样例，但默认只自动制作到待审核状态。

### 测试最低要求

| 场景 | 期望 |
| --- | --- |
| 仅执行 prepare | 无网络投稿，生成本地待投稿包 |
| MP4 缺失/仅 partial | 阻断，不能进入 ready_for_review |
| 媒体 QA 失败/封面缺失 | 阻断并说明缺项 |
| 未经用户批准直接 submit | 拒绝，绝不调用外部上传 |
| 对同一稿件重复执行 submit | 本地/远端幂等阻止第二次上传 |
| 上传后超时或进程退出 | 标记 uncertain；先核实远端，禁止盲目重传 |
| 上传成功但审核中 | 显示 submitted/pending_review，不写 published |
| 修改视频或封面后复用旧批准 | 拒绝，要求重新审核 |
| 日志/CI 产物扫描 | 无 Cookie、token、密码、大体积成片 |
| 现有项目回归 | 版本检查、lint/build、workflow 测试、适用的 QA 均不退化 |

## 8. 你最后必须交付给我

1. **代码**：功能分支、PR 地址、真实提交 SHA；不要擅自合并到 main。
2. **文档**：可供普通用户照抄的首次登录、prepare、人工批准、submit、status、故障恢复步骤。
3. **测试**：列出实际执行过的命令、PASS/FAIL 与其证据路径；未运行就写“未运行”。
4. **演示**：至少完成一轮 `prepare → 用户审阅 → mock submit → mock status`，证明重复执行不会重复投稿。
5. **真实投稿状态**：如未取得我的明确批准，报告“未实际投稿（等待授权）”，不得杜撰 BV 号或说部署已经可无人值守。
6. **后续待办**：精确列明账号登录、分区、封面兼容、平台权限、定时发布仍需我做的事情，不要拿“技术完成”掩盖依赖用户的步骤。

## 9. Codex 执行指令（请按此推进）

立即开始 R0 审计，然后实施 R1 和能够安全完成的 R2，运行可行的本地/CI 测试，按真实结果修复问题，并创建 PR。不要停在分析或纯方案阶段；遇到外部账号登录、验证码、平台规则限制或需要发布真实稿件时，**暂停该真实动作并请求我的明确批准**，其余不依赖账号的工作继续完成。最终回报以已完成的实现和可核查证据为准。

---

### 外部核验参考（实施时重新检查）

- Remotion CLI: https://www.remotion.dev/docs/render
- biliup 源码、许可及风险声明: https://github.com/biliup/biliup
- biliup CLI 命令参考: https://doc.biliup.rs/guide/configs/config.html