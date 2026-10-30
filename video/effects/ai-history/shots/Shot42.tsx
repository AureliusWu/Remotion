import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot42 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={41} />
      <Audio
        name="棋盘之外还有距离旁白"
        src={staticFile("ai-history/11-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={41} />
    </AbsoluteFill>
  );
};
export const Shot42Composition = () => (
  <Composition
    id="AiHistoryShot1102"
    component={Shot42}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1835}
    defaultProps={{}}
  />
);
