import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot03 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={2} />
      <Audio
        name="答案之外，还要看条件旁白"
        src={staticFile("ai-history/01-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={2} />
    </AbsoluteFill>
  );
};
export const Shot03Composition = () => (
  <Composition
    id="AiHistoryShot0103"
    component={Shot03}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1811}
    defaultProps={{}}
  />
);
