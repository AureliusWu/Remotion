# 从提问到共创：人工智能发展历程

目标：30 分钟、1920×1080、60 fps、H.264/AAC MP4。事实资料检索截至 2026-10-29。
本片按问题、技术路线与使用边界叙述历史，不把一个比赛成绩等同于所有智能，也不按产品新品罗列排行榜。

## 内容与视觉

15 章，每章 2 分钟；每章 4 个独立镜头，镜头按真实语音长度分配时间并保留阅读停顿。
正文 7033 字符、约 6312 汉字，引用 61 条资料；完整稿件和原始资料索引在
[AI-HISTORY-SCRIPT.md](AI-HISTORY-SCRIPT.md)。

| 起点 | 章节 |
| --- | --- |
| 00:00 | 机器会思考吗 |
| 02:00 | 计算与推理的形式化 |
| 04:00 | 达特茅斯与领域的命名 |
| 06:00 | 感知机与符号推理 |
| 08:00 | ELIZA 与 Shakey |
| 10:00 | 承诺、评估与低潮 |
| 12:00 | 专家系统与维护成本 |
| 14:00 | 反向传播与表示学习 |
| 16:00 | 统计学习、概率与泛化 |
| 18:00 | 深蓝与图像识别的转折 |
| 20:00 | AlphaGo 与 Transformer |
| 22:00 | 预训练、规模化与对话 |
| 24:00 | 生成图像与跨模态表示 |
| 26:00 | 现实应用、评估与代价 |
| 28:00 | 人的选择与开放的未来 |

视觉使用原创代码图形和纸色/深蓝两套一致的色板。专门区分：深蓝的国际象棋与 AlphaGo 的围棋；
单层线性模型不能解决的 XOR；GAN 的对抗训练与扩散模型的去噪采样；BERT 的遮盖预测与 GPT 的
续写目标；CLIP 的图文表示与直接生成图像。示意数据、重绘和非实录对话均在图中说明。
AlexNet 图表使用原论文 ILSVRC 2012 前五测试错误率 15.3% / 26.2%，同轴从零起，说明评测口径。

## 免费语音的本轮迭代

主方案是 **Kokoro-82M v1.1-zh + sherpa-onnx 2.0.1**，中文女声 `zf_001`，`sid=3`。
模型和运行库均为 Apache-2.0，下载来源、资产哈希与许可依据保存在
`video/scripts/ai-history-tts/README.md` 和最终旁白清单中。
这里的免费指不需要付费语音 API；合成使用本机计算资源，模型下载后可离线运行。

- 独立 Python 虚拟环境位于 `video/out/ai-history-tts/venv`；没有改动已有 Python、Node 或 Remotion 依赖。
- 模型、词典、缓存位于被 Git 忽略的 `out/`；MP3、逐句字幕清单和 SRT 作为必要源资产保留。
- 先对照已有 Huihui 做同文案样音，再测 Kokoro 女/男声。女声 132 个非空白字符的样本约 27.56 秒；
  实时因子只反映合成耗时，不能作为自然度的主观评分。
- 原生语速 1.0，句间约 0.2 秒；按每句 PCM 采样长度生成字幕。语音归一到约 −23 dBFS RMS，
  同时受 −1 dBFS 峰值上限约束，不截句、不通过大幅加速塞进时长。
- 同文案测试 2 / 4 / 6 线程后，采用两个进程、每进程两线程。保留句子与镜头两级哈希缓存，
  中断后仅补缺失或变化的内容。

### 已定位与修复的发音问题

| 问题 | 原因 | 处理 |
| --- | --- | --- |
| 年份里的“〇”被跳过 | 当前中文词典缺少该字符 | 仅发音输入改为“零”，字幕原文保留；重做受影响句子 |
| 某些 AI 英文专名被跳过 | 未知整词不会自动逐字母读出 | 专名词表明确展开，例如 `ImageNet → Image Net`、`GPT → G P T`，逐个核对词典覆盖 |
| 书名号产生词典提示 | 标点不属于发音词条 | 发音输入移除书名号，字幕保留 |
| 旧示例参数不匹配当前运行库 | Kokoro `data_dir` / `dict_dir` 接口已弃用 | 按实际 2.0.1 API 配置词典与数字/日期 FST |
| 精简 FFmpeg 不支持裸 float32 输出格式 | 随工程二进制只包含部分 muxer | 解码到受支持的 WAV/PCM 后计算电平，不额外安装二进制 |

规范化只改变供发音使用的文本，保留稿件与字幕；映射文件、规范化版本、模型哈希进入缓存/清单。
启动时检查全稿英文 token 是否存在，发现未知词就失败，避免静默漏读。

## 长片生产与复用

工程位于 `video/effects/ai-history/`，共享 `video/` 根依赖。独立镜头和章节均有明确 JSX 注册，
可在 Studio 单独编辑；没有把长片做成无法逐段修改的单一时间轴。

1. `prepare-ai-history.mjs merge` 将前后两部分合为唯一 `storyboard.json` 并生成可审阅稿件。
2. `generate.py` 按句合成旁白，原子更新 manifest。完整镜头通过解码和哈希检查后才发布。
3. `prepare-ai-history.mjs progress` 只把四段旁白全部齐备的章节标为 ready；全片未齐备时仍为 partial。
4. `render-ai-history.mjs --chapters=...` 可提前渲染 ready 章节。草稿始终拒绝；全片封装必须 final。
5. 纯画面分章编码，缓存指纹覆盖本章数据、公共图形/字幕代码、对应源文件和渲染参数。其他章完成
   不使已完成章失效；不完整文件不能命中缓存。
6. 全部旁白齐备后，以 48 kHz 的每帧 800 个样本精确构建 1800 秒旁白 WAV；纯视频 copy-concat，
   再一次性混入旁白和原创轻音乐并编码 AAC，避免分章 AAC 补齐累积。

软件编码测试曾出现编码持续落后于画面生成。先验证现有 GTX 1070 Ti 的 NVENC 可用，再使用
H.264 NVENC 4 Mbps；没有安装驱动。硬件编码不接受 CRF，配置中明确移除 CRF，缓存版本一起更新。
并行工作的其他本地渲染会影响实际耗时，记录真实进度，不用理论速度承诺完成时间。

本次额度中断后，旧生产进程实际已退出，日志停在第十三章中途。恢复时先核对进程和日志更新时间，
再启动同一生产命令；第 01–12 章通过校验直接复用，仅未完成的第十三章重新生成。
不能仅凭日志中最后一条进度就认定任务仍在运行；文件存在也不代表完整章节已经成功。

音乐 **Questions Across Time** 由确定性正弦波/电钢琴音符合成，无外部采样；约 −45.45 dBFS RMS，
低于旁白约 22 dB；全片淡入淡出。生成器为 `scripts/build-ai-history-audio.mjs --music-only`。

## 复现命令

在 `H:\CodexAI\Remotion\video` 执行：

```powershell
npm run check:environment
node scripts/prepare-ai-history.mjs merge
./out/ai-history-tts/venv/Scripts/python.exe scripts/ai-history-tts/generate.py effects/ai-history/storyboard.json --workers 2 --threads 2 --speaker 3 --speed 1.0 --gap 0.2
npm run prepare:ai-history
npm run music:ai-history
npm run audio:ai-history
npm run render:ai-history
npm run verify:ai-history-content
npm run verify:ai-history
npm run verify:ai-history-export
npm run verify:ai-history-audio
```

语音生成和渲染需要在当前聊天持续工作时并行推进，可另开本地终端运行 `npm run produce:ai-history`。
该命令使用已启动的语音清单；不自行注册服务，不购买 API，不创建系统定时任务。

补充核验了 2024 年 AlphaFold 3 的生物分子相互作用结构预测论文，以及 2025 年 DeepSeek-R1 的
强化学习与推理研究。区分 R1-Zero 的纯强化学习后训练探索和正式模型的多阶段流程。
晚期修订仅重合成两场，其余 58 场直接哈希复用；源 MP3 容器时长合计 1530.618779 秒
（约 25 分 31 秒），解码后的片段采样长度合计 1528.323188 秒，差异来自编码填充。
240 条逐句字幕与原文一致；字幕按句对齐，并非逐字强制对齐。剩余时长用于起播、图解阅读与章节衔接。

旁白母带缓存同时核对 60 个输入 MP3、构建脚本、WAV 长度和文件哈希。增加缓存检查时曾将
全片状态检查误放进 PCM 解析函数，触发 `film is not defined`；已移回入口作用域，随后完整
合成 60 段通过，第二次运行也实际复用了已验证母带。局部工具函数不应依赖入口的隐含状态。

本地输出：`video/out/ai-history-1080p60.mp4`。
最终交付规格、完整解码、实际 AAC 电平、静帧和 Studio 记录以 `examples/ai-history/` 的报告为准。


## 最终验收（2026-10-30）

成片为 287480245 字节（约 287.5 MB），1920×1080、60 fps、108000 帧、1800 秒，H.264 / yuvj420p / pc，AAC 48 kHz 双声道。整片音视频完整解码通过，60 个成片旁白窗口全部通过，RMS -26.4651 至 -26.4350 dBFS、最大峰值 -8.5130 dBFS、削波样本 0。这些是最终 AAC 降混单声道测量值，不是 LUFS。

实际 MP4 的首、中、第十四章及结尾画面已抽查。16 个合成静帧、Studio 播放抽查、ESLint/TypeScript、版本和构建均通过。完整报告与检查范围保存在 `examples/ai-history/`，没有把抽样检查描述为逐帧人工观看。

SHA-256：`3575dca68ae643daa88c24722ad6765bd3e5ff63cda8f73bf0b949f74e8b7395`。独立字幕另存为 `video/out/ai-history-1080p60.zh.srt`；画面也已烧入中文字幕。
