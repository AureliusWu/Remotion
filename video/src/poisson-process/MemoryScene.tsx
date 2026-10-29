import type { FC } from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ratePerMinute, survival } from "./math";
import { clamp, colors, fonts, Frame } from "./shared";

const elapsedMinutes = 1;
const remainingMinutes = 0.5;
const freshProbability = survival(remainingMinutes);
const conditionalProbability =
  survival(elapsedMinutes + remainingMinutes) / survival(elapsedMinutes);

export const MemoryScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Frame
      number="06"
      chapter="无记忆性"
      title="已经等过，不会积攒好运"
      note="图示为模型时间；无记忆性描述尚未到来条件下的剩余等待，不是对人的记忆或情感作结论。"
    >
      <Interactive.Div
        name="指数分布无记忆性公式"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 292,
          textAlign: "center",
          fontFamily: fonts.math,
          fontSize: 76,
          opacity: interpolate(frame, [0.6 * fps, 1.4 * fps], [0, 1], clamp),
        }}
      >
        P(T &gt; s+t | T &gt; s) = P(T &gt; t)
      </Interactive.Div>

      <Interactive.Div
        name="无记忆性比较参数"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 170,
          top: 410,
          display: "flex",
          gap: 55,
          fontSize: 32,
          color: colors.muted,
          opacity: interpolate(frame, [1.8 * fps, 2.5 * fps], [0, 1], clamp),
        }}
      >
        <span>λ = {ratePerMinute} 人 / 分钟</span>
        <span>s = {elapsedMinutes} 分钟</span>
        <span>t = {remainingMinutes * 60} 秒</span>
      </Interactive.Div>

      <Interactive.Div
        name="已经等待且始终未到来的条件"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 170,
          top: 498,
          width: 480,
          opacity: interpolate(frame, [3 * fps, 3.8 * fps], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 600 }}>已等 1 分钟</div>
        <div style={{ marginTop: 18, fontSize: 32, color: colors.coral }}>
          条件：这段时间一直无人到来
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="已等待后剩余三十秒的模型时间轴"
        premountFor={fps}
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [3.5 * fps, 4.2 * fps], [0, 1], clamp),
        }}
      >
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <path d="M700 579H1360" stroke={colors.line} strokeWidth="3" />
          <rect
            x="700"
            y="565"
            width={interpolate(frame, [4 * fps, 7 * fps], [0, 420], clamp)}
            height="28"
            rx="4"
            fill={colors.muted}
            opacity="0.35"
          />
          <rect
            x="1120"
            y="565"
            width={interpolate(frame, [8 * fps, 9.5 * fps], [0, 210], clamp)}
            height="28"
            rx="4"
            fill={colors.teal}
          />
          <circle
            cx="1120"
            cy="579"
            r="8"
            fill={colors.paper}
            stroke={colors.coral}
            strokeWidth="4"
          />
          <text
            x="910"
            y="537"
            textAnchor="middle"
            fontSize="32"
            fill={colors.muted}
            fontFamily={fonts.body}
          >
            1 分钟 · 无到来
          </text>
          <text
            x="1225"
            y="537"
            textAnchor="middle"
            fontSize="32"
            fill={colors.teal}
            fontFamily={fonts.body}
            opacity={interpolate(frame, [8 * fps, 8.6 * fps], [0, 1], clamp)}
          >
            再等 30 秒
          </text>
          <text
            x="1120"
            y="635"
            textAnchor="middle"
            fontSize="32"
            fill={colors.coral}
            fontFamily={fonts.body}
          >
            现在
          </text>
          <path
            d="M1120 646V723"
            stroke={colors.line}
            strokeWidth="2"
            strokeDasharray="5 7"
          />
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="从现在开始的全新等待"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 170,
          top: 690,
          width: 480,
          opacity: interpolate(frame, [10 * fps, 10.8 * fps], [0, 1], clamp),
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 600 }}>从现在重新开始等</div>
        <div style={{ marginTop: 18, fontSize: 32, color: colors.muted }}>
          比较相同的剩余 30 秒
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="新等待三十秒的模型时间轴"
        premountFor={fps}
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [10.3 * fps, 11 * fps], [0, 1], clamp),
        }}
      >
        <svg
          width="1920"
          height="1080"
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <path d="M1120 762H1360" stroke={colors.line} strokeWidth="3" />
          <rect
            x="1120"
            y="748"
            width={interpolate(frame, [10.5 * fps, 12 * fps], [0, 210], clamp)}
            height="28"
            rx="4"
            fill={colors.teal}
          />
          <circle
            cx="1120"
            cy="762"
            r="8"
            fill={colors.paper}
            stroke={colors.coral}
            strokeWidth="4"
          />
          <text
            x="1225"
            y="720"
            textAnchor="middle"
            fontSize="32"
            fill={colors.teal}
            fontFamily={fonts.body}
          >
            等待 30 秒
          </text>
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="相同的条件尾概率与新等待尾概率"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1420,
          top: 470,
          width: 380,
          opacity: interpolate(frame, [13 * fps, 13.8 * fps], [0, 1], clamp),
        }}
      >
        <div
          style={{ fontSize: 32, color: colors.muted, whiteSpace: "nowrap" }}
        >
          再等超过 30 秒的概率
        </div>
        <div
          style={{
            marginTop: 23,
            fontFamily: fonts.number,
            fontSize: 88,
            lineHeight: 1,
            letterSpacing: -3,
            color: colors.teal,
          }}
        >
          {(conditionalProbability * 100).toFixed(1)}%
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.math,
            fontSize: 36,
            color: colors.muted,
          }}
        >
          e
          <sup style={{ fontSize: "0.65em" }}>
            −{ratePerMinute * remainingMinutes}
          </sup>
        </div>
        <div
          style={{
            marginTop: 58,
            fontFamily: fonts.number,
            fontSize: 88,
            lineHeight: 1,
            letterSpacing: -3,
            color: colors.teal,
          }}
        >
          {(freshProbability * 100).toFixed(1)}%
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: fonts.math,
            fontSize: 36,
            color: colors.muted,
          }}
        >
          e
          <sup style={{ fontSize: "0.65em" }}>
            −{ratePerMinute * remainingMinutes}
          </sup>
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="无记忆性只比较剩余等待"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 700,
          top: 836,
          fontSize: 32,
          color: colors.teal,
          opacity: interpolate(frame, [14.5 * fps, 15.2 * fps], [0, 1], clamp),
        }}
      >
        相同速率，相同剩余时长，相同尾概率。
      </Interactive.Div>
    </Frame>
  );
};
