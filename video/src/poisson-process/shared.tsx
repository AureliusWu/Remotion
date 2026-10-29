import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const colors = {
  paper: "#f1e9d8",
  ink: "#193b43",
  teal: "#397c7b",
  coral: "#db7754",
  gold: "#d6b16c",
  muted: "#758987",
  line: "#c6cbbb",
  pale: "#e1e0ca",
  night: "#102e39",
  light: "#fff6e2",
};
export const fonts = {
  body: '"Microsoft YaHei", "Segoe UI", sans-serif',
  serif: '"SimSun", "Georgia", serif',
  number: '"Bahnschrift", "Segoe UI", sans-serif',
  math: '"Cambria Math", "Times New Roman", serif',
};
export const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type FrameProps = {
  number: string;
  chapter: string;
  title: string;
  children: ReactNode;
  note?: string;
  dark?: boolean;
};
export const Frame: React.FC<FrameProps> = ({
  number,
  chapter,
  title,
  children,
  note,
  dark = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? colors.night : colors.paper,
        color: dark ? colors.light : colors.ink,
        fontFamily: fonts.body,
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
            id={`poisson-paper-${number}`}
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="9"
              cy="12"
              r="0.8"
              fill={dark ? colors.light : colors.ink}
              opacity="0.09"
            />
            <path
              d="M30 38h5"
              stroke={dark ? colors.light : colors.ink}
              opacity="0.035"
            />
          </pattern>
        </defs>
        <rect
          width="1920"
          height="1080"
          fill={`url(#poisson-paper-${number})`}
        />
      </svg>
      <Interactive.Div
        name="章节与片名"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          top: 60,
          right: 120,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 25,
          letterSpacing: 3,
          opacity: 0.7,
        }}
      >
        <span>等待与偶遇 / 泊松过程</span>
        <span>
          {number} / 09 · {chapter}
        </span>
      </Interactive.Div>
      <Interactive.Div
        name="章节标题"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          top: 150,
          fontSize: 78,
          fontWeight: 600,
          letterSpacing: -1,
          maxWidth: 1670,
          opacity: interpolate(frame, [0, 0.55 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0, 0.7 * fps],
            ["0px 24px", "0px 0px"],
            clamp,
          ),
        }}
      >
        {title}
      </Interactive.Div>
      <Interactive.Div
        name="图解内容"
        premountFor={fps}
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(frame, [0.25 * fps, 1 * fps], [0, 1], clamp),
        }}
      >
        {children}
      </Interactive.Div>
      {note ? (
        <Interactive.Div
          name="图解口径"
          premountFor={fps}
          style={{
            position: "absolute",
            left: 120,
            top: 896,
            right: 120,
            textAlign: "center",
            fontSize: 25,
            color: dark ? "#b2c2bc" : colors.muted,
          }}
        >
          {note}
        </Interactive.Div>
      ) : null}
    </AbsoluteFill>
  );
};

export const BigFormula: React.FC<{
  children: ReactNode;
  top?: number;
  size?: number;
}> = ({ children, top = 330, size = 96 }) => (
  <div
    style={{
      position: "absolute",
      top,
      left: 120,
      right: 120,
      textAlign: "center",
      fontFamily: fonts.math,
      fontSize: size,
      color: colors.ink,
    }}
  >
    {children}
  </div>
);
