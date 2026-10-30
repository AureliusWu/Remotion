import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot09 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={8} />
      <Audio
        name="先有一份提案旁白"
        src={staticFile("ai-history/03-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={8} />
    </AbsoluteFill>
  );
};
export const Shot09Composition = () => (
  <Composition
    id="AiHistoryShot0301"
    component={Shot09}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1788}
    defaultProps={{}}
  />
);
