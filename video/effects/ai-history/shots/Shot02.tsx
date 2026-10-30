import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot02 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={1} />
      <Audio
        name="把大问题拆成可以检查的任务旁白"
        src={staticFile("ai-history/01-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={1} />
    </AbsoluteFill>
  );
};
export const Shot02Composition = () => (
  <Composition
    id="AiHistoryShot0102"
    component={Shot02}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1810}
    defaultProps={{}}
  />
);
