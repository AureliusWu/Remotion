import {
  AbsoluteFill,
  Composition,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CoastalBackdrop } from "./CoastalBackdrop";
import { PelicanCyclist } from "./PelicanCyclist";

type Props = { bikeColor: string; scarfColor: string };

export const PelicanRide: React.FC<Props> = ({ bikeColor, scarfColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#f7ebcf", overflow: "hidden" }}>
      <Interactive.Div
        name="海岸视差背景"
        premountFor={fps}
        style={{ position: "absolute", inset: 0 }}
      >
        <CoastalBackdrop />
      </Interactive.Div>
      <PelicanCyclist bikeColor={bikeColor} scarfColor={scarfColor} />
      <Interactive.Div
        name="海风骑行片名"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 142,
          top: 153,
          color: "#506353",
          fontFamily: '"Microsoft YaHei", "Segoe UI", sans-serif',
          opacity: interpolate(
            frame,
            [0, 0.8 * fps, 3 * fps, 4 * fps],
            [0, 1, 1, 0],
            { extrapolateRight: "clamp" },
          ),
          translate: interpolate(frame, [0, 1 * fps], ["0px 18px", "0px 0px"], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 7, marginBottom: 22 }}>
          A LITTLE COASTAL JOY
        </div>
        <div style={{ fontSize: 82, fontWeight: 500, letterSpacing: 7 }}>
          去吹海风
        </div>
        <div
          style={{
            width: 72,
            height: 5,
            backgroundColor: "#cf8460",
            marginTop: 32,
            borderRadius: 3,
          }}
        />
      </Interactive.Div>
    </AbsoluteFill>
  );
};

export const PelicanRideComposition = () => (
  <Composition
    id="PelicanRide"
    component={PelicanRide}
    durationInFrames={900}
    fps={60}
    width={1920}
    height={1080}
    defaultProps={{ bikeColor: "#75b8a4", scarfColor: "#d98160" }}
  />
);
