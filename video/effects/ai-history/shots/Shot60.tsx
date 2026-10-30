import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot60 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={59} />
      <Audio
        name="历史继续，由人参与旁白"
        src={staticFile("ai-history/15-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={59} />
    </AbsoluteFill>
  );
};
export const Shot60Composition = () => (
  <Composition
    id="AiHistoryShot1504"
    component={Shot60}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1827}
    defaultProps={{}}
  />
);
