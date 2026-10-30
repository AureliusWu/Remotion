# AI 历史片的本地中文语音

核验日期：2026-10-29。此工具链隔离在 `video/out/ai-history-tts/venv/`，不修改
Node、Remotion、主工程依赖或现有 Python。公开模型与安装缓存也留在被 Git 忽略的
`video/out/ai-history-tts/`，合成资产输出到 `video/public/ai-history/`。

## 选型依据

| 方案 | 已核对的许可与适用性 | 本次处理 |
| --- | --- | --- |
| Kokoro v1.1-zh + sherpa-onnx | 模型卡和下载包 LICENSE 为 Apache-2.0；运行库亦为 Apache-2.0。支持中文与中英混读，可离线推理。 | 主方案，实际安装官方 Windows x64 / Python 3.13 wheel 并生成样音。 |
| MeloTTS Chinese | 官方模型卡及项目为 MIT；模型卡注明支持中英混读、CPU 实时推理。 | 可选后备，未在本机安装，不能声称已通过本机验证。 |
| Piper huayan medium | 引擎当前为 GPL-3.0；该中文声音 MODEL_CARD 的训练数据许可明确写 Unknown。 | 不以仓库顶层 MIT 标签替代具体声音许可，因此不选此声音。 |
| edge-tts | 第三方客户端调用微软 Edge 在线语音服务；客户端源代码许可不能自动授予服务使用权。 | 不将无密钥接口描述为正式授权的免费批量服务；整片不使用它。 |
| 本机 Huihui | Windows 已安装的 SAPI 系统声线。 | 保留同文案对照样音，不作为神经语音模型自然度的评价结论。 |

原始资料：

- [Kokoro 官方模型卡](https://huggingface.co/hexgrad/Kokoro-82M-v1.1-zh)
- [sherpa-onnx 官方模型、说话人编号和 API](https://k2-fsa.github.io/sherpa/onnx/tts/all/Chinese-English/kokoro-multi-lang-v1_1.html)
- [sherpa-onnx 许可证](https://github.com/k2-fsa/sherpa-onnx/blob/master/LICENSE)
- [MeloTTS Chinese 模型卡](https://huggingface.co/myshell-ai/MeloTTS-Chinese)
- [Piper huayan 的具体模型卡](https://huggingface.co/rhasspy/piper-voices/blob/main/zh/zh_CN/huayan/medium/MODEL_CARD)
- [Piper 当前引擎](https://github.com/OHF-Voice/piper1-gpl)
- [edge-tts 项目说明](https://github.com/rany2/edge-tts)
- [微软社区对客户端与服务许可区别的说明](https://learn.microsoft.com/en-us/answers/questions/2088770/are-opensource-edge-tts-free-for-commercial-use)

## 安装与样音

在 `video/` 执行以下步骤。只在下载步骤按实际网络情况设置当前进程代理，不能关闭 TLS 校验。

```powershell
$env:PYTHONPYCACHEPREFIX="$PWD/out/ai-history-tts/pycache"
python -m venv out/ai-history-tts/venv
$env:PIP_CACHE_DIR="$PWD/out/ai-history-tts/pip-cache"
./out/ai-history-tts/venv/Scripts/python.exe -m pip install --only-binary=:all: -r scripts/ai-history-tts/requirements.txt
./out/ai-history-tts/venv/Scripts/python.exe scripts/ai-history-tts/fetch_model.py
./out/ai-history-tts/venv/Scripts/python.exe scripts/ai-history-tts/make_samples.py
./scripts/ai-history-tts/make-huihui-sample.ps1
```

官方 INT8 包下载地址及 GitHub 资产 SHA-256 固定在 `fetch_model.py`。下载后会校验摘要，
并使用 Python 的安全 `data` 过滤器解包。包内 `model.int8.onnx` 与 `voices.bin` 无需
PyTorch、CUDA、在线推理服务或 API 密钥。

说话人 `sid=3` 为 `zf_001`，`sid=70` 为 `zm_031`。使用同一份 `sample.json`；
Kokoro 用 4 线程、原生语速 1.0。报告记录实际音频长度、合成耗时、实时因子和完整解码结果。
实时因子是合成时间除以音频时长，不能代替主观自然度评价。自然度和专名发音应以样音试听为准。

## 已处理的兼容问题

sherpa-onnx 2.0.1 已弃用 Kokoro 的 `data_dir`、`dict_dir` 参数。本工具按实际安装版本
使用模型内词典和日期/数字 FST，避免照搬旧示例产生警告。下载与安装完成后，正常合成不联网。

## 整片生成与断点复用

输入采用 `{"shots":[{"id":"shot-001","narration":["第一句。","第二句。"]}]}`。
生成前应由主流程定稿文案，避免以过快语速填入固定时长。

```powershell
$env:PYTHONPYCACHEPREFIX="$PWD/out/ai-history-tts/pycache"
./out/ai-history-tts/venv/Scripts/python.exe scripts/ai-history-tts/generate.py effects/ai-history/storyboard.json --workers=2 --threads=2 --speaker=3 --speed=1.0
```

两进程各加载一个模型，避免大量实例挤占内存。每个句子和镜头均使用包含模型哈希、声线、
语速与文案的缓存键；镜头还包含停顿和归一化配置。JSON 清单原子更新，中断重跑会复用已完成
镜头或已合成句子。每段编码为 44.1kHz 单声道 128kbps MP3，并完整解码成 16-bit PCM WAV
检测波形、峰值与 RMS；不依赖精简版 FFmpeg 中缺少的原始浮点流输出或音量分析滤镜。

字幕按原始采样数计时，时间相对音频起点，句间停顿 0.2 秒。主时间轴另加统一 0.7 秒起播延迟。
最后一条字幕会比语音保留约 0.15 秒阅读余量，镜头分配应计入这一点。

生产中发现模型会跳过年份字符 `〇` 和书名号。`zh-year-zero-v1` 发音预处理将 `〇` 转为
`零`，仅移除发音输入中的 `《》`，字幕保留原文。受影响句子和镜头缓存键包含规范化后文本
及版本；不受影响的缓存继续复用。原始告警和词典扫描证据保存在
`out/ai-history-tts/generation.log`、`oov-scan.json`。

随后按官方前端源码和两份模型词典发现：未知英文整词会被跳过。`pronunciations.json`
的 `zh-year-zero-and-ai-terms-v2` 因此将 ImageNet 等专名分解为词典已有的英文词，
将 GPT 展开为 G P T，保留原始字幕。生成前会扫描全部发音文本中的英文 token，
任何未被词典覆盖的词会明确报错，避免静默漏读。展开后的每个 token 已实际核对。

## 本次整片验证记录

2026-10-29，在 Windows / Python 3.13.1 / Ryzen 5 5600X（6 核 12 逻辑 CPU）上，
使用 `sid=3`、`speed=1.0`、两进程各两线程，完成 60 段旁白和 240 条逐句字幕。
加入 2024/2025 节点的最后修订只重合成两场，其余 58 场直接复用缓存。

- 最终语音总长：1530.618779 秒，单场 22.726531–27.428571 秒。
- 60 个 MP3 合计 24,517,529 字节；所有音频完整解码通过，字幕逐字对应最终原稿。
- 最高峰值 -5.3849 dBFS，RMS 范围 -23.4477 至 -23.4461 dBFS。
- 语音模型 ONNX SHA-256：`05d793700b0b507f760c183c0e39bdd6a97b43d32fdc7bf7b54a5179f1b11222`。
- 样音实测：女声 27.558 秒音频用时 58.033 秒（单实例 4 线程）；双进程各两线程的
  短基准总实时因子为 1.548（包含模型初始化）。并行渲染会影响实际吞吐，不能将短基准
  当作长片固定耗时承诺。

可重复审计音频文件哈希、字幕原文、时间范围、波形测量与模型哈希：

```powershell
./out/ai-history-tts/venv/Scripts/python.exe scripts/ai-history-tts/audit.py
```

详细报告在 `out/ai-history-tts/final-audit.json`；交付清单位于
`public/ai-history/voiceover-manifest.json`。字幕时间以音频起点为零，最终 1800 秒主片的
章节转场、阅读时间和统一起播延迟由主时间轴分配。
