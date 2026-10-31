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

const EditorialSamples = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg viewBox="0 0 800 650" width="100%" height="100%">
      <ellipse
        cx="410"
        cy="554"
        rx="304"
        ry="21"
        fill="#547A81"
        opacity="0.08"
      />
      {[
        { title: "模型", x: 47, y: 126, angle: -9, fill: "#F9FBF6" },
        { title: "工具", x: 270, y: 81, angle: 2, fill: "#D9E8E5" },
        { title: "应用", x: 493, y: 135, angle: 11, fill: "#F9FBF6" },
      ].map((sheet, i) => {
        const reveal = interpolate(
          frame,
          [(0.35 + i * 0.17) * fps, (1.9 + i * 0.17) * fps],
          [0, 1],
          { ...clamp, easing: ease },
        );
        const spread = interpolate(frame, [0.3 * fps, 2.5 * fps], [0.2, 1], {
          ...clamp,
          easing: ease,
        });
        const x = 270 + (sheet.x - 270) * spread;
        const y =
          sheet.y + (1 - reveal) * 45 + Math.sin((frame / fps) * 0.3 + i) * 3;
        return (
          <g
            key={sheet.title}
            opacity={reveal}
            transform={`translate(${x} ${y}) rotate(${sheet.angle * spread} 115 190)`}
          >
            <path d="M8 8H238V390H8Z" fill="#305966" opacity="0.07" />
            <path
              d="M0 0H230V382H0Z"
              fill={sheet.fill}
              stroke="#8EAFB1"
              strokeWidth="1.5"
            />
            <path d="M191 0H230V39Z" fill="#C3D9D6" />
            <path
              d="M191 0V39H230"
              fill="none"
              stroke="#8EAFB1"
              strokeWidth="1"
            />
            <text
              x="24"
              y="44"
              fontFamily={FONT}
              fontSize="16"
              letterSpacing="3"
              fill="#63848A"
            >
              AI / WEEKLY
            </text>
            <text
              x="22"
              y="108"
              fontFamily={DISPLAY}
              fontSize="46"
              fill="#214552"
              fontWeight="600"
            >
              {sheet.title}
            </text>
            <path d="M24 135H206" stroke="#A8C1BF" strokeWidth="1" />
            {i === 0 ? (
              <g fill="none" stroke="#547E86" strokeWidth="1.8">
                <path d="M28 168H127M28 185H187M28 202H158" opacity="0.6" />
                <path d="M29 236H201V304H29Z" fill="#E5EFEC" stroke="#A8C1BF" />
                <path d="M47 255H143M47 272H180M47 289H125" opacity="0.5" />
              </g>
            ) : i === 1 ? (
              <g fill="none" stroke="#547E86" strokeWidth="1.7">
                <rect
                  x="28"
                  y="163"
                  width="174"
                  height="38"
                  rx="2"
                  fill="#F3F7F2"
                />
                <path d="M44 180H99M109 180H166" opacity="0.6" />
                <path
                  d="M114 213V233M70 233H161M70 233V252M161 233V252"
                  stroke="#7A9C9F"
                />
                <rect
                  x="28"
                  y="252"
                  width="84"
                  height="59"
                  rx="2"
                  fill="#EFF5EF"
                />
                <rect
                  x="123"
                  y="252"
                  width="79"
                  height="59"
                  rx="2"
                  fill="#EFF5EF"
                />
                <path
                  d="M43 271H95M43 287H84M138 271H187M138 287H177"
                  opacity="0.45"
                />
              </g>
            ) : (
              <g>
                <rect x="28" y="163" width="174" height="91" fill="#D7E6E2" />
                <path
                  d="M28 245 79 194 113 221 145 188 202 240V254H28Z"
                  fill="#83A9AB"
                  opacity="0.55"
                />
                <circle cx="169" cy="184" r="10" fill="#B5CECB" />
                <path
                  d="M29 278H188M29 296H202M29 314H150"
                  stroke="#7A9C9F"
                  strokeWidth="1.8"
                  opacity="0.65"
                />
              </g>
            )}
            <path d="M25 347H76" stroke="#3F7985" strokeWidth="3" />
            <circle cx="202" cy="347" r="4" fill="#3F7985" />
          </g>
        );
      })}
      <text
        x="400"
        y="620"
        textAnchor="middle"
        fontFamily={FONT}
        fontSize="19"
        letterSpacing="2"
        fill="#66858A"
      >
        编辑示意 · 非产品截图
      </text>
    </svg>
  );
};

export const AiOpening = () => {
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
            name="竖版AI周报刊头"
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
              9条精选 · 3分钟
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
            name="竖版AI周报标题"
            style={{
              position: "absolute",
              left: 68,
              top: 246,
              width: 832,
              fontFamily: DISPLAY,
              fontSize: 110,
              fontWeight: 600,
              lineHeight: 1.28,
              letterSpacing: 3,
              opacity: interpolate(frame, [0, 0.9 * fps], [0, 1], clamp),
              translate: interpolate(
                frame,
                [0, 1.7 * fps],
                ["0px 36px", "0px 0px"],
                { ...clamp, easing: ease },
              ),
            }}
          >
            <span style={{ fontFamily: "Georgia", letterSpacing: 1 }}>AI</span>{" "}
            一周
            <br />
            热点观察
          </Interactive.Div>
          <Interactive.Div
            name="竖版三张编辑样张"
            style={{
              position: "absolute",
              left: 65,
              top: 535,
              width: 840,
              height: 683,
              scale: interpolate(frame, [0, 10 * fps], [0.97, 1.015], clamp),
            }}
          >
            <EditorialSamples />
          </Interactive.Div>
          <Interactive.Div
            name="竖版AI周报日期"
            style={{
              position: "absolute",
              left: 74,
              top: 1208,
              width: 820,
              color: "#397582",
              fontFamily: "Bahnschrift, Microsoft YaHei",
              fontSize: 28,
              letterSpacing: 1,
            }}
          >
            10.26—10.30 · 截至目前
          </Interactive.Div>
          <Interactive.Div
            name="竖版AI周报导语"
            style={{
              position: "absolute",
              left: 74,
              top: 1272,
              width: 820,
              fontSize: 43,
              lineHeight: 1.6,
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
          </Interactive.Div>
        </>
      ) : (
        <>
          <Interactive.Div
            name="横版AI周报刊头"
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
            name="横版AI周报标题"
            style={{
              position: "absolute",
              left: 101,
              top: 226,
              width: 925,
              fontFamily: DISPLAY,
              fontSize: 126,
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: 4,
              opacity: interpolate(frame, [0, 0.9 * fps], [0, 1], clamp),
              translate: interpolate(
                frame,
                [0, 1.7 * fps],
                ["0px 39px", "0px 0px"],
                { ...clamp, easing: ease },
              ),
            }}
          >
            <span style={{ fontFamily: "Georgia", letterSpacing: 1 }}>AI</span>{" "}
            一周
            <br />
            热点观察
          </Interactive.Div>
          <Interactive.Div
            name="横版三张编辑样张"
            style={{
              position: "absolute",
              right: 45,
              top: 171,
              width: 886,
              height: 720,
              scale: interpolate(frame, [0, 10 * fps], [0.97, 1.015], clamp),
            }}
          >
            <EditorialSamples />
          </Interactive.Div>
          <Interactive.Div
            name="横版AI周报导语"
            style={{
              position: "absolute",
              left: 107,
              top: 634,
              width: 910,
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
            模型、工具、研究，
            <br />
            走进具体的工作。
          </Interactive.Div>
          <div
            style={{
              position: "absolute",
              left: 108,
              top: 814,
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontSize: 23,
              color: "#397582",
              letterSpacing: 3,
            }}
          >
            <span style={{ width: 40, height: 2, background: "#397582" }} />
            9条精选 · 3分钟
          </div>
        </>
      )}
      <Narration id="intro" />
    </AbsoluteFill>
  );
};
