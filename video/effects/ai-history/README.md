# AI 发展历程长片

全部依赖共享 `video/` 根目录。`AiHistory30m` 为完整 30 分钟合成；章节和镜头在 Studio 中分别注册。

## 编辑与生成

- `content-part-a.json` / `content-part-b.json`：按章节拆分的原稿、画面标签、要点和来源。
- `storyboard.json`：运行 `node scripts/prepare-ai-history.mjs merge` 后得到的统一输入，供配音和时间轴使用。
- `film-data.json` / `chapter-timeline.json`：按实际旁白生成的时码；partial 中未就绪部分只是占位，不可完整导出。
- `shots/` / `chapters/` / `AiHistoryFilm.tsx`：生成的明确 JSX 节点，可在 Studio 中逐段查看。
- `HistoryScene.tsx` / `Diagrams.tsx` / `SpecialDiagrams.tsx`：共享版式、通用图解与需要专门保证语义正确的图解。

改文案时先修改对应原稿，再 merge、合成语音、assemble。只改派生 JSON 或生成的 JSX 会被下次生成覆盖；
应先把 Studio 中需要保留的编辑回写到原稿或生成器。音频工具按句子哈希复用，无需全片重新推理。

`LayoutReview` 用于静帧排版检查，`Preview` 是 30 秒带旁白样片；二者不能代替完整影片导出。
完整命令、免费语音选型、历史资料与生产验证见 `docs/AI-HISTORY-PRODUCTION.md`。
