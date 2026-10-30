import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot41 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={40} />
      <Audio
        name="围棋中的学习与搜索旁白"
        src={staticFile("ai-history/11-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={40} />
    </AbsoluteFill>
  );
};
export const Shot41Composition = () => (
  <Composition
    id="AiHistoryShot1101"
    component={Shot41}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1742}
    defaultProps={{}}
  />
);
