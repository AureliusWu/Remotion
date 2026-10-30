import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot44 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={43} />
      <Audio
        name="一种架构，多种任务旁白"
        src={staticFile("ai-history/11-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={43} />
    </AbsoluteFill>
  );
};
export const Shot44Composition = () => (
  <Composition
    id="AiHistoryShot1104"
    component={Shot44}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1820}
    defaultProps={{}}
  />
);
