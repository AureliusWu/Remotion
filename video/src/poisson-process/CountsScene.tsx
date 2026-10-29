import type { FC } from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { poissonMass, ratePerMinute } from "./math";
import { clamp, colors, fonts, Frame } from "./shared";

const observationMinutes = 1;
const mean = ratePerMinute * observationMinutes;
const probabilities = Array.from({ length: 8 }, (_, k) => poissonMass(k, mean));

export const CountsScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Frame
      number="04"
      chapter="泊松分布"
      title="一段时间，会来多少次？"
      note="示例 λ = 2 人/分钟，t = 1 分钟。图中只展示 0 至 7 次，8 次及以上仍有可能。"
    >
      <Interactive.Div
        name="泊松分布概率质量函数"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 285,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          fontFamily: fonts.math,
          fontSize: 72,
          opacity: interpolate(frame, [0.5 * fps, 1.3 * fps], [0, 1], clamp),
        }}
      >
        <span>P(N(t) = k) =</span>
        <span
          style={{
            display: "inline-flex",
            flexDirection: "column",
            textAlign: "center",
            lineHeight: 1.15,
            fontSize: 64,
          }}
        >
          <span
            style={{
              padding: "0 18px 8px",
              borderBottom: `3px solid ${colors.ink}`,
            }}
          >
            e<sup style={{ fontSize: "0.58em" }}>−λt</sup>(λt)
            <sup style={{ fontSize: "0.58em" }}>k</sup>
          </span>
          <span style={{ paddingTop: 5 }}>k!</span>
        </span>
      </Interactive.Div>

      <Interactive.Div
        name="一分钟两人示例参数"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 230,
          top: 463,
          display: "flex",
          gap: 50,
          fontSize: 34,
          color: colors.muted,
          opacity: interpolate(frame, [3.5 * fps, 4.2 * fps], [0, 1], clamp),
        }}
      >
        <span>λ = {ratePerMinute} 人 / 分钟</span>
        <span>t = {observationMinutes} 分钟</span>
        <span>λt = {mean}</span>
      </Interactive.Div>

      <Interactive.Div
        name="零至七次到来的概率柱图"
        premountFor={fps}
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [4 * fps, 4.6 * fps], [0, 1], clamp),
        }}
      >
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          {[0, 0.15, 0.3].map((tick) => (
            <g key={tick}>
              <path
                d={`M220 ${800 - (tick / 0.3) * 235}H1300`}
                stroke={tick === 0 ? colors.ink : colors.line}
                strokeWidth="2"
              />
              <text
                x="190"
                y={811 - (tick / 0.3) * 235}
                textAnchor="end"
                fontFamily={fonts.number}
                fontSize="32"
                fill={colors.muted}
              >
                {Math.round(tick * 100)}%
              </text>
            </g>
          ))}
          {probabilities.map((probability, k) => {
            const start = (5 + k * 0.23) * fps;
            const height = interpolate(
              frame,
              [start, start + 1.2 * fps],
              [0, (probability / 0.3) * 235],
              clamp,
            );
            const x = 230 + k * 132;
            return (
              <g key={k}>
                <rect
                  x={x}
                  y={800 - height}
                  width="82"
                  height={height}
                  rx="3"
                  fill={k === 0 ? colors.coral : colors.teal}
                />
                <text
                  x={x + 41}
                  y={782 - height}
                  textAnchor="middle"
                  fontFamily={fonts.number}
                  fontSize="32"
                  fill={k === 0 ? colors.coral : colors.ink}
                  opacity={interpolate(
                    frame,
                    [start + 0.7 * fps, start + 1.3 * fps],
                    [0, 1],
                    clamp,
                  )}
                >
                  {(probability * 100).toFixed(1)}%
                </text>
                <text
                  x={x + 41}
                  y="846"
                  textAnchor="middle"
                  fontFamily={fonts.number}
                  fontSize="34"
                  fill={colors.ink}
                >
                  {k}
                </text>
              </g>
            );
          })}
          <text
            x="1330"
            y="846"
            fontFamily={fonts.body}
            fontSize="32"
            fill={colors.muted}
          >
            次
          </text>
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="一分钟无人到来的概率读数"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1410,
          top: 520,
          width: 370,
          opacity: interpolate(frame, [13 * fps, 13.8 * fps], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 32, color: colors.muted }}>
          一分钟内无人到来
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: fonts.number,
            fontSize: 106,
            color: colors.coral,
            letterSpacing: -3,
          }}
        >
          {(probabilities[0] * 100).toFixed(1)}%
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="一分钟平均到来次数"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1410,
          top: 706,
          width: 370,
          opacity: interpolate(frame, [8.7 * fps, 9.5 * fps], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 32, color: colors.muted }}>平均到来次数</div>
        <div style={{ marginTop: 9, fontFamily: fonts.math, fontSize: 57 }}>
          E[N(1)] = <span style={{ color: colors.teal }}>{mean}</span>
        </div>
      </Interactive.Div>
    </Frame>
  );
};
