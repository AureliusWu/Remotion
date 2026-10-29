import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// A small diagnostic composition, retained for future environment checks.
export const EnvironmentTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#102530",
        color: "#f5f1e8",
        fontFamily: '"Microsoft YaHei", "Segoe UI", sans-serif',
        padding: 120,
      }}
    >
      <Audio
        name="Quiet diagnostic tone"
        src={staticFile("environment-test/tone.wav")}
        volume={0.15}
        premountFor={fps}
      />
      <h1 style={{ fontSize: 88, margin: "0 0 28px" }}>Remotion 环境测试</h1>
      <p style={{ fontSize: 42, color: "#b6cbd1", margin: 0 }}>
        编译 · 中文字体 · 逐帧动画 · 音频 · MP4
      </p>
      <Interactive.Div
        name="Moving diagnostic square"
        premountFor={fps}
        style={{
          position: "absolute",
          top: 470,
          left: 120,
          width: 160,
          height: 160,
          backgroundColor: "#88e0b7",
          borderRadius: 28,
          translate: interpolate(
            frame,
            [0, durationInFrames - 1],
            ["0px 0px", "1520px 0px"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          rotate: interpolate(
            frame,
            [0, durationInFrames - 1],
            ["0deg", "180deg"],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
        }}
      />
      <div
        style={{ position: "absolute", bottom: 150, left: 120, fontSize: 36 }}
      >
        1920 × 1080 / 60 FPS / 4 秒 / 测试用途
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 150,
          right: 120,
          fontSize: 36,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        FRAME {String(frame).padStart(3, "0")} / {durationInFrames - 1}
      </div>
    </AbsoluteFill>
  );
};

export const EnvironmentTestComposition = () => (
  <Composition
    id="EnvironmentTest"
    component={EnvironmentTest}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={240}
    defaultProps={{}}
  />
);
