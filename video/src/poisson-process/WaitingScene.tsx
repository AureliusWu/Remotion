import type { FC } from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ratePerMinute, survival } from "./math";
import { clamp, colors, fonts, Frame } from "./shared";

const left = 250;
const top = 466;
const plotWidth = 1050;
const plotHeight = 320;
const baseline = top + plotHeight;
const oneMinuteX = left + plotWidth / 2;
const oneMinuteY = baseline - survival(1) * plotHeight;
const curve = Array.from({ length: 101 }, (_, i) => {
  const minutes = (i / 100) * 2;
  return `${i === 0 ? "M" : "L"}${left + (minutes / 2) * plotWidth} ${baseline - survival(minutes) * plotHeight}`;
}).join(" ");

export const WaitingScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Frame
      number="05"
      chapter="指数等待"
      title="下一次，还要等多久？"
      note="横轴为模型等待时间，不是视频播放时间；阴影仅标示 t > 1 的区间，概率读纵轴。平均不是保证。"
    >
      <Interactive.Div
        name="指数等待的生存函数"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 292,
          textAlign: "center",
          fontFamily: fonts.math,
          fontSize: 82,
          opacity: interpolate(frame, [0.5 * fps, 1.3 * fps], [0, 1], clamp),
        }}
      >
        P(T &gt; t) = e<sup style={{ fontSize: "0.58em" }}>−λt</sup>
      </Interactive.Div>

      <Interactive.Div
        name="等待时间生存曲线"
        premountFor={fps}
        style={{ position: "absolute", inset: 0 }}
      >
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <clipPath id="poisson-survival-reveal">
              <rect
                x={left - 4}
                y={top - 8}
                width={interpolate(
                  frame,
                  [2 * fps, 7 * fps],
                  [0, plotWidth + 8],
                  clamp,
                )}
                height={plotHeight + 16}
              />
            </clipPath>
          </defs>
          <rect
            x={oneMinuteX}
            y={top}
            width={plotWidth / 2}
            height={plotHeight}
            fill={colors.coral}
            opacity={interpolate(
              frame,
              [12 * fps, 12.7 * fps],
              [0, 0.11],
              clamp,
            )}
          />
          {[0, 0.5, 1].map((value) => (
            <g key={value}>
              <path
                d={`M${left} ${baseline - value * plotHeight}H${left + plotWidth}`}
                stroke={value === 0 ? colors.ink : colors.line}
                strokeWidth="2"
              />
              <text
                x={left - 32}
                y={baseline - value * plotHeight + 11}
                textAnchor="end"
                fontFamily={fonts.number}
                fontSize="32"
                fill={colors.muted}
              >
                {Math.round(value * 100)}%
              </text>
            </g>
          ))}
          {[0, 0.5, 1, 1.5, 2].map((value) => (
            <g key={value}>
              <path
                d={`M${left + (value / 2) * plotWidth} ${baseline}v9`}
                stroke={colors.ink}
                strokeWidth="2"
              />
              <text
                x={left + (value / 2) * plotWidth}
                y={baseline + 45}
                textAnchor="middle"
                fontFamily={fonts.number}
                fontSize="32"
                fill={colors.muted}
              >
                {value}
              </text>
            </g>
          ))}
          <text
            x={left}
            y={top - 29}
            fontFamily={fonts.body}
            fontSize="32"
            fill={colors.muted}
          >
            尚未到来的概率
          </text>
          <path
            d={curve}
            fill="none"
            stroke={colors.teal}
            strokeWidth="6"
            strokeLinecap="round"
            clipPath="url(#poisson-survival-reveal)"
          />
          <g
            opacity={interpolate(
              frame,
              [12.5 * fps, 13.2 * fps],
              [0, 1],
              clamp,
            )}
          >
            <path
              d={`M${oneMinuteX} ${baseline}V${oneMinuteY}H${left}`}
              stroke={colors.coral}
              strokeWidth="3"
              strokeDasharray="8 7"
              fill="none"
            />
            <circle cx={oneMinuteX} cy={oneMinuteY} r="8" fill={colors.coral} />
            <text
              x={oneMinuteX + 24}
              y={oneMinuteY - 20}
              fontFamily={fonts.number}
              fontSize="36"
              fill={colors.coral}
            >
              {(survival(1) * 100).toFixed(1)}%
            </text>
          </g>
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="曲线横轴模型时间单位"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 575,
          top: 842,
          fontSize: 32,
          color: colors.muted,
        }}
      >
        模型等待时间 / 分钟
      </Interactive.Div>

      <Interactive.Div
        name="示例到来速率"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1410,
          top: 401,
          fontSize: 34,
          color: colors.muted,
        }}
      >
        λ = {ratePerMinute} 人 / 分钟
      </Interactive.Div>

      <Interactive.Div
        name="超过一分钟仍未到来的概率"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1410,
          top: 476,
          width: 380,
          opacity: interpolate(frame, [12.5 * fps, 13.3 * fps], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 32, color: colors.muted }}>
          超过 1 分钟仍未到来
        </div>
        <div
          style={{
            fontFamily: fonts.number,
            fontSize: 106,
            letterSpacing: -3,
            color: colors.coral,
            marginTop: 10,
          }}
        >
          {(survival(1) * 100).toFixed(1)}%
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="平均等待时间而非保证时间"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1410,
          top: 660,
          width: 380,
          opacity: interpolate(frame, [7.8 * fps, 8.6 * fps], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 34, color: colors.muted }}>
          平均等待 <span style={{ fontFamily: fonts.math }}>E[T]</span>
        </div>
        <div
          style={{
            fontFamily: fonts.number,
            fontSize: 108,
            lineHeight: 1.18,
            color: colors.teal,
          }}
        >
          {60 / ratePerMinute}
          <span
            style={{ marginLeft: 12, fontFamily: fonts.body, fontSize: 42 }}
          >
            秒
          </span>
        </div>
        <div style={{ fontSize: 32, color: colors.coral }}>平均，不是保证</div>
      </Interactive.Div>
    </Frame>
  );
};
