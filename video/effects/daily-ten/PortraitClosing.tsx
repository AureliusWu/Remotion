import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DISPLAY, FONT, INK, Narration, PAPER } from "./SceneFrame";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const PortraitClosing = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        color: INK,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <Interactive.Div
        name="竖版片尾刊头"
        style={{
          position: "absolute",
          top: 116,
          left: 70,
          width: 830,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          letterSpacing: 3,
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: 7 }}>
          此 刻
        </span>
        <span style={{ fontSize: 25, color: "#54717A" }}>新闻观察</span>
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          top: 183,
          left: 70,
          width: 830,
          height: 1,
          background: "#BCCBCD",
        }}
      />
      <Interactive.Div
        name="竖版结尾标题"
        style={{
          position: "absolute",
          left: 68,
          top: 252,
          width: 832,
          fontFamily: DISPLAY,
          fontSize: 104,
          fontWeight: 600,
          lineHeight: 1.32,
          letterSpacing: 4,
          opacity: interpolate(frame, [0, 1.1 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0, 1.7 * fps],
            ["0px 30px", "0px 0px"],
            { ...clamp, easing: Easing.bezier(0.19, 1, 0.22, 1) },
          ),
        }}
      >
        看见变化，
        <br />
        也看见来处。
      </Interactive.Div>
      <Interactive.Div
        name="十件事片尾标记"
        style={{
          position: "absolute",
          left: 73,
          top: 621,
          width: 825,
          display: "flex",
          alignItems: "center",
          gap: 50,
          color: "#477C8B",
          opacity: interpolate(frame, [0.6 * fps, 1.8 * fps], [0, 1], clamp),
        }}
      >
        <span style={{ fontFamily: "Georgia", fontSize: 222, lineHeight: 1 }}>
          10
        </span>
        <span style={{ fontSize: 40, lineHeight: 1.65, letterSpacing: 5 }}>
          件事
          <br />
          看世界
        </span>
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          left: 74,
          top: 938,
          width: 816,
          height: 1,
          background: "#BCCBCD",
        }}
      />
      <Interactive.Div
        name="竖版结尾寄语"
        style={{
          position: "absolute",
          left: 74,
          top: 997,
          width: 820,
          fontSize: 44,
          lineHeight: 1.65,
          color: "#54717A",
          opacity: interpolate(frame, [1.1 * fps, 2.1 * fps], [0, 1], clamp),
        }}
      >
        十条新闻，十个观察世界的切口。
        <br />
        记住发生了什么，
        <br />
        也多问一句：意味着什么。
      </Interactive.Div>
      <Interactive.Div
        name="竖版资料范围"
        style={{
          position: "absolute",
          top: 1252,
          left: 75,
          width: 815,
          fontSize: 27,
          lineHeight: 1.8,
          color: "#54717A",
        }}
      >
        资料检索截至 2026年10月30日
        <br />
        近期新闻精选 · 非热搜排名
        <br />
        完整出处随工程提供
      </Interactive.Div>
      <Narration id="outro" />
    </AbsoluteFill>
  );
};
