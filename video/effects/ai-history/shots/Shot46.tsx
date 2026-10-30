import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot46 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={45} />
      <Audio
        name="从填空理解上下文旁白"
        src={staticFile("ai-history/12-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={45} />
    </AbsoluteFill>
  );
};
export const Shot46Composition = () => (
  <Composition
    id="AiHistoryShot1202"
    component={Shot46}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1776}
    defaultProps={{}}
  />
);
