import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot58 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={57} />
      <Audio
        name="责任不能留在黑箱里旁白"
        src={staticFile("ai-history/15-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={57} />
    </AbsoluteFill>
  );
};
export const Shot58Composition = () => (
  <Composition
    id="AiHistoryShot1502"
    component={Shot58}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1846}
    defaultProps={{}}
  />
);
