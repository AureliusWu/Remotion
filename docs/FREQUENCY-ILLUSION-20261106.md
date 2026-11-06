# 再看一眼 · 频率错觉

制作与资料检索日期为 2026 年 11 月 6 日。Remotion 合成为 `FrequencyIllusion-Bilibili`，规格为 1920×1080、60 FPS、10,800 帧。

| 时间 | 段落 | 画面与内容 |
| --- | --- | --- |
| 00:00–00:45 | 起 | 雨天街角遇见第三把红伞，重看同一条街，为那份意外找到一个名字。 |
| 00:45–01:45 | 承 | 选择性注意、数传球实验、确认偏误和 Wason 的数字规则实验。 |
| 01:45–02:45 | 转 | 推荐流和现实都可能真的改变。对照红伞的数量与比例，设计一次可比较的街角记录。 |
| 02:45–03:00 | 合 | 回到路口，看见有人把伞往同伴那边挪了挪。第一眼遗漏的不只是事物，还有人。 |

## 资料与边界

- Arnold Zwicky 在 2005 年 8 月 7 日用频率错觉解释语言观察中出现的错判，之后回顾了选择性注意和确认偏误与该现象的关系。 [原始博文](https://languagelog.ldc.upenn.edu/myl/languagelog/archives/002386.html) · [作者回顾](https://arnoldzwicky.org/2018/04/22/the-shadow-knows/)
- Simons 与 Chabris 1999 年的动态视觉实验研究注意分配如何影响意外目标的察觉。影片借它说明注意的局限。 [实验原论文](https://www.chabris.com/Simons1999.pdf)
- Wason 1960 年的任务从 2、4、6 开始，考察参与者是否会用可能推翻自身猜测的例子检验规则。片中其余两组数是示意。 [实验原论文](https://journals.sagepub.com/doi/10.1080/17470216008416717)
- 个性化推荐可能改变个人看到的内容。个人信息流和全站总体的频率需要分别举证。街景、百分比和观察设计为原创示意。 [TikTok 官方推荐机制说明](https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content)

## 制作素材

- 12 场故事板与逐帧画面使用独立合成。 [故事板](../video/effects/frequency-illusion/storyboard.json)
- 本地 Kokoro 生成的 24 kHz 单声道 PCM16 旁白作为渲染源资产保留。字幕按实际音频逐句定时，重做末段时复用了前 44 句缓存。配乐复用项目内的原创《Quiet Pages》。 [旁白](../video/public/frequency-illusion/narration.wav) · [字幕时间轴](../video/public/frequency-illusion/timing.json)
- 封面由 GPT 内置生图工具生成，使用题字、雨夜路口、放大镜与红伞。保留原始 PNG，投稿版缩放至 1920×1080。 [封面源图](../examples/frequency-illusion/cover-gpt.png)
- 全长 MP4、投稿包和回查原始数据保存在本机。 [工程记录](VIDEO-ENGINEERING-LOG.md#2026-11-06--频率错觉)

## 本地复现

在 `video/` 安装依赖后，启动 Studio 并打开 `FrequencyIllusion-Bilibili`。渲染用仓库内的旁白和配乐。

```powershell
npm run dev -- --no-open
node scripts/verify-composition.mjs FrequencyIllusion-Bilibili --seconds=180 --fps=60 --frames=420,8520,10320
npx --no-install remotion render FrequencyIllusion-Bilibili out/frequency-illusion-1080p60.mp4 --codec=h264 --crf=19 --x264-preset=veryfast --pixel-format=yuv420p --image-format=jpeg --jpeg-quality=88 --audio-codec=aac --audio-bitrate=192k --sample-rate=48000 --concurrency=6
node scripts/verify-export.mjs out/frequency-illusion-1080p60.mp4 180 60 1920 1080
```

Studio 命令会保持运行，后续命令可在另一个终端执行。CI 在 Windows 和 Ubuntu 上分别验证合成规格和三帧，本地导出命令会生成整片。

<details>
<summary>GPT 封面生成提示词</summary>

Create a production-ready wide 16:9 Bilibili thumbnail for a Chinese popular-science short film about frequency illusion, framed for mobile legibility. Quiet, polished illustrated science magazine cover, almost black ink navy background, cool cyan ink, and one strong vermilion accent, with restrained risograph grain. Right half: a large handheld magnifying glass over a small red umbrella in a rainy city crosswalk. Several other tiny identical red umbrellas that you notice only on the second glance sit deeper in the street, mostly toward the right, with subtle silhouetted pedestrians, interesting but uncluttered. Left half: a nearly plain dark area and strong oversized bold clean cream Chinese title, literally and exactly '频率错觉' in one line, simple bold Chinese type, no decoration behind title. Only this text, no other letters or numbers, no logos, no watermark. Keep all four title characters and main magnifier well inside the center-safe area, minimum 10 percent margin to the sides and 12 percent to the top and bottom. Strong silhouette and foreground/background separation, calm editorial illustration, no collage, no artificial sci-fi effects.

</details>
