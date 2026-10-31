import {
  AbsoluteFill,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DISPLAY, Folio, FONT, INK, Narration, PAPER } from "./SceneFrame";
export const Closing = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: FONT }}>
      <Folio index={10} />
      <Interactive.Div
        name="结尾标题"
        style={{
          position: "absolute",
          left: 103,
          top: 225,
          fontSize: 116,
          fontFamily: DISPLAY,
          lineHeight: 1.3,
          letterSpacing: 4,
          fontWeight: 600,
          opacity: interpolate(frame, [0, 1.1 * fps], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        看见变化，
        <br />
        也看见来处。
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          left: 109,
          top: 615,
          fontSize: 34,
          lineHeight: 1.8,
          color: "#54717A",
        }}
      >
        十条新闻，十个观察世界的切口。
        <br />
        记住发生了什么，也多问一句：意味着什么。
      </div>
      <div
        style={{
          position: "absolute",
          left: 1125,
          top: 262,
          width: 650,
          height: 420,
          borderLeft: "1px solid #BCCBCD",
          paddingLeft: 70,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia",
            fontSize: 160,
            lineHeight: 1,
            color: "#477C8B",
          }}
        >
          10
        </span>
        <span style={{ fontSize: 29, letterSpacing: 5, marginTop: 26 }}>
          件事 · 看世界
        </span>
        <span
          style={{
            fontSize: 22,
            lineHeight: 1.8,
            color: "#54717A",
            marginTop: 34,
          }}
        >
          资料检索截至 2026年10月30日
          <br />
          近期新闻精选 · 非热搜排名
          <br />
          完整出处随工程提供
        </span>
      </div>
      <Narration id="outro" />
    </AbsoluteFill>
  );
};
