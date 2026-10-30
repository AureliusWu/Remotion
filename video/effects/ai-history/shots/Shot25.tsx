import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot25 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={24} />
      <Audio
        name="麦辛：窄领域里的推理旁白"
        src={staticFile("ai-history/07-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={24} />
    </AbsoluteFill>
  );
};
export const Shot25Composition = () => (
  <Composition
    id="AiHistoryShot0701"
    component={Shot25}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1785}
    defaultProps={{}}
  />
);
