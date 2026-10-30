# AI 历史长片验证记录

制作说明与复现入口：`../../docs/AI-HISTORY-PRODUCTION.md`。
源稿及 61 条原始资料索引：`../../docs/AI-HISTORY-SCRIPT.md`。
完整 MP4 保存在被 Git 忽略的 `../../video/out/ai-history-1080p60.mp4`。

- `composition-validation.json`：108000 帧、60 fps、1920×1080 的合成信息及 16 个渲染静帧的检查。
- `narration-audit.json`：60 个源 MP3 的完整解码、哈希、字幕原文和时序核验。
- `audio-master-validation.json`：60 段实际 PCM 与精确 1800 秒、48 kHz 母带的检查。
- `studio-first-chapter.*`：第一章在 Studio 以 1 倍速、有声循环播放的抽查记录与截图。
- `studio-full.*`：完整合成从第十四章开始连续播放约 189 秒的抽查记录与截图，错误提示为 null。
- `studio-restored.*`：恢复生产后重新启动 Studio，确认完整合成规格与跳转正常。
- `export-validation.json`：最终 MP4 规格、SHA-256 与整片音视频完整解码结果，均通过。
- `content-audio-validation.json`：原稿、字幕、60 段源 MP3 和最终 AAC 的完整解码及 60 个旁白窗口检查，均通过。
- `render-state.json` / `production-complete.json`：15 章完成、缓存指纹、最终合并及生产完成记录。
- `visual-qa.json` / `final-*.png`：从最终 MP4 抽取的首、中、第十四章及尾部画面；为便于审阅，PNG 缩至 960×540。

最终文件为 287480245 字节，1920×1080、60 fps、108000 帧、1800 秒，H.264 / yuvj420p / pc，
AAC 48 kHz 双声道。SHA-256：`3575dca68ae643daa88c24722ad6765bd3e5ff63cda8f73bf0b949f74e8b7395`。

静帧和 Studio 抽查不等于观看了全部 30 分钟。客观音频检查也不能代替专名读法、自然度和内容的人工听审。
模型、虚拟环境、WAV 母带、渲染缓存及大量 QA 中间文件均不提交到 Git。
