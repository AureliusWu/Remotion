import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const palette = {
  paper: "#f4f1e9",
  ink: "#19343d",
  muted: "#6c7b7d",
  red: "#df553c",
  teal: "#46847d",
  line: "#cbd1c9",
  pale: "#e3e7dc",
  white: "#fffdf6",
};
export const font = '"Microsoft YaHei", "Segoe UI", sans-serif';
export const numberFont = '"Bahnschrift", "Segoe UI", sans-serif';
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);

type FrameProps = {
  chapter: string;
  index: string;
  title?: string;
  source: string;
  children: ReactNode;
};

export const SceneFrame: React.FC<FrameProps> = ({
  chapter,
  index,
  title,
  source,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.paper,
        color: palette.ink,
        fontFamily: font,
        overflow: "hidden",
      }}
    >
      <svg
        width="1920"
        height="1080"
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <pattern
            id={`genai-grid-${index}`}
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill={palette.ink} opacity="0.07" />
          </pattern>
        </defs>
        <rect width="1920" height="1080" fill={`url(#genai-grid-${index})`} />
        <path
          d="M120 125H1800 M120 945H1800"
          stroke={palette.line}
          strokeWidth="2"
        />
      </svg>
      <Interactive.Div
        name="栏目与章节"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 65,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 26,
          letterSpacing: 3,
        }}
      >
        <div>
          <span style={{ color: palette.red, fontWeight: 800 }}>●</span>{" "}
          中国生成式 AI · 用户观察
        </div>
        <div style={{ color: palette.muted }}>
          {index} / 06 {chapter}
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="本章内容"
        premountFor={fps}
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [0, 0.45 * fps], [0, 1], {
            ...clamp,
            easing: ease,
          }),
          translate: interpolate(
            frame,
            [0, 0.8 * fps],
            ["0px 22px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        {title ? (
          <div
            style={{
              position: "absolute",
              left: 120,
              top: 163,
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
        ) : null}
        {children}
      </Interactive.Div>
      <Interactive.Div
        name="统计来源"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          bottom: 61,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 23,
          color: palette.muted,
        }}
      >
        <div style={{ maxWidth: 1280 }}>{source}</div>
        <div style={{ fontFamily: numberFont, whiteSpace: "nowrap" }}>
          资料检索 2026-10-29
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const Kicker: React.FC<{
  children: ReactNode;
  style?: CSSProperties;
}> = ({ children, style }) => (
  <div
    style={{ fontSize: 27, letterSpacing: 4, color: palette.muted, ...style }}
  >
    {children}
  </div>
);
