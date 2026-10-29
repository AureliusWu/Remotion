import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CityArtwork } from "./CityArtwork";
import { clamp, colors, fonts, Frame } from "./shared";

export const EncountersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Frame number="01" chapter="从一扇门开始" title="" dark>
      <Interactive.Div
        name="夜色中的书店"
        premountFor={fps}
        style={{ position: "absolute", inset: 0 }}
      >
        <CityArtwork />
      </Interactive.Div>
      <Interactive.Div
        name="主片名"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 120,
          top: 246,
          opacity: interpolate(frame, [0.3 * fps, 2 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0.3 * fps, 2 * fps],
            ["0px 28px", "0px 0px"],
            clamp,
          ),
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 10,
            color: colors.gold,
            marginBottom: 27,
          }}
        >
          A MATHEMATICS OF ENCOUNTERS
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 126,
            lineHeight: 1.4,
            letterSpacing: 7,
          }}
        >
          等待与偶遇
        </div>
        <div style={{ fontSize: 50, marginTop: 28, letterSpacing: 4 }}>
          三分钟，理解泊松过程
        </div>
        <div
          style={{
            width: 90,
            height: 4,
            marginTop: 50,
            backgroundColor: colors.coral,
          }}
        />
        <div
          style={{
            fontSize: 31,
            lineHeight: 1.8,
            color: "#aebfb5",
            marginTop: 32,
          }}
        >
          偶然来到时，
          <br />
          时间有什么形状？
        </div>
      </Interactive.Div>
    </Frame>
  );
};
