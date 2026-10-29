import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp, ease, Kicker, numberFont, palette, SceneFrame } from "./shared";

export const LatestScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneFrame
      index="01"
      chapter="最新公开规模"
      source="来源：CNNIC《生成式人工智能应用发展报告（2026）》 · 2026-09-29 发布"
    >
      <Interactive.Div
        name="开篇问题"
        premountFor={fps}
        style={{ position: "absolute", left: 120, top: 178 }}
      >
        <Kicker>一分钟数据记录 / 2024—2026</Kicker>
        <div
          style={{
            fontSize: 82,
            lineHeight: 1.22,
            fontWeight: 700,
            marginTop: 24,
          }}
        >
          中国有多少人
          <br />
          在用生成式 AI？
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="突破七亿人"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 112,
          top: 445,
          opacity: interpolate(frame, [0.6 * fps, 1.6 * fps], [0, 1], {
            ...clamp,
            easing: ease,
          }),
          translate: interpolate(
            frame,
            [0.6 * fps, 1.8 * fps],
            ["0px 45px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        <div
          style={{
            fontSize: 35,
            color: palette.red,
            letterSpacing: 6,
            marginLeft: 8,
          }}
        >
          最新公开统计 · 突破
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 22,
            height: 310,
          }}
        >
          <span
            style={{
              fontFamily: numberFont,
              fontSize: 292,
              fontWeight: 700,
              color: palette.red,
              lineHeight: 1.1,
            }}
          >
            7
          </span>
          <span style={{ fontSize: 94, fontWeight: 500 }}>亿人</span>
          <span
            style={{
              fontFamily: numberFont,
              fontSize: 110,
              color: palette.red,
            }}
          >
            +
          </span>
        </div>
        <div style={{ fontSize: 32, color: palette.muted, marginLeft: 8 }}>
          统计截至 2026 年上半年
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="人群图形示意"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1020,
          top: 235,
          width: 740,
          height: 630,
        }}
      >
        <svg viewBox="0 0 740 630" width="100%" height="100%" aria-hidden>
          <circle cx="380" cy="300" r="287" fill={palette.pale} />
          <circle
            cx="380"
            cy="300"
            r="238"
            fill="none"
            stroke={palette.teal}
            strokeOpacity="0.18"
            strokeDasharray="2 16"
            strokeWidth="3"
          />
          {Array.from({ length: 80 }, (_, i) => {
            const col = i % 10;
            const row = Math.floor(i / 10);
            const x = 128 + col * 55;
            const y = 88 + row * 57;
            return (
              <g
                key={i}
                opacity={interpolate(
                  frame,
                  [(0.8 + i * 0.018) * fps, (1.3 + i * 0.018) * fps],
                  [0, 1],
                  clamp,
                )}
                fill={(col + row) % 5 === 0 ? palette.red : palette.teal}
              >
                <circle cx={x} cy={y} r="8" />
                <path d={`M${x - 12} ${y + 29} v-9 a12 12 0 0 1 24 0 v9 Z`} />
              </g>
            );
          })}
          <text
            x="380"
            y="590"
            textAnchor="middle"
            fontSize="25"
            fill={palette.muted}
            letterSpacing="6"
          >
            从尝鲜工具，到日常帮手
          </text>
        </svg>
      </Interactive.Div>
    </SceneFrame>
  );
};
