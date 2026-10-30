import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot50 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={49} />
      <Audio
        name="从噪声一步步重建旁白"
        src={staticFile("ai-history/13-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={49} />
    </AbsoluteFill>
  );
};
export const Shot50Composition = () => (
  <Composition
    id="AiHistoryShot1302"
    component={Shot50}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1827}
    defaultProps={{}}
  />
);
