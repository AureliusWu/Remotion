import type { FC } from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { milestones } from "./data";
import { clamp, ease, numberFont, palette, SceneFrame } from "./shared";

const previousDecember = milestones[1];
const followingDecember = milestones[3];
const addedPeople = (
  followingDecember.people - previousDecember.people
).toFixed(2);

export const GrowthScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame
      index="03"
      chapter="2025年增量"
      title={`一年，增加${addedPeople}亿人`}
      source="CNNIC · 2025年12月用户规模及官方同比数据"
    >
      <Interactive.Div
        name="2024年底用户规模"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 200,
          top: 330,
          width: 550,
          opacity: interpolate(frame, [0.4 * fps, 1.1 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0.4 * fps, 1.3 * fps],
            ["0px 26px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        <div style={{ fontSize: 36, color: palette.muted }}>2024 年 12 月</div>
        <div
          style={{
            marginTop: 16,
            fontFamily: numberFont,
            fontSize: 160,
            fontWeight: 650,
            lineHeight: 1.2,
            letterSpacing: -5,
          }}
        >
          {previousDecember.label}
          <span
            style={{
              marginLeft: 16,
              fontSize: 40,
              letterSpacing: 0,
              fontWeight: 400,
            }}
          >
            亿人
          </span>
        </div>
        <div
          style={{
            marginTop: 22,
            height: 12,
            width: 440,
            backgroundColor: palette.pale,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              height: 12,
              width: (previousDecember.people / followingDecember.people) * 440,
              backgroundColor: palette.teal,
              borderRadius: 6,
            }}
          />
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="年度增量对比箭头"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 820,
          top: 445,
          opacity: interpolate(frame, [1.3 * fps, 1.9 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [1.3 * fps, 2.2 * fps],
            ["-26px 0px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        <svg width="190" height="88" aria-hidden>
          <path
            d="M8 44H170M137 12l33 32-33 32"
            fill="none"
            stroke={palette.red}
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="2025年底用户规模"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1160,
          top: 330,
          width: 550,
          opacity: interpolate(frame, [1.9 * fps, 2.6 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [1.9 * fps, 2.8 * fps],
            ["0px 26px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        <div style={{ fontSize: 36, color: palette.muted }}>2025 年 12 月</div>
        <div
          style={{
            marginTop: 16,
            fontFamily: numberFont,
            fontSize: 160,
            fontWeight: 650,
            lineHeight: 1.2,
            letterSpacing: -5,
            color: palette.red,
          }}
        >
          {followingDecember.label}
          <span
            style={{
              marginLeft: 16,
              fontSize: 40,
              letterSpacing: 0,
              fontWeight: 400,
            }}
          >
            亿人
          </span>
        </div>
        <div
          style={{
            marginTop: 22,
            height: 12,
            width: 440,
            backgroundColor: palette.pale,
            borderRadius: 6,
          }}
        >
          <div
            style={{
              height: 12,
              width: interpolate(frame, [2 * fps, 3.3 * fps], [0, 440], {
                ...clamp,
                easing: ease,
              }),
              backgroundColor: palette.red,
              borderRadius: 6,
            }}
          />
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="CNNIC官方同比增幅"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 200,
          right: 200,
          top: 677,
          height: 156,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `2px solid ${palette.line}`,
          opacity: interpolate(frame, [3.6 * fps, 4.3 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [3.6 * fps, 4.6 * fps],
            ["0px 20px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        <div style={{ fontSize: 38, color: palette.ink }}>
          官方公布的同比增长
        </div>
        {/* Use the published percentage; the displayed population counts are rounded. */}
        <div
          style={{
            fontFamily: numberFont,
            fontSize: 124,
            lineHeight: 1,
            fontWeight: 650,
            letterSpacing: -4,
            color: palette.red,
          }}
        >
          +141.7%
        </div>
      </Interactive.Div>

      <Interactive.Div
        name="年度统计区间"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 200,
          top: 875,
          fontSize: 34,
          color: palette.muted,
          opacity: interpolate(frame, [4.1 * fps, 4.8 * fps], [0, 1], clamp),
        }}
      >
        统计区间：2024年12月至2025年12月
      </Interactive.Div>
    </SceneFrame>
  );
};
