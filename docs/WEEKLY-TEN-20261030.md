# 这一周，世界留下什么

本期为2026年10月26日至30日**截至目前**的十则新闻精选。本周尚未结束，不覆盖尚未发生的周末，
也不表示平台热搜排名。资料检索日期为2026年10月30日。

两版均为180秒、60fps、10800帧：B站1920×1080横版，抖音1080×1920竖版。
10秒开场、十则各16秒、10秒收束；两版使用同一份正文、旁白与按句字幕。
所有主题图形为原创示意，游泳图不是比赛实录，火星尘粒图不表示精确粒径或人体试验。

## 本周内容与来源

| 起点 | 选题 | 发布/事件日期与统计口径 | 原始资料 |
| --- | --- | --- | --- |
| 00:10 | 出游热度与花费变化 | 10/26发布；前三季度抽样调查，53.07亿为累计人次，非本周人数 | [文旅部](https://zwgk.mct.gov.cn/zfxxgkml/tjxx/202610/t20261026_967476.html) |
| 00:26 | 双十一消费提示 | 10/26联合提示；六类提醒，不虚构折扣或投诉数 | [中新网刊载](https://www.chinanews.com/cj/2026/10-26/10721097.shtml)、[上海市政府转载](https://www.shanghai.gov.cn/nw17239/20261027/35adab5c3eb24bd59db95bd71ffa7b17.html) |
| 00:42 | 李冰洁短池亚洲纪录 | 比赛10/26，人民日报10/27刊发；15:34.09，25米短池1500米自由泳 | [人民日报](https://paper.people.com.cn/rmrb/pc/content/202610/27/content_30187847.html) |
| 00:58 | 火星超细尘埃研究 | NASA10/26介绍；1645个火星日；部分样本细粒约100—300纳米 | [NASA/JPL](https://www.jpl.nasa.gov/news/nasas-perseverance-offers-clues-to-protect-crews-from-mars-dust/) |
| 01:14 | 世界音像遗产日 | 活动10/27；2026主题Your Window to the World，背景页与当日活动分开 | [UNESCO](https://www.unesco.org/en/days/audiovisual-heritage)、[南澳州立图书馆10/27](https://www.slsa.sa.gov.au/news/story/2026/10/every-audiovisual-recording-a-window-your-window-to-world) |
| 01:30 | 美联储维持利率 | 美国东部10/28，北京10/29；3.75%—4.00%，10票赞成/2票反对 | [美联储官方声明](https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm) |
| 01:46 | 联大古巴禁运决议 | 10/28投票、10/29报道；130/17/25；投票通过不等于禁运解除 | [公视](https://news.pts.org.tw/article/833527)、[联合国](https://www.un.org/es/la-onu-vuelve-rechazar-el-embargo-de-estados-unidos-cuba) |
| 02:02 | 酿酒人队史首冠 | 美国10/28比赛、10/29报道；单场与系列赛均4:1，1957年冠军属于勇士队 | [AP](https://apnews.com/article/971f9fb8cad75042fc7f9919dd91c159)、[AP转载](https://edmonton.citynews.ca/2026/10/29/milwaukee-is-closing-schools-for-the-brewers-long-awaited-world-series-title-parade-friday/)、[MLB](https://www.mlb.com/brewers/news/brewers-beat-rays-game-5-win-2026-world-series) |
| 02:18 | 智元交付数据 | 10/29公司披露；上半年出货9700台/营收近20亿元，截至9月累计下线2万台 | [财新现场报道](https://companies.caixin.com/2026-10-29/102498623.html) |
| 02:34 | U17女足首次八强 | 摩洛哥10/29、北京10/30；点球4:3、常规0:0，首次限本年龄组队史 | [新华社/人民网](https://ent.people.com.cn/n1/2026/1030/c1012-40824538.html) |

本期新增了周一、周二的五个主题，按周内进展重新编排，没有将日报仅替换标题。
候选快递累计1513亿件虽然10/27再刊发，首次发布在10/19，未当作本周新发布选入。
完整文案位于 `video/effects/weekly-ten/storyboard.json`；原日报及其音频保留。

## 视觉、语音与工程

周报片头采用26—30日五日日历折页；新增行旅、购物、泳池、音像档案、火星尘埃五组原创SVG。
正文继续使用宋体标题、微软雅黑正文、Bahnschrift数字。横版分栏，竖版重排，给右侧与底部操作UI留设计余量。
该余量是本次设计选择，未冒称平台固定安全区；跨平台字体可产生差异。

旁白使用现有隔离环境的本地Kokoro中文女声，speaker3、speed1.03、句间0.2秒、场景0.6秒起播。
12段共140.6171秒、24条按句字幕；没有截断语句或额外提高速度塞时长。
生成前后89项既有资产/关键脚本哈希保持一致。独立适配器避免旧脚本硬编码输出目录覆盖日报清单。
原创配乐复用A Window on Today，本地合成音符，无外部采样。字幕另存 `public/weekly-ten/captions.zh.srt`。

`EditionContext` 将每期数据、音频目录、日期和插画绑定在一起，避免下期制作覆盖上一期。
默认仍为原日报；本次另注册 `WeeklyTen-Bilibili` / `WeeklyTen-Douyin`，横竖独立场景可在Studio编辑。

当前主机实际为Ryzen5 3600、GTX1660 SUPER。2秒H.264硬件编码样片已成功，再按固定bundle顺序导出两平台。
编码配置为H.264 NVENC、目标10Mbps、AAC192kbps/48kHz、并发4；实际像素格式和音频时长以MP4验收报告为准。
版本、ESLint/TypeScript、build、两版各23帧与12段源音频检查已通过；最终MP4状态另见导出验收记录。

## 复现与交付路径

```powershell
cd D:\AI项目\Remotion\video
./out/ai-history-tts/venv/Scripts/python.exe scripts/generate-weekly-ten-audio.py --check
./out/ai-history-tts/venv/Scripts/python.exe scripts/generate-weekly-ten-audio.py
npm run verify:weekly-ten-content
npm run verify:weekly-ten-bilibili
npm run verify:weekly-ten-douyin
npm run render:weekly-ten
```

导出脚本先拒绝草稿/超场/错配字幕/失效音频哈希，再对固定bundle生成两版，随后检查真实流规格、全文件解码和12个实际混音旁白窗口。
报告中的RMS/peak是实际AAC降混单声道PCM测量，不是LUFS、true peak或自然度评分。
静帧、客观音频和完整解码不能冒称逐帧人工观看或整片人工听审。

- B站：`video/out/weekly-ten-20261030-bilibili-1080p60.mp4`
- 抖音：`video/out/weekly-ten-20261030-douyin-1080p60.mp4`
- 每个MP4旁的 `.validation.json` / `.audio-validation.json` 保存验收数据和SHA-256。
- 批量QA与PCM保存在 `video/out/`，必要封面/报告保留在 `examples/weekly-ten/`。

## 投稿文案草稿

B站标题：`这一周，世界留下什么｜10.26—10.30新闻周记·十件事，三分钟`

抖音标题：`回看本周十件事｜10.26—10.30，截至目前`

简介：从出游数据、消费提醒，到泳池纪录、太空研究与国际消息，三分钟回看本周十件事。
本期范围为10月26日至30日截至目前，周内新闻精选，非热搜排行。图形和配乐原创，旁白为本地合成语音；
数据时间与事件日期已分别标注，资料出处见本说明。后续消息以原始来源更新为准。

以上为本地草稿，未上传或发布到任何平台。

## 最终导出验收

两版MP4已完成并通过验收，未上传平台：

| 版本 | 实际画布/时长 | 大小 | SHA-256 |
| --- | --- | --- | --- |
| B站 | 1920×1080，60fps，10800帧，180秒 | 125955655字节，约125.96MB | `10fed5d57eb83be9b0791a389060d97ac60cc76626785e3a546e67a24cd6a07a` |
| 抖音 | 1080×1920，60fps，10800帧，180秒 | 89200428字节，约89.20MB | `885fa12a14cd265d57986508a8d69c42f990edc71f3af48a147849c72223b7c8` |

两版均为H.264、实际yuvj420p/pc，AAC48kHz双声道；音轨180.011秒为编码补齐，在0.1秒验收容差内。
全片音视频完整解码通过。两版的12个实际旁白窗口均通过，RMS -24.5480至-24.4935dBFS、
最大样本峰值-8.3410dBFS、满幅削波样本0；这是AAC降混单声道测量，非LUFS或true peak。

实际MP4抽帧：横版3.5/69/179秒、竖版14/79/179秒，目视核对片头或正文、长句与结尾，无主要裁切或异常空画。
两版Studio在1倍速、未静音、循环状态下实际跨过片尾，错误查询null，控制台warn/error为空。
这些证据不等同于逐帧人工观看、完整人工听审或平台上传后的转码验收。

独立字幕为 `video/out/weekly-ten-20261030.zh.srt`，投稿元数据草稿为 `video/out/weekly-ten-20261030-metadata.json`。
必要来源、封面与验收报告已随工程保存；MP4、PCM和批量QA继续留在被忽略的out目录。
