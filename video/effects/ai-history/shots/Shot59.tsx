import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot59 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={58} />
      <Audio
        name="未来需要更好的问题旁白"
        src={staticFile("ai-history/15-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={58} />
    </AbsoluteFill>
  );
};
export const Shot59Composition = () => (
  <Composition
    id="AiHistoryShot1503"
    component={Shot59}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1717}
    defaultProps={{}}
  />
);
