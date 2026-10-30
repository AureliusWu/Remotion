import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot45 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={44} />
      <Audio
        name="先从大量文本中学习旁白"
        src={staticFile("ai-history/12-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={44} />
    </AbsoluteFill>
  );
};
export const Shot45Composition = () => (
  <Composition
    id="AiHistoryShot1201"
    component={Shot45}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1834}
    defaultProps={{}}
  />
);
