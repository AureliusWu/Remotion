import type { FC } from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp, colors, fonts, Frame } from "./shared";

export const AssumptionsScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Frame
      number="03"
      chapter="齐次模型的条件"
      title="理想模型，有三个前提"
      note="其中 ΔN = N(t+h) − N(t)，h → 0；o(h) / h → 0。"
    >
      <Interactive.Div
        name="不相交区间的独立增量"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 305,
          height: 142,
          borderBottom: `2px solid ${colors.line}`,
          opacity: interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0.8 * fps, 1.7 * fps],
            ["0px 18px", "0px 0px"],
            clamp,
          ),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 2,
            fontFamily: fonts.number,
            fontSize: 62,
            color: colors.coral,
          }}
        >
          01
        </div>
        <div
          style={{
            position: "absolute",
            left: 125,
            top: 1,
            fontSize: 44,
            fontWeight: 600,
          }}
        >
          不相交区间，增量独立
        </div>
        <div
          style={{
            position: "absolute",
            left: 125,
            top: 70,
            fontSize: 32,
            color: colors.muted,
          }}
        >
          比较各段时间内的到来次数
        </div>
        <svg
          width="650"
          height="135"
          style={{ position: "absolute", right: 0, top: -6 }}
          aria-hidden
        >
          <rect
            x="25"
            y="26"
            width="252"
            height="58"
            rx="7"
            fill={colors.teal}
            opacity="0.14"
          />
          <rect
            x="344"
            y="26"
            width="252"
            height="58"
            rx="7"
            fill={colors.coral}
            opacity="0.14"
          />
          <path d="M25 84H596" stroke={colors.ink} strokeWidth="2" />
          <path d="M277 76v16m67-16v16" stroke={colors.ink} strokeWidth="2" />
          <g fill={colors.teal}>
            <circle cx="85" cy="55" r="8" />
            <circle cx="206" cy="55" r="8" />
          </g>
          <g fill={colors.coral}>
            <circle cx="395" cy="55" r="8" />
            <circle cx="448" cy="55" r="8" />
            <circle cx="548" cy="55" r="8" />
          </g>
          <text
            x="151"
            y="126"
            textAnchor="middle"
            fontSize="32"
            fill={colors.muted}
            fontFamily={fonts.body}
          >
            区间 A
          </text>
          <text
            x="470"
            y="126"
            textAnchor="middle"
            fontSize="32"
            fill={colors.muted}
            fontFamily={fonts.body}
          >
            区间 B
          </text>
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="相同时长的平稳增量"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 478,
          height: 142,
          borderBottom: `2px solid ${colors.line}`,
          opacity: interpolate(frame, [5.1 * fps, 5.8 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [5.1 * fps, 6 * fps],
            ["0px 18px", "0px 0px"],
            clamp,
          ),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 2,
            fontFamily: fonts.number,
            fontSize: 62,
            color: colors.coral,
          }}
        >
          02
        </div>
        <div
          style={{
            position: "absolute",
            left: 125,
            top: 1,
            fontSize: 44,
            fontWeight: 600,
          }}
        >
          同样长的窗口，同样的分布
        </div>
        <div
          style={{
            position: "absolute",
            left: 125,
            top: 70,
            fontSize: 32,
            color: colors.muted,
          }}
        >
          只看时长，不随窗口起点改变
        </div>
        <svg
          width="650"
          height="135"
          style={{ position: "absolute", right: 0, top: -6 }}
          aria-hidden
        >
          <path d="M25 70H277m67 0H596" stroke={colors.teal} strokeWidth="4" />
          <path
            d="M25 59v22m252-22v22m67-22v22m252-22v22"
            stroke={colors.ink}
            strokeWidth="2"
          />
          <text
            x="151"
            y="49"
            textAnchor="middle"
            fontSize="40"
            fill={colors.teal}
            fontFamily={fonts.math}
          >
            h
          </text>
          <text
            x="470"
            y="49"
            textAnchor="middle"
            fontSize="40"
            fill={colors.teal}
            fontFamily={fonts.math}
          >
            h
          </text>
          <text
            x="25"
            y="124"
            textAnchor="middle"
            fontSize="32"
            fill={colors.muted}
            fontFamily={fonts.math}
          >
            t
          </text>
          <text
            x="277"
            y="124"
            textAnchor="middle"
            fontSize="32"
            fill={colors.muted}
            fontFamily={fonts.math}
          >
            t+h
          </text>
          <text
            x="344"
            y="124"
            textAnchor="middle"
            fontSize="32"
            fill={colors.muted}
            fontFamily={fonts.math}
          >
            s
          </text>
          <text
            x="596"
            y="124"
            textAnchor="middle"
            fontSize="32"
            fill={colors.muted}
            fontFamily={fonts.math}
          >
            s+h
          </text>
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="短时间内的一次与多次到来概率"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 651,
          height: 148,
          opacity: interpolate(frame, [9.6 * fps, 10.3 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [9.6 * fps, 10.5 * fps],
            ["0px 18px", "0px 0px"],
            clamp,
          ),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 2,
            fontFamily: fonts.number,
            fontSize: 62,
            color: colors.coral,
          }}
        >
          03
        </div>
        <div
          style={{
            position: "absolute",
            left: 125,
            top: 1,
            fontSize: 44,
            fontWeight: 600,
          }}
        >
          把观察窗口，缩到很短
        </div>
        <div
          style={{
            position: "absolute",
            left: 125,
            top: 70,
            fontSize: 32,
            color: colors.muted,
          }}
        >
          两次及以上并非不可能，只是更稀少
        </div>
        <div
          style={{
            position: "absolute",
            right: 25,
            top: -3,
            width: 600,
            fontFamily: fonts.math,
            fontSize: 45,
            lineHeight: 1.55,
          }}
        >
          <div>P(ΔN = 1) = λh + o(h)</div>
          <div style={{ color: colors.coral }}>P(ΔN ≥ 2) = o(h)</div>
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="从零开始的计数约定"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 245,
          top: 830,
          fontSize: 34,
          opacity: interpolate(frame, [14 * fps, 14.7 * fps], [0, 1], clamp),
        }}
      >
        起点约定：
        <span style={{ fontFamily: fonts.math, color: colors.teal }}>
          N(0) = 0
        </span>
      </Interactive.Div>
    </Frame>
  );
};
