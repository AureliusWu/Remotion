import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot04 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={3} />
      <Audio
        name="沿着问题，而不是神话前进旁白"
        src={staticFile("ai-history/01-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={3} />
    </AbsoluteFill>
  );
};
export const Shot04Composition = () => (
  <Composition
    id="AiHistoryShot0104"
    component={Shot04}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1787}
    defaultProps={{}}
  />
);
