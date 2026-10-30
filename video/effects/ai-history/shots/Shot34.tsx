import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot34 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={33} />
      <Audio
        name="支持向量机的间隔旁白"
        src={staticFile("ai-history/09-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={33} />
    </AbsoluteFill>
  );
};
export const Shot34Composition = () => (
  <Composition
    id="AiHistoryShot0902"
    component={Shot34}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1781}
    defaultProps={{}}
  />
);
