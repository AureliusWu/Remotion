import type { FC } from "react";
import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { milestones } from "./data";
import { clamp, ease, font, numberFont, palette, SceneFrame } from "./shared";

export const HistoryScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneFrame
      index="02"
      chapter="公开记录"
      title="用户规模，一路走高"
      source="CNNIC · 2024—2026 年公开报告"
    >
      <Interactive.Div
        name="规模图表单位"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 300,
          top: 296,
          fontSize: 32,
          color: palette.muted,
        }}
      >
        用户规模 / 亿人
      </Interactive.Div>

      <Interactive.Div
        name="用户规模历史柱状图"
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
            <pattern
              id="history-lower-bound-hatch"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <rect width="14" height="14" fill={palette.red} />
              <path
                d="M-4 4L4-4M0 14L14 0M10 18L18 10"
                stroke={palette.paper}
                strokeWidth="2"
                opacity="0.24"
              />
            </pattern>
          </defs>

          {[0, 2, 4, 6].map((tick) => (
            <g key={tick}>
              <path
                d={`M300 ${790 - (tick / 8) * 420}H1680`}
                stroke={tick === 0 ? palette.ink : palette.line}
                strokeWidth={tick === 0 ? 3 : 2}
                opacity={tick === 0 ? 0.82 : 0.66}
              />
              <text
                x="262"
                y={802 - (tick / 8) * 420}
                textAnchor="end"
                fill={palette.muted}
                fontFamily={numberFont}
                fontSize="32"
              >
                {tick}
              </text>
            </g>
          ))}

          {milestones.map((milestone, index) => {
            const start = (0.65 + index) * fps;
            const height = interpolate(
              frame,
              [start, start + 1.2 * fps],
              [0, (milestone.people / 8) * 420],
              { ...clamp, easing: ease },
            );
            const x = 300 + index * 292;
            const top = 790 - height;
            const reveal = interpolate(
              frame,
              [start + 0.4 * fps, start + 0.95 * fps],
              [0, 1],
              clamp,
            );

            return (
              <g key={milestone.period}>
                <rect
                  x={x}
                  y={top}
                  width="184"
                  height={height}
                  rx="4"
                  fill={
                    milestone.lowerBound
                      ? "url(#history-lower-bound-hatch)"
                      : palette.teal
                  }
                />
                <text
                  x={x + 92}
                  y={top - 18}
                  textAnchor="middle"
                  fill={milestone.lowerBound ? palette.red : palette.ink}
                  fontFamily={numberFont}
                  fontSize="72"
                  fontWeight="650"
                  opacity={reveal}
                >
                  {milestone.label}
                </text>
                <text
                  x={x + 92}
                  y="846"
                  textAnchor="middle"
                  fill={palette.ink}
                  fontFamily={font}
                  fontSize="34"
                  opacity={interpolate(
                    frame,
                    [start, start + 0.45 * fps],
                    [0, 1],
                    clamp,
                  )}
                >
                  {milestone.period}
                </text>
                {index === 0 ? (
                  <text
                    x={x + 92}
                    y="760"
                    textAnchor="middle"
                    fill={palette.white}
                    fontFamily={font}
                    fontSize="25"
                    opacity={reveal}
                  >
                    历史参考
                  </text>
                ) : null}
                {milestone.lowerBound ? (
                  <g
                    opacity={interpolate(
                      frame,
                      [start + fps, start + 1.4 * fps],
                      [0, 1],
                      clamp,
                    )}
                    fill="none"
                    stroke={palette.red}
                    strokeWidth="4"
                  >
                    <path
                      d={`M${x} ${top}H${x + 184}`}
                      stroke={palette.paper}
                      strokeWidth="8"
                    />
                    <path
                      d={`M${x} ${top}H${x + 184}`}
                      strokeDasharray="10 8"
                    />
                    <path
                      d={`M${x + 202} ${top + 5}V${top - 55}m-10 12 10-12 10 12`}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </Interactive.Div>

      <Interactive.Div
        name="末列下限说明"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 300,
          top: 886,
          fontSize: 32,
          color: palette.muted,
          opacity: interpolate(frame, [5.9 * fps, 6.5 * fps], [0, 1], clamp),
        }}
      >
        <span style={{ color: palette.red }}>↑</span>{" "}
        末列按7亿下限示意；实际规模高于柱高。
      </Interactive.Div>
    </SceneFrame>
  );
};
