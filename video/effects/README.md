# 新动画目录

每个新动画放在 `effects/<name>/`，组件与独立的 `<Composition>` 注册放在同一模块，
再在 `effects/index.tsx` 添加明确的导入和 JSX 节点。`src/Root.tsx` 已注册整个 Effects 文件夹。

- 全部动画共用 `video/package.json`、锁文件和 `video/node_modules`，子目录不执行初始化或安装。
- 素材放 `video/public/<name>/`，通过 `staticFile()` 引用；输出放 `video/out/`。
- `environment-test/` 是 4 秒的诊断样例，不是正式作品；可复制其结构后替换合成 ID 和内容。
- 旧作品继续保留在 `src/`，无需为目录规范重写已有视频。

命令均在 `video/` 执行：

```powershell
npm run dev -- --no-open
npm run lint
npx --no-install remotion render YourComposition out/your-animation.mp4
```
