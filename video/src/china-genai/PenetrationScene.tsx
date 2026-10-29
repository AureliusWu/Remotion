import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp, ease, numberFont, palette, SceneFrame } from "./shared";

export const PenetrationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneFrame
      index="04"
      chapter="使用覆盖"
      title="生成式 AI，已覆盖过半人口"
      source="来源：CNNIC《生成式人工智能应用发展报告（2026）》 · 统计截至 2026 年上半年"
    >
      <Interactive.Div
        name="超过百分之五十"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 160,
          top: 310,
          width: 710,
          height: 560,
        }}
      >
        <svg width="710" height="560" viewBox="0 0 710 560" aria-hidden>
          <circle
            cx="350"
            cy="265"
            r="210"
            fill="none"
            stroke={palette.pale}
            strokeWidth="34"
          />
          <circle
            cx="350"
            cy="265"
            r="210"
            fill="none"
            stroke={palette.red}
            strokeWidth="34"
            pathLength="100"
            strokeDasharray={`${interpolate(frame, [0.5 * fps, 2.5 * fps], [0, 50], { ...clamp, easing: ease })} 100`}
            transform="rotate(-90 350 265)"
          />
          <path
            d="M350 486 l-16 -25 m16 25 16-25"
            stroke={palette.red}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            top: 171,
            textAlign: "center",
            fontFamily: numberFont,
            fontSize: 112,
            fontWeight: 700,
            letterSpacing: -6,
          }}
        >
          &gt;50<span style={{ fontSize: 66 }}>%</span>
        </div>
        <div
          style={{
            position: "absolute",
            top: 321,
            width: "100%",
            textAlign: "center",
            color: palette.muted,
            fontSize: 30,
          }}
        >
          生成式人工智能普及率
        </div>
        <div
          style={{
            position: "absolute",
            top: 519,
            width: "100%",
            textAlign: "center",
            color: palette.muted,
            fontSize: 24,
          }}
        >
          圆环以 50% 下限示意，非精确比例
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="人口覆盖解释"
        premountFor={fps}
        style={{ position: "absolute", left: 1010, top: 394, width: 730 }}
      >
        <div style={{ fontSize: 66, lineHeight: 1.45, fontWeight: 600 }}>
          按报告统计口径，
          <br />
          已有<span style={{ color: palette.red }}>过半人口</span>
          <br />
          在统计期内使用过。
        </div>
        <div
          style={{
            width: 80,
            height: 5,
            backgroundColor: palette.teal,
            marginTop: 45,
          }}
        />
        <div style={{ fontSize: 30, color: palette.muted, marginTop: 28 }}>
          这里讲的是使用覆盖，非同时在线人数。
        </div>
      </Interactive.Div>
    </SceneFrame>
  );
};
