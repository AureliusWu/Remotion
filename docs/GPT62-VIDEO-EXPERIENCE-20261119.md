# GPT-6.2 Sol 三项实测视频制作经验

2026 年 11 月 19 日，将三个独立任务的实际返回结果编成视频。先记录任务、运行入口和验收口径，再写口播与分镜，按实测旁白安排时间轴。每题只有一次样本，制作结论限定在本次结果。

## 样本与运行入口

三项任务各使用一个独立 Codex 子会话，均显式选择 `gpt-6.2-sol`，`fork_turns` 设为 `none`。每个子会话只接收自己的题目。SVG 和提取题要求直接交答案，代码题允许把修复写到指定文件。样本记录保留模型名、入口、题目和产物，推理参数以实际调用证据为准。

本机 Codex CLI 使用当时账号和 `low` 配置请求该型号，返回 `model_not_found`。视频中的三个产物来自上述子会话。命令行的可用性需要按当前账号、入口和时间核查，单个入口的错误不能替代其他入口的实际结果。模型身份与产品说明可对照官方资料。 [OpenAI 发布说明](https://openai.com/index/introducing-gpt-6-2-astra-sol/) · [模型页](https://developers.openai.com/api/docs/models/gpt-6.2-sol)

## SVG 任务

Simon Willison 的原题如下。 [原题来源](https://simonwillison.net/2024/Oct/25/pelicans-on-a-bicycle/)

```text
Generate an SVG of a pelican riding a bicycle
```

本次子会话实际增加了交付格式和素材约束，完整提示如下。本机提示词草稿文件仅保存原题，复现实验应保存真正发出的全文。

```text
Generate an SVG of a pelican riding a bicycle. Return only standalone static SVG markup in your final answer, no fences. No tools and no external assets.
```

原始 SVG 收到后先固定字节，再检查能否渲染、主体是否可辨认、两轮与车架如何连接，以及翼尖、车把、脚与踏板的相对位置。视频沿用原图，放大和圈注属于后期图层。镜头放大时保留参照位置，避免把后期标记误读成模型生成内容。

本次图中能辨认长喙、车架和两轮，翼尖伸到车把附近，一只可见的脚落在踏板附近。另一只脚从该视角难以辨认，因此镜头保留局部细节，口播按可观察部分描述。

## 六条记录的结构化提取

本次输入要求保留状态的精确匹配、未知金额、零和负数，并只输出四个指定字段。

```text
Test of instruction following and structured extraction. No tools. Return only JSON with exact keys confirmed, total, unknown, excluded. confirmed is an array of IDs in input order for all rows whose status exactly equals confirmed, even if amount is unknown. total is sum of integer known amounts of those rows, preserving zero and negative amounts. unknown is the array of confirmed IDs with null amount. excluded is the array of all other IDs. Do not infer or convert status or amount.
```

```json
[
  { "id": "A", "status": "confirmed", "amount": 120 },
  { "id": "B", "status": "tentative", "amount": 500 },
  { "id": "C", "status": "confirmed", "amount": null },
  { "id": "D", "status": "confirmed", "amount": 0 },
  { "id": "E", "status": "confirmed", "amount": -20 },
  { "id": "F", "status": "canceled", "amount": 700 }
]
```

模型返回如下，Node 断言逐字段深比较通过。确认编号保留输入顺序，C 同时进入确认与未知编号，已知金额合计为 `120 + 0 - 20 = 100`。

```json
{
  "confirmed": ["A", "C", "D", "E"],
  "total": 100,
  "unknown": ["C"],
  "excluded": ["B", "F"]
}
```

动画按确认、排除、未知三步展开，金额与编号分别验收。给 JSON 加高亮时从模型返回文件取值，再与预先算好的结果比较，避免展示层重新计算后替换原答案。

## 排序函数的修复与验收

原函数直接对输入数组调用 `sort`，按分数降序取前三项标签。验收约定同时要求过滤无效记录与非有限分数、同分保留输入顺序，以及输入数组顺序和记录内容保持原值。

原函数如下。

```javascript
const original = (records) =>
  records
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((record) => record.label);
```

模型实际返回的修复如下。

```javascript
export function topThree(records) {
  return records
    .filter(
      (record) =>
        record !== null &&
        typeof record === "object" &&
        typeof record.label === "string" &&
        Number.isFinite(record.score),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((record) => record.label);
}
```

同一个 Node 验收器分别调用原函数和修复函数。每例先复制记录并冻结记录对象，调用后深比较返回名单，再深比较数组和调用前保存的原序。两个检查共同通过才计入该例。

| 用例         | 核对内容                                 | 原函数 | 修复函数 |
| ------------ | ---------------------------------------- | ------ | -------- |
| 降序取前三   | 名单为 `b,d,c`，且输入原序保留           | 失败   | 通过     |
| 同分保序     | 四条同分记录返回 `A,B,C`                 | 通过   | 通过     |
| 剔除非有限值 | 排除 `NaN`、正负无穷，保留零分           | 失败   | 通过     |
| 剔除无效记录 | 排除空值、数字、字符串分数及非字符串标签 | 失败   | 通过     |
| 不足三项     | 单条有效记录原样返回                     | 通过   | 通过     |
| 空数组       | 返回空名单                               | 通过   | 通过     |

本次原函数通过 3/6，模型交来的修复通过 6/6。普通排序的返回名单原本正确，但修改了原数组，所以该例未通过。片中说明这个计分原因，避免把通过率变化全部归为排序结果的改善。

以下两例可和上面的修复函数放在同一 `.mjs` 文件中执行，分别检查普通排序的输入顺序与非有限值过滤。

```javascript
import assert from "node:assert/strict";

const records = [
  { label: "a", score: 1 },
  { label: "b", score: 4 },
  { label: "c", score: 2 },
  { label: "d", score: 3 },
];
const originalOrder = records.map((record) => ({ ...record }));
assert.deepEqual(topThree(records), ["b", "d", "c"]);
assert.deepEqual(records, originalOrder);

const nonFinite = [
  { label: "x", score: NaN },
  { label: "y", score: Infinity },
  { label: "z", score: -Infinity },
  { label: "ok", score: 0 },
];
assert.deepEqual(topThree(nonFinite), ["ok"]);
```

本次随题目提出验收要求，收到函数后独立编写并执行六个用例。后续复用时，可先固定完整输入与计分方法，收到答案后用同一套用例运行修复前后函数。样本的完整推理参数没有固定，不能据此比较不同推理设置。

## 从证据编排视频

1. 冻结实际输出。将题目、原图、JSON、修复函数和独立验收结果保存在本机，给最终口播源稿计算 SHA-256。该次定稿哈希为 `9d6ff74961baef80ecf41728403409a3cdf9ccc2448ab28b5251a750280419cb`。
2. 写六场口播。先提骑行动作的问题，再交代样本入口，依次展示原 SVG、逐字段提取和修复用例，最后回到如何为真实任务规定验收方法。
3. 用实测旁白排时间轴。文案标签、来源和口播一起冻结。根据句级采样计算字幕窗和场景边界，按 48 kHz 与 60 FPS 对齐到每帧 800 个采样帧，并核对脚本、整轨与时间轴哈希。
4. 用动画解释验收。SVG 采用原图加后期标记，JSON 展示输入到四字段的对应关系，代码页同时展示名单与输入完整性。字幕和旁白读取同一份定稿。
5. 分层验收。先检查 Studio、静帧和字幕，再对实际 MP4 核对画面、音频与完整解码。平台结果按原投稿回执回查，同一期重跑沿用原期次。

现有封装指纹绑定脚本、整轨音频、时间轴和合成源码。额外静态素材需要独立核对冻结哈希。本次鹈鹕原图的 SHA-256 为 `a7f0ed8472d4e856a1cc2e30f0c59437fe45fd94881ea928c8f857c9e9a6356a`，在实际引入前复核与保存的原始 SVG 一致。

本片定稿共 6 场、31 句，实测旁白安排为 9,653 帧，1920×1080、60 FPS 下长 160.8833 秒。合成规格、十个静帧与封面已核对。源音轨为 48 kHz 双声道 PCM24，独立实测 −16.04 LUFS、−2.00 dBTP，完整解码通过。制作工作树的 Lint、构建和 119 项工作流测试通过。

完整成片导出为 1920×1080、60 FPS、9,653 帧的 H.264 MP4，音轨为 48 kHz 双声道 AAC，平均约 317 kbps。整片完整解码通过，解码后独立实测 −16.04 LUFS、−1.98 dBTP，响度范围为 1.70 LU。从实际 MP4 抽查覆盖六场的十帧和最后一帧，并核对正式封面与预览的哈希一致。成片为 14,560,492 字节，SHA-256 为 `749064b80f1509f5c7a8bbdb0cbdd0a3418a0c3f9a420df9e1f3c1c11cfcd83c`。

实际投稿由原回执确认，创作中心核对了 AI 合成声明，投稿记录中只有一次上传。首次回查为审核中，后续沿同一稿件执行只读回查。

北京时间 13:06 的最终回查确认稿件审核通过、AI 合成声明已保存、公开设置有效。匿名请求读到同一公开分 P 的媒体字节，Range 取流返回 206。 [公开作品](https://www.bilibili.com/video/BV1cNs86UEZQ/)

这次沿用既有读书视频工作流的逐句口播、时间轴和投稿绑定机制。可复用入口如下，运行目录为仓库的 `video/`。脚本、合成源码、本地语音环境和生成资产准备好后，再选择对应阶段。 [读书视频工作流](WORKFLOW.md#读书视频)

```powershell
npm run book -- gpt-sol-review 2026-11-19 script
npm run book -- gpt-sol-review 2026-11-19 audio
npm run book -- gpt-sol-review 2026-11-19 render
npm run book -- gpt-sol-review 2026-11-19 status
```

本期已获投稿授权时，可以运行 `submit` 并传入 `--category` 和 `--approval-ref`。分区取自当前平台核验，授权引用对应本期的实际用户指令。投稿命令会把账号、期次、元数据与成片哈希绑定，先保留提交回执，再查询同一稿件。 [独立成片投稿与授权](BILIBILI-PUBLISHING.md#独立成片与读书视频)

创作中心回查通过后，继续用无登录凭据的请求核对公开页面身份与分 P，再取得对应媒体资源。只有公开身份匹配、HTTP Range 请求返回 206 且读到媒体字节，才记录匿名取流可用。浏览器连续实播需另有实际观察。CLI 状态和独立公开回查分别保存，按实际证据描述已完成的层次。

本记录收录实验输入、验收方法和制作经验。原始样本、素材、成片、平台回执及账号配置由本机生产工作树保存，仓库中的命令供具备相应合成和本地资产的环境复用。
