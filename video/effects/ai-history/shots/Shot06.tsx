import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot06 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={5} />
      <Audio
        name="神经元成为逻辑单元旁白"
        src={staticFile("ai-history/02-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={5} />
    </AbsoluteFill>
  );
};
export const Shot06Composition = () => (
  <Composition
    id="AiHistoryShot0202"
    component={Shot06}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1793}
    defaultProps={{}}
  />
);
