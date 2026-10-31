import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DISPLAY, FONT, Narration } from "../daily-ten/SceneFrame";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.19, 1, 0.22, 1);

const WeekPages = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg viewBox="0 0 800 650" width="100%" height="100%">
      <ellipse
        cx="405"
        cy="526"
        rx="328"
        ry="22"
        fill="#061E28"
        opacity="0.3"
      />
      <path
        d="M49 512H747"
        fill="none"
        stroke="#71939B"
        strokeWidth="1"
        opacity="0.32"
      />
      {[26, 27, 28, 29, 30].map((day, i) => {
        const reveal = interpolate(
          frame,
          [(0.3 + i * 0.12) * fps, (1.65 + i * 0.12) * fps],
          [0, 1],
          { ...clamp, easing: ease },
        );
        const x = 61 + i * 136;
        const offset = Math.sin((frame / fps) * 0.35 + i * 0.7) * 3;
        const top = 154 + (i % 2 ? 25 : 0) + offset;
        return (
          <g
            key={day}
            opacity={reveal}
            style={{ translate: `0px ${(1 - reveal) * 35}px` }}
          >
            <path
              d={`M${x} ${top} L${x + 132} ${top + 25} V${top + 330} L${x} ${top + 305} Z`}
              fill={i % 2 ? "#C5D5D4" : "#E6EDE7"}
              stroke="#A9C4C7"
              strokeWidth="1.5"
            />
            <path
              d={`M${x + 122} ${top + 24} V${top + 327}`}
              stroke="#173844"
              strokeWidth="1"
              opacity="0.15"
            />
            <text
              x={x + 21}
              y={top + 53}
              fill="#547680"
              fontFamily={FONT}
              fontSize="17"
              letterSpacing="3"
            >
              10月
            </text>
            <text
              x={x + 17}
              y={top + 137}
              fill="#214552"
              fontFamily="Bahnschrift"
              fontSize="67"
              fontWeight="500"
            >
              {day}
            </text>
            <path
              d={`M${x + 22} ${top + 181} l86 16 M${x + 22} ${top + 200} l86 16 M${x + 22} ${top + 219} l69 13`}
              stroke="#74929A"
              strokeWidth="2"
              opacity="0.45"
            />
            <circle
              cx={x + 27}
              cy={top + 272}
              r="4"
              fill={day === 30 ? "#B57B4B" : "#78989E"}
            />
            <path
              d={`M${x + 44} ${top + 275} l61 11`}
              stroke={day === 30 ? "#B57B4B" : "#78989E"}
              strokeWidth="2"
              opacity="0.65"
            />
          </g>
        );
      })}
      <path
        d="M96 555 H706"
        fill="none"
        stroke="#D5B575"
        strokeWidth="1.8"
        strokeDasharray="3 8"
        opacity="0.7"
      />
      <circle
        cx={interpolate(frame, [0, 10 * fps], [96, 706], clamp)}
        cy="555"
        r="5"
        fill="#E8C482"
      />
      <text
        x="402"
        y="608"
        textAnchor="middle"
        fill="#A8C2C8"
        fontFamily={FONT}
        fontSize="22"
        letterSpacing="4"
      >
        从周一，到此刻。
      </text>
    </svg>
  );
};

export const WeeklyOpening = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  return (
    <AbsoluteFill
      style={{
        background: "#173844",
        color: "#EDF2EE",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      {portrait ? (
        <>
          <Interactive.Div
            name="竖版周记刊头"
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
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: 7 }}>
              这一周
            </span>
            <span style={{ fontSize: 25, letterSpacing: 2, color: "#ABC5CA" }}>
              新闻周记
            </span>
          </Interactive.Div>
          <div
            style={{
              position: "absolute",
              left: 70,
              top: 183,
              width: 830,
              height: 1,
              background: "#ABC5CA",
              opacity: 0.25,
            }}
          />
          <Interactive.Div
            name="竖版周记标题"
            style={{
              position: "absolute",
              left: 68,
              top: 244,
              width: 832,
              fontFamily: DISPLAY,
              fontSize: 99,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: 4,
              opacity: interpolate(frame, [0, 0.9 * fps], [0, 1], clamp),
              translate: interpolate(
                frame,
                [0, 1.8 * fps],
                ["0px 38px", "0px 0px"],
                { ...clamp, easing: ease },
              ),
            }}
          >
            这一周，
            <br />
            世界留下什么
          </Interactive.Div>
          <Interactive.Div
            name="竖版五日日历折页"
            style={{
              position: "absolute",
              left: 63,
              top: 521,
              width: 840,
              height: 686,
              scale: interpolate(frame, [0, 10 * fps], [0.97, 1.02], clamp),
            }}
          >
            <WeekPages />
          </Interactive.Div>
          <Interactive.Div
            name="竖版周记日期"
            style={{
              position: "absolute",
              left: 74,
              top: 1195,
              width: 820,
              fontFamily: "Bahnschrift, Microsoft YaHei",
              fontSize: 28,
              letterSpacing: 1,
              color: "#D5B575",
            }}
          >
            10.26—10.30 · 截至目前
          </Interactive.Div>
          <Interactive.Div
            name="竖版周记导语"
            style={{
              position: "absolute",
              left: 74,
              top: 1260,
              width: 820,
              fontSize: 41,
              lineHeight: 1.6,
              opacity: interpolate(
                frame,
                [1.1 * fps, 2.1 * fps],
                [0, 1],
                clamp,
              ),
            }}
          >
            十件事，回看本周。
            <br />
            <span style={{ color: "#ABC5CA" }}>
              看发生了什么，
              <br />
              也看事情怎样走到这里。
            </span>
          </Interactive.Div>
        </>
      ) : (
        <>
          <Interactive.Div
            name="横版周记刊头"
            style={{
              position: "absolute",
              top: 55,
              left: 90,
              right: 90,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 22,
              letterSpacing: 2,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: 5 }}>
                这一周
              </span>
              <span style={{ color: "#ABC5CA" }}>新闻周记</span>
            </div>
            <span
              style={{
                fontFamily: "Bahnschrift, Microsoft YaHei",
                color: "#ABC5CA",
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
              background: "#ABC5CA",
              opacity: 0.2,
            }}
          />
          <Interactive.Div
            name="横版周记标题"
            style={{
              position: "absolute",
              left: 101,
              top: 226,
              width: 935,
              fontFamily: DISPLAY,
              fontSize: 117,
              fontWeight: 600,
              lineHeight: 1.25,
              letterSpacing: 4,
              opacity: interpolate(frame, [0, 0.9 * fps], [0, 1], clamp),
              translate: interpolate(
                frame,
                [0, 1.8 * fps],
                ["0px 42px", "0px 0px"],
                { ...clamp, easing: ease },
              ),
            }}
          >
            这一周，
            <br />
            世界留下什么
          </Interactive.Div>
          <Interactive.Div
            name="横版五日日历折页"
            style={{
              position: "absolute",
              right: 49,
              top: 171,
              width: 870,
              height: 708,
              scale: interpolate(frame, [0, 10 * fps], [0.97, 1.02], clamp),
            }}
          >
            <WeekPages />
          </Interactive.Div>
          <Interactive.Div
            name="横版周记导语"
            style={{
              position: "absolute",
              left: 107,
              top: 617,
              width: 920,
              fontSize: 35,
              lineHeight: 1.8,
              opacity: interpolate(
                frame,
                [1.1 * fps, 2.1 * fps],
                [0, 1],
                clamp,
              ),
            }}
          >
            十件事，回看本周。
            <br />
            <span style={{ color: "#ABC5CA" }}>
              看发生了什么，也看事情怎样走到这里。
            </span>
          </Interactive.Div>
          <div
            style={{
              position: "absolute",
              left: 108,
              top: 811,
              display: "flex",
              gap: 20,
              alignItems: "center",
              fontSize: 23,
              color: "#D5B575",
              letterSpacing: 3,
            }}
          >
            <span style={{ width: 40, height: 2, background: "#D5B575" }} />
            十个观察世界的切口
          </div>
        </>
      )}
      <Narration id="intro" />
    </AbsoluteFill>
  );
};
