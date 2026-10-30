import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot32 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={31} />
      <Audio
        name="方法回归，困难并未消失旁白"
        src={staticFile("ai-history/08-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={31} />
    </AbsoluteFill>
  );
};
export const Shot32Composition = () => (
  <Composition
    id="AiHistoryShot0804"
    component={Shot32}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1746}
    defaultProps={{}}
  />
);
