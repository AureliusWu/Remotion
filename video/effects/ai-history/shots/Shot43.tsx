import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot43 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={42} />
      <Audio
        name="一句话中的远近关系旁白"
        src={staticFile("ai-history/11-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={42} />
    </AbsoluteFill>
  );
};
export const Shot43Composition = () => (
  <Composition
    id="AiHistoryShot1103"
    component={Shot43}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1803}
    defaultProps={{}}
  />
);
