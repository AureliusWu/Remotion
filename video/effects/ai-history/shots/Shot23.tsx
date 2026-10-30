import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot23 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={22} />
      <Audio
        name="英国的莱特希尔报告与争论旁白"
        src={staticFile("ai-history/06-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={22} />
    </AbsoluteFill>
  );
};
export const Shot23Composition = () => (
  <Composition
    id="AiHistoryShot0603"
    component={Shot23}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1799}
    defaultProps={{}}
  />
);
