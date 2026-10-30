import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot37 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={36} />
      <Audio
        name="深蓝赢下的是棋局旁白"
        src={staticFile("ai-history/10-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={36} />
    </AbsoluteFill>
  );
};
export const Shot37Composition = () => (
  <Composition
    id="AiHistoryShot1001"
    component={Shot37}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1767}
    defaultProps={{}}
  />
);
