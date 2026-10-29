# 等待与偶遇：泊松过程

制作日期：2026-10-29。合成 ID：`PoissonEncounters`。
规格：1920×1080、60 fps、180 秒、10800 帧。用户明确要求制作完成后导出 MP4。

## 内容与结构

本片从街角书店的到来事件进入数学，把计数与等待连接起来，再回到人文历史和模型边界。
书店、人物与旁白均为原创情境，不是实际观测记录，也不把数学性质当作人的情感结论。

| 片段 | 时间 | 内容 |
| --- | --- | --- |
| 等待与偶遇 | 00:00–00:20 | 夜色书店与日常偶然 |
| 计数过程 | 00:20–00:40 | 到来时刻、阶梯过程 N(t)、速率 λ |
| 模型条件 | 00:40–01:00 | 独立增量、平稳增量、小区间条件、N(0)=0 |
| 泊松计数 | 01:00–01:20 | 泊松 PMF、平均每分钟两人、零次概率 |
| 指数等待 | 01:20–01:40 | 指数分布、生存函数、平均等待与长尾 |
| 无记忆性 | 01:40–02:00 | 已等且未到来条件下的剩余等待 |
| 概率与人的判断 | 02:00–02:20 | 1837 年著作与人文思考 |
| 模型边界 | 02:20–02:40 | 公交时刻表、散场聚集、变速与相关性 |
| 给偶然留一点空间 | 02:40–03:00 | 三个问题回顾与来源 |

配有九段本地合成中文旁白、36 条按句定时的内嵌字幕，以及没有外部样本的原创轻音乐。
片尾淡出从 179.2 秒开始，最后一句字幕在此前结束。

## 数学与历史依据

讨论对象是**齐次泊松过程**，不是所有可能的到来模型。

- [MIT 18.445 Lecture 20](https://ocw.mit.edu/courses/18-445-introduction-to-stochastic-processes-spring-2015/06c09371501eb1d7dd4c7c72c74cef5b_MIT18_445S15_lecture20.pdf)：
  计数过程、独立增量、区间计数的泊松分布、指数间隔、小区间刻画。
- [MIT 6.262 Chapter 2，§2.2](https://ocw.mit.edu/courses/6-262-discrete-stochastic-processes-spring-2011/3a19ce0e02d0008877351bfa24f3716a_MIT6_262S11_chap02.pdf)：
  到来过程、指数间隔、无记忆性；固定时刻表公交是非无记忆的反例。
- [法国国家图书馆 BnF 原始书目](https://catalogue.bnf.fr/ark:/12148/cb31129269s)：
  S.-D. Poisson，*Recherches sur la probabilité des jugements en matière criminelle
  et en matière civile*，Paris: Bachelier，1837。书封是依据题名的原创示意重绘，并非扫描件。

本片没有声称现代泊松过程在 1837 年已完整提出。人文旁白是原创表达，不冒充历史人物引语。

### 图解数值与语义

- N(t) 是累计计数；不相交区间内的增量独立，不能把 N(1) 和 N(2) 说成独立。
- λ=2 人/分钟，t=1 分钟时，计数分布平均值为 2；P(N(1)=0)=exp(−2)≈13.5335%。
  柱图只展示 k=0–7，明确提示更大次数仍可能发生。
- 相邻间隔独立同分布为 Exp(λ)；平均间隔 1/λ=30 秒，不保证每 30 秒准时到来。
- 生存曲线是 P(T>t)，不是密度。图中的阴影只标出 t>1 区间，13.5%读曲线纵轴，
  未把生存曲线下面积当作尾概率。
- 无记忆性对比的是 P(T>1.5 | T>1) 与 P(T>0.5)，两者都约为 36.8%；这是“再等超过
  30 秒仍未到来”的概率，不是“30 秒内到来”的概率。
- 小区间内两次及以上到来的概率为 o(h)，不是完全不可能。
- 时间轴用固定种子 731、逆分布法生成指数间隔；3 分钟示例中出现 9 次是一次模拟轨迹，
  不是数据造假，也不表示平均值必须等于 9。所有图解横轴区分模型时间与播放时间。
- 变速时需要放松齐次假设；明显相关或成群到来时还需重新检查独立性等条件。

## 工程与复现

源代码在 `video/src/poisson-process/`，各分镜可在 `PoissonScenes` 文件夹单独打开。
`storyboard.json` 是旁白的唯一文案源。脚本逐句合成 PCM，用实测采样长度生成字幕时码，
不靠按字数比例猜时长。旁白 MP3、字幕清单和音乐清单在 `video/public/poisson-process/`。

在 `video/` 运行：

```powershell
npm run lint
npm run check:versions
npm run build
npm run verify:poisson
npm run render:poisson
node scripts/verify-export.mjs out/poisson-process-1080p60.mp4 180 60
```

本地导出文件为 `video/out/poisson-process-1080p60.mp4`。`out/` 由 Git 忽略；
源代码、旁白、原创音乐、封面和验证报告随仓库同步。

如需重新生成音频，在已安装 Huihui 中文声线的 Windows 环境运行：

```powershell
powershell -NoProfile -File scripts/generate-poisson-voiceover.ps1
powershell -NoProfile -File scripts/generate-poisson-music.ps1
```

旁白限制语速 ≤3、单段 ≤18.4 秒，句间停顿约 0.22 秒。语音从每场 0.7 秒开始；
音乐 RMS 至少比最轻的旁白低 25.29 dB，入片时还做首尾淡入淡出。生成过程完全本地，
没有调用外部语音服务或使用外部音乐样本。

实际验证与问题修复见 [工程日志](VIDEO-ENGINEERING-LOG.md)。

## 已完成导出

MP4 已生成并通过完整解码：视频 180 秒、1920×1080、60 fps、10800 帧，
H.264 视频与 AAC 双声道音频。文件大小 15,115,326 字节。
[实际导出验证报告](../examples/poisson-process/export-validation.json)保留编码、像素格式、
音频时长、文件哈希和检查时间；[成片音量记录](../examples/poisson-process/export-audio-levels.json)
来自最终 AAC 音轨，而非源 MP3。
