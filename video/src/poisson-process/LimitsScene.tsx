import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp, colors, fonts, Frame } from "./shared";

export const LimitsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Frame
      number="08"
      chapter="把生活还给生活"
      title="真实世界，会提醒我们重看假设"
      note="变速可用非齐次模型描述；明显聚集或相互影响，还需要检查独立性等假设。"
    >
      <Interactive.Div
        name="规律与聚集的对照"
        premountFor={fps}
        style={{ position: "absolute", left: 160, right: 160, top: 320 }}
      >
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 140 }}
        >
          <div>
            <div style={{ fontSize: 44 }}>按时刻表到来的公交</div>
            <div style={{ fontSize: 29, color: colors.muted, marginTop: 23 }}>
              有固定节拍，不符合指数等待。
            </div>
          </div>
          <div>
            <div style={{ fontSize: 44 }}>讲座散场后的人群</div>
            <div style={{ fontSize: 29, color: colors.muted, marginTop: 23 }}>
              速率会变，也可能成群到来。
            </div>
          </div>
        </div>
        <svg width="1600" height="260" style={{ marginTop: 45 }} aria-hidden>
          <path
            d="M0 120H680M870 120H1550"
            stroke={colors.line}
            strokeWidth="4"
          />
          {[50, 185, 320, 455, 590].map((x, i) => (
            <g
              key={i}
              opacity={interpolate(
                frame,
                [(1 + i * 0.25) * fps, (1.5 + i * 0.25) * fps],
                [0, 1],
                clamp,
              )}
            >
              <circle cx={x} cy="120" r="12" fill={colors.teal} />
              <path d={`M${x} 89v-12`} stroke={colors.teal} strokeWidth="2" />
            </g>
          ))}
          {[
            910, 920, 930, 943, 956, 1110, 1350, 1361, 1371, 1382, 1394, 1406,
            1418,
          ].map((x, i) => (
            <circle
              key={i}
              cx={x}
              cy={120 + ((i % 3) - 1) * 21}
              r="9"
              fill={colors.coral}
              opacity={interpolate(
                frame,
                [(3 + i * 0.12) * fps, (3.6 + i * 0.12) * fps],
                [0, 1],
                clamp,
              )}
            />
          ))}
          <text
            x="340"
            y="219"
            textAnchor="middle"
            fontSize="28"
            fill={colors.muted}
            fontFamily={fonts.body}
          >
            固定间隔示意
          </text>
          <text
            x="1210"
            y="219"
            textAnchor="middle"
            fontSize="28"
            fill={colors.muted}
            fontFamily={fonts.body}
          >
            变速 / 聚集示意
          </text>
        </svg>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 53,
            textAlign: "center",
            marginTop: 32,
            opacity: interpolate(frame, [7 * fps, 8 * fps], [0, 1], clamp),
          }}
        >
          该修改的是假设，不是要求生活配合公式。
        </div>
      </Interactive.Div>
    </Frame>
  );
};
