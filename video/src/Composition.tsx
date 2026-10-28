import type { FC } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type SmokeTestProps = {
  readonly headline: string;
  readonly subtitle: string;
  readonly accentColor: string;
};

export const SmokeTest: FC<SmokeTestProps> = ({
  headline,
  subtitle,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a101b",
        color: "#f3f6fa",
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Segoe UI", sans-serif',
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse at 78% 42%, #18483e 0%, transparent 52%), linear-gradient(#ffffff06 1px, transparent 1px), linear-gradient(90deg, #ffffff06 1px, transparent 1px)",
          backgroundSize: "auto, 80px 80px, 80px 80px",
        }}
      />

      <Interactive.Div
        name="Film label"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 140,
          top: 126,
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: 7,
          color: accentColor,
        }}
      >
        AURELIUSWU / REMOTION LAB
      </Interactive.Div>

      <Interactive.Div
        name="Headline"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 132,
          top: 244,
          width: 1120,
          fontSize: 152,
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: -6,
          whiteSpace: "pre-line",
          opacity: interpolate(frame, [0, 0.8 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0, 0.8 * fps],
            ["0px 42px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {headline}
      </Interactive.Div>

      <Interactive.Div
        name="Chinese subtitle"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 142,
          top: 646,
          fontSize: 48,
          fontWeight: 500,
          color: "#c5d3df",
          opacity: interpolate(frame, [0.6 * fps, 1.4 * fps], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          translate: interpolate(
            frame,
            [0.6 * fps, 1.4 * fps],
            ["0px 24px", "0px 0px"],
            {
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      >
        {subtitle}
      </Interactive.Div>

      <Interactive.Div
        name="Rotating mint frame"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 1330,
          top: 332,
          width: 330,
          height: 330,
          border: `22px solid ${accentColor}`,
          borderRadius: 72,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          rotate: interpolate(
            frame,
            [0, durationInFrames - 1],
            ["-20deg", "70deg"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          scale: interpolate(frame, [0, 1.2 * fps], [0.75, 1], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            output: "perceptual-scale",
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            width: 94,
            height: 94,
            backgroundColor: "#ffb887",
            borderRadius: 24,
          }}
        />
      </Interactive.Div>

      <Interactive.Div
        name="Video specification"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 142,
          top: 850,
          fontSize: 30,
          letterSpacing: 3,
          color: "#a4b3c3",
        }}
      >
        1920 × 1080 / 30 FPS / 6 SECONDS
      </Interactive.Div>

      <Interactive.Div
        name="Frame counter"
        premountFor={fps}
        style={{
          position: "absolute",
          right: 140,
          top: 850,
          fontSize: 30,
          fontVariantNumeric: "tabular-nums",
          color: accentColor,
        }}
      >
        FRAME {String(frame).padStart(3, "0")} / {durationInFrames - 1}
      </Interactive.Div>

      <div
        style={{
          position: "absolute",
          left: 140,
          bottom: 132,
          width: 1640,
          height: 8,
          backgroundColor: "#ffffff18",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Interactive.Div
          name="Timeline progress"
          premountFor={fps}
          style={{
            height: 8,
            width: interpolate(frame, [0, durationInFrames - 1], [0, 1640], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            backgroundColor: accentColor,
            borderRadius: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const SmokeTestComposition = () => (
  <Composition
    id="SmokeTest"
    component={SmokeTest}
    durationInFrames={180}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      headline: "Hello,\nRemotion.",
      subtitle: "视频生成 · 预览 · 渲染",
      accentColor: "#6ee7b7",
    }}
  />
);
