import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DISPLAY, FONT, INK, Narration, PAPER } from "../daily-ten/SceneFrame";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.19, 1, 0.22, 1);

export const AiClosing = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  return (
    <AbsoluteFill
      style={{
        background: PAPER,
        color: INK,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {portrait ? (
        <>
          <Interactive.Div
            name="竖版AI片尾刊头"
            style={{
              position: "absolute",
              left: 70,
              top: 116,
              width: 830,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontFamily: "Bahnschrift",
                fontSize: 34,
                fontWeight: 600,
                letterSpacing: 4,
              }}
            >
              AI WEEKLY
            </span>
            <span style={{ fontSize: 25, color: "#54717A", letterSpacing: 2 }}>
              热点观察
            </span>
          </Interactive.Div>
          <div
            style={{
              position: "absolute",
              left: 70,
              top: 183,
              width: 830,
              height: 1,
              background: "#B8CBC9",
            }}
          />
          <Interactive.Div
            name="竖版AI片尾标题"
            style={{
              position: "absolute",
              left: 68,
              top: 252,
              width: 832,
              fontFamily: DISPLAY,
              fontSize: 103,
              fontWeight: 600,
              lineHeight: 1.32,
              letterSpacing: 4,
              opacity: interpolate(frame, [0, 1.1 * fps], [0, 1], clamp),
              translate: interpolate(
                frame,
                [0, 1.7 * fps],
                ["0px 30px", "0px 0px"],
                { ...clamp, easing: ease },
              ),
            }}
          >
            看见进展，
            <br />
            也读懂边界。
          </Interactive.Div>
          <Interactive.Div
            name="竖版九条AI进展"
            style={{
              position: "absolute",
              left: 74,
              top: 615,
              width: 825,
              display: "flex",
              alignItems: "center",
              gap: 45,
              color: "#397582",
              opacity: interpolate(
                frame,
                [0.6 * fps, 1.8 * fps],
                [0, 1],
                clamp,
              ),
            }}
          >
            <span
              style={{ fontFamily: "Georgia", fontSize: 228, lineHeight: 1 }}
            >
              9
            </span>
            <span style={{ fontSize: 40, lineHeight: 1.65, letterSpacing: 3 }}>
              条 AI 进展
              <br />
              回看这一周
            </span>
          </Interactive.Div>
          <div
            style={{
              position: "absolute",
              left: 74,
              top: 938,
              width: 816,
              height: 1,
              background: "#B8CBC9",
            }}
          />
          <Interactive.Div
            name="竖版AI片尾寄语"
            style={{
              position: "absolute",
              left: 74,
              top: 997,
              width: 820,
              fontSize: 43,
              lineHeight: 1.65,
              color: "#54717A",
              opacity: interpolate(
                frame,
                [1.1 * fps, 2.1 * fps],
                [0, 1],
                clamp,
              ),
            }}
          >
            模型、工具、研究，
            <br />
            走进具体的工作。
            <br />
            预览与上线，分别标明。
          </Interactive.Div>
          <Interactive.Div
            name="竖版AI资料范围"
            style={{
              position: "absolute",
              left: 75,
              top: 1252,
              width: 815,
              fontSize: 27,
              lineHeight: 1.8,
              color: "#54717A",
            }}
          >
            资料截至 2026年10月30日
            <br />
            周内精选 · 非热搜榜
            <br />
            厂商披露与实际部署，分开看
          </Interactive.Div>
        </>
      ) : (
        <>
          <Interactive.Div
            name="横版AI片尾刊头"
            style={{
              position: "absolute",
              left: 90,
              top: 55,
              right: 90,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 22,
              letterSpacing: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <span
                style={{
                  fontFamily: "Bahnschrift",
                  fontSize: 29,
                  fontWeight: 600,
                  letterSpacing: 4,
                }}
              >
                AI WEEKLY
              </span>
              <span style={{ color: "#54717A" }}>热点观察</span>
            </div>
            <span
              style={{
                fontFamily: "Bahnschrift, Microsoft YaHei",
                color: "#54717A",
              }}
            >
              10.26—10.30 · 截至目前
            </span>
          </Interactive.Div>
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 109,
              right: 90,
              height: 1,
              background: "#B8CBC9",
            }}
          />
          <Interactive.Div
            name="横版AI片尾标题"
            style={{
              position: "absolute",
              left: 103,
              top: 225,
              width: 990,
              fontFamily: DISPLAY,
              fontSize: 116,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: 4,
              opacity: interpolate(frame, [0, 1.1 * fps], [0, 1], clamp),
              translate: interpolate(
                frame,
                [0, 1.7 * fps],
                ["0px 30px", "0px 0px"],
                { ...clamp, easing: ease },
              ),
            }}
          >
            看见进展，
            <br />
            也读懂边界。
          </Interactive.Div>
          <Interactive.Div
            name="横版AI片尾寄语"
            style={{
              position: "absolute",
              left: 109,
              top: 615,
              width: 960,
              fontSize: 35,
              lineHeight: 1.8,
              color: "#54717A",
              opacity: interpolate(
                frame,
                [1.1 * fps, 2.1 * fps],
                [0, 1],
                clamp,
              ),
            }}
          >
            模型、工具、研究，走进具体的工作。
            <br />
            预览与上线，分别标明。
          </Interactive.Div>
          <Interactive.Div
            name="横版AI资料范围"
            style={{
              position: "absolute",
              left: 1130,
              top: 269,
              width: 642,
              height: 424,
              borderLeft: "1px solid #B8CBC9",
              paddingLeft: 68,
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
                color: "#397582",
              }}
            >
              9
            </span>
            <span style={{ fontSize: 29, letterSpacing: 4, marginTop: 26 }}>
              条 AI 进展
            </span>
            <span
              style={{
                fontSize: 22,
                lineHeight: 1.8,
                color: "#54717A",
                marginTop: 34,
              }}
            >
              资料截至 2026年10月30日
              <br />
              周内精选 · 非热搜榜
              <br />
              厂商披露与实际部署，分开看
            </span>
          </Interactive.Div>
        </>
      )}
      <Narration id="outro" />
    </AbsoluteFill>
  );
};
