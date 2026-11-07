# Remotion本地与GitHub工作流

`video/`是唯一npm工程根，版本固定为Remotion 4.0.539。作品与音频不因流程整理迁移或覆盖。
新闻三期由 `video/workflow.config.json` 登记：`daily-ten`、`weekly-ten`、`ai-weekly`。
平台为 `bilibili`（1920×1080）与 `douyin`（1080×1920），当前均180秒、60fps。
其他既有作品仍使用各自制作命令和Studio入口。

## 一次制作的顺序

1. 核验资料和日期，编辑独立模块里的 `storyboard.json`，锁定旁白及分镜时槽。
2. 本地生成或接收旁白，保留原始音频和逐句字幕。需要重建 PCM24 母带的栏目另行保留原始浮点样本。
3. Studio预览，执行内容、类型、构建、真实静帧和源音频检查。
4. 明确需要导出时运行完整渲染；也可显式渲染部分帧作调试，文件名和报告会标注partial。
5. 选择标准AAC、PCM24无损封装或外部Atmos分支，再验收实际输出。
6. 分支推送与PR触发GitHub矩阵CI，核对实际提交SHA、两个系统的结果和小体积证据。

## 独立科普片

1. **先写叙事和证据。** 用一个观众能辨认的日常场景提出问题，再说明概念和相关研究，接着追问什么条件下会有另一种解释，最后回到开场的人或事。每段在分镜中区分原始研究、机制解释和原创示意。重看同一画面时固定目标的颜色、数量和位置，只改变注意指引。数值比较始终显示分子、分母和单位，动画揭示答案时保留完整的计数对象。
2. **用实测音频定字幕。** 合成任务读取一份固定字节的故事板快照。末段改稿时可以复用未变句子的缓存，用最终快照重新拼接整轨和清单。把最终旁白和字幕接入 Studio 前，核对 `storyboardSha256`、`audioSha256` 以及所有字幕与最终稿的逐句对应。字幕时间相对每段起点时，字幕组件使用场景内局部帧。按实际采样检查场首、句间和场尾留白，超出时槽优先缩句。
3. **分别验收预览、成片和封面。** Studio 试播并检查场景切换与字幕。内存紧张时，完成目视检查后关闭额外的 QA 标签页，整片渲染期间避免并行重打包。导出后从实际 MP4 抽查开头、关键图解、片尾和最后一帧。用 FFprobe 核对尺寸、帧率、帧数和音轨，再完整解码。1920×1080、60 FPS 的整 3 分钟画面应有 10,800 帧。使用 GPT 生图作封面时，记录提示词，保留原图与最终 PNG，按移动端缩略图检查中文题字、主体和裁切，再绑定最终 PNG 及投稿 JPEG。
4. **保留独立作品的验收边界。** 静帧、局部片段、完整本地导出和平台开放浏览分别记证据。独立合成以自己的期次、来源、成片和封面进入投稿包，完整成片与原始日志留在 `video/out/`，只在仓库记录可复用做法和证据摘要。

实测样例见 [《频率错觉》分镜与来源](FREQUENCY-ILLUSION-20261106.md) 和 [工程记录](VIDEO-ENGINEERING-LOG.md#2026-11-06--频率错觉)。独立作品的媒体与授权绑定见 [B 站投稿工作流](BILIBILI-PUBLISHING.md)。

## 读书视频

在 `video/effects/<book>/script.json` 一起维护书名、作者、原著来源、逐句口播、分镜和投稿文案。先定稿，再根据每句旁白的实测时长排分场和字幕。日期是期次标识，同一期重跑沿用原日期。

在 `video/` 中运行：

```powershell
npm run book -- demian 2026-11-06 script
npm run book -- demian 2026-11-06 audio
npm run book -- demian 2026-11-06 render
npm run book -- demian 2026-11-06 status
```

`script` 导出 `out/<期次>/script.md`。`audio` 复用本机 Kokoro，生成 48 kHz 双声道 PCM24 旁白、逐句时间轴和验收清单。可用 `REMOTION_KOKORO_PYTHON` 和 `REMOTION_KOKORO_MODEL` 指定现有环境及模型目录。Windows 上模型目录须能通过 ASCII 路径访问。`render` 检查稿件与音轨哈希、分场及字幕时序，生成 1920×1080、60 FPS 成片和独立封面，并完整解码。

制作下一本时，以 [《德米安》源稿](../video/effects/demian/script.json) 为结构样例，将脚本和分镜放在独立的 `effects/<book>/`。由目录名按连字符分段生成 PascalCase 的 `<Book>`，合成源码为 `<Book>Film.tsx`，注册 `<Book>-Bilibili` 和 `<Book>-Cover`。分镜读取本机 `public/<book>/timeline.json` 和 `narration.wav`。将这些生成文件及语音清单加入该目录的 Git 忽略规则。

取得本期的明确授权后，`submit` 提交已渲染作品，`release` 则从脚本一路运行到投稿。两者均要求 `--category` 和本期授权对应的 `--approval-ref`。程序提交后回查创作中心，已有投稿尝试的期次重跑只回查。 [账号与独立成片投稿](BILIBILI-PUBLISHING.md#独立成片与读书视频) · [《德米安》创作说明](DEMIAN-SCRIPT.md)

## 本地命令

```mermaid
flowchart LR
  A[锁定分镜与原始WAV] --> B[Studio与静帧验收]
  B --> C[Remotion画面渲染]
  C --> D[标准AAC MP4]
  A --> E[独立48kHz PCM24母带]
  C --> F[视频流复制封装]
  E --> F
  G[外部Atmos混音与JOC及QC] --> F
  F --> H[音轨规格与完整解码验收]
  B --> I[GitHub双系统CI与小片证据]
```

所有命令在 `video/` 中执行，参数错误会失败，未知作品与跨目录作品名会被拒绝。

```powershell
npm ci
npm run browser:ensure
npm run workflow -- doctor
npm run workflow -- list
npm run workflow -- check --edition all
npm run workflow -- preview --edition ai-weekly --platform douyin
```

`doctor`只诊断，不自动下载。`browser:ensure`是显式安装匹配浏览器的步骤。
`check`统一执行版本、ESLint/TypeScript、Node流程与媒体fixture、构建及三期内容检查；不生成整片。
`preview`运行Studio并给出目标合成URL，已有服务可直接打开URL。

```powershell
npm run workflow -- audio --edition ai-weekly --check
npm run workflow -- audio --edition ai-weekly
npm run workflow -- qa --edition ai-weekly --platform all --quick
npm run workflow -- qa --edition ai-weekly --platform all
npm run workflow -- render --edition ai-weekly --platform all --hardware if-possible --concurrency 4
```

`quick`每版3帧；完整QA逐条抽取两段正文并检查源音频。音频工具复用现有Python隔离环境，
也可将 `REMOTION_PYTHON` 设为已有运行时的绝对路径。不能把任意系统Python当作已经配置好TTS。
Daily Ten旧音频生成器没有只读 `--check`，统一入口会明确拒绝该组合，改用内容检查。
缺模型/缓存时按现有 [TTS说明](../video/scripts/ai-history-tts/README.md) 配置；CI不下载TTS模型。

```powershell
# 显式局部渲染，只验收这120帧，不冒称完整成片。
npm run workflow -- render --edition ai-weekly --platform all --frames 0-119 --hardware disable --concurrency 2
```

新标准导出统一进入 `out/workflow-renders/<edition>/standard/`。
局部导出位于 `out/workflow-renders/<edition>/partial-<range>/`。
旧 `render:ai-weekly` / `render:weekly-ten` 命令作为兼容入口调用同一渲染器，输出也进入新目录。
此前直接位于 `out/` 的成片保留。硬件参数只接受 `disable`、`if-possible`、`required`；CI采用软件编码。

通过全片验证后，可以用 `npm run workflow -- publish --edition ai-weekly --mode prepare` 生成本地待审核包。账号设置、人工批准和结果回查见 [B 站投稿工作流](BILIBILI-PUBLISHING.md)。

## PCM24无损分支

```powershell
npm run workflow -- master --edition ai-weekly --check
npm run workflow -- master --edition ai-weekly
npm run workflow -- package --edition ai-weekly --platform bilibili --profile hires-pcm --source out/ai-weekly-20261030-bilibili-1080p60.mp4
npm run workflow -- package --edition ai-weekly --platform douyin --profile hires-pcm --source out/ai-weekly-20261030-douyin-1080p60.mp4
```

母带从原始句缓存的浮点样本重建，保留原归一化增益、句间0.2秒、每场0.6秒起播、旁白音量0.88及音乐淡入淡出。
音乐按原确定性函数以48kHz重新合成，避免从MP3或旧PCM16配乐再加工。
输出 `out/<edition>-master/master-48k24.wav` 与完整清单，精确180秒，每声道8,640,000个采样帧。
`--check`仅通过计划检查，状态为 `plan_ready`、`masterVerified:false`，不写母带。
缓存缺失、源哈希变化或旁白越界均失败；不会隐式启动付费语音或重新下载模型。

当前旁白原生24kHz，成片48kHz/24bit属于交付格式转换，不增加原声频率信息。
清单明确标注 `resampled:true`、`nativeHiRes:false`、`layout:dual-mono`；不把复制为双声道称为空间混音。
要提高原生解析度，应先采用更高采样率的原始声源。

当前Remotion公开音频编码及内部混音不能直接保留完整24bit制作链路，因此母带独立于其音频输出制作。
封装源片必须有同名 `.audio-validation.json`（标准完整渲染自动生成），其中的作品名、视频SHA、
原稿和配音清单SHA须与当前期一致，避免把同规格的其他视频配上本期旁白。
母带清单的全部原始输入在封装前后重新核对，改过配音或原句样本就必须重建母带。
项目自带FFmpeg可编码PCM24并封装MOV；FLAC/ALAC需要另接具备相应能力的编码器。
PCM24视频保存在 `out/workflow-packages/<edition>/hires-pcm/`，标准MP4不会被覆盖。
封装后完整解码、核验48kHz/24bit/双声道，并比较10800个原视频包的SHA，确认画面未经重编码。
平台标记与投稿后转码识别须另行验证，文件参数通过不等于原生高解析录音认证。

## 外部Atmos分支

Atmos母版与编码需要合适的外部音频工具。本工程只接收真实外部E-AC-3 JOC成品及原始QC证据；
不通过复制声道、提高码率或普通E-AC-3编码假造Atmos。
不要将Atmos成品再放回 `<Audio>` 混音；后续只复制其压缩音轨封装。

```powershell
npm run workflow -- package --edition ai-weekly --platform bilibili --profile atmos --source out/ai-weekly-20261030-bilibili-1080p60.mp4 --audio out/external-atmos.eac3 --atmos-evidence out/external-atmos-qc.json
```

输入须为完整180秒，E-AC-3、6或8声道、码率至少320kbps，另须实际JOC/QC证据。
证据JSON契约如下，音轨索引指最终文件（本流程通常视频0、音频1）：

```json
{
  "schema": "remotion-atmos-qc/v1",
  "audioStreamIndex": 1,
  "audioTrackSha256": "actual-compressed-packet-stream-sha256",
  "qc": {
    "tool": "Dolby Stream Validator",
    "version": "actual-tool-version",
    "status": "passed",
    "originalReportFile": "original-dolby-qc-report.txt",
    "originalReportSha256": "actual-original-report-sha256"
  }
}
```

验收器逐包计算压缩音轨SHA，核对原报告文件和哈希，要求原报告明确JOC与验证通过，缺失或写明No JOC即失败。
该契约核对报告完整性和明确结论，不认证第三方报告出具者身份。真实Atmos正例需外部工具验收和设备回放，
当前只有拒绝假Atmos的fixture测试，不声称已制作或平台验收Atmos。

## GitHub联合调试

`.github/workflows/ci.yml` 保留main推送/PR触发，增加手动触发，矩阵为Windows与Ubuntu 24.04。
Node24/npm ci、匹配浏览器、统一check、AI两版各3帧真实1080p QA和4秒CPU H.264/AAC全解码在两系统运行。
轻量Python fixture使用固定numpy/soundfile，不依赖本地大模型或原始音频缓存。

CI只上传失败日志、小JSON、抽样PNG及4秒MP4，保留7天；不上传整片、bundle、PCM母带或TTS模型。
不配置自托管runner，不把本地GPU/语音缓存暴露给远程任务。
GitHub结果必须绑定具体head SHA；push成功、静帧成功、局部渲染成功都不能替代完整成片验收。
字体随系统不同可产生差异，CI不以Windows PNG哈希要求Linux排版逐像素一致。

本地命令执行记录：`out/workflow/<time-action-pid>/report.json` 和各阶段原始日志。
Node负向fixture会故意产生 `failed` 的拒绝报告；其是否符合预期由测试断言和统一check的退出状态确认，原始报告仍保留。
CI小片：`out/workflow-ci/smoke.mp4` / `report.json`。失败报告写 `failed`，避免遗留PASS被误用。
大文件和运行环境继续留在被忽略的 `out/`，必要验收摘要保存在 `examples/workflow/`。

Windows检出的JSON曾因CRLF导致旁白原稿哈希不一致。本轮恢复与备份SHA一致的原始LF字节，
并通过根 `.gitattributes` 固定JSON、源码和字幕为LF，继续保留严格字节哈希验证。

## 回退与维护

旧视频及音频缓存未清理。回退代码使用本轮分支前的远端基线，或在PR上回退本轮提交；
不要用递归删除整个 `out/` 代替回退。改新一期时先复制独立模块和资产目录，再添加registry条目及来源说明。
本轮备份：`video/out/workflow-preflight-20261031/pending-work.zip` 与逐文件SHA清单。
本地基线为 `b23ff70`，远端接入基线为 `28c2efa`；实际提交与CI结果见本轮联调记录。
