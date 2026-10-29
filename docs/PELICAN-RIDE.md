# 鹈鹕海岸骑行

制作日期：2026-10-29。合成 ID：`PelicanRide`。

## 规格与画面

- 时长 15 秒，60 fps，900 帧（帧编号 0–899）。
- 分辨率 1920×1080，16:9。
- 暖色 SVG 海岸插画，薄荷绿自行车、珊瑚色围巾、白色鹈鹕。
- 开头片名“去吹海风”渐入，4 秒时完全淡出；随后保留完整骑行画面。
- 无外部素材、无音轨；所有动画由 Remotion 当前帧驱动。

## 预览

在 `video/` 执行 `npm run dev -- --no-open`，打开终端打印的地址并选择
`PelicanRide`。本次预览地址为 `http://localhost:3000/PelicanRide`。

源代码分为合成与片名 `PelicanRide.tsx`、角色和自行车 `PelicanCyclist.tsx`、
海岸背景 `CoastalBackdrop.tsx`、共享运动计算 `motion.ts`。
自行车和围巾颜色可在合成的 `defaultProps` 中调整。

双脚相差半圈，腿部使用两段逆运动学，踏板轴与曲柄端点重合；轮胎半径 130px，
每秒转两圈。近地纹理按同一地速移动，远景按比例减速。

## 验证结果

- `npm run lint`：ESLint 与 TypeScript 均通过。
- `npm run build`：打包通过。
- Studio 返回 1920×1080、60 fps、900 帧；实际播放状态推进，错误查询返回 `null`。
- 静帧 90、450、899 均成功生成并检查，未见遮挡、裁切或画面异常。
- 逐帧检查 0–899 的腿部计算：坐标均有限，两段骨长保持 140/148px，双脚始终对径，
  无关节翻折；车轮角度与路面位移一致。

本次交付为可播放的 Studio 合成及 PNG 封面。MP4 尚未导出。
静帧检查输出保存在被 Git 忽略的 `video/out/`；仓库封面为
[`examples/pelican-ride.png`](../examples/pelican-ride.png)。
