import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot49 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={48} />
      <Audio
        name="生成器与判别器旁白"
        src={staticFile("ai-history/13-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={48} />
    </AbsoluteFill>
  );
};
export const Shot49Composition = () => (
  <Composition
    id="AiHistoryShot1301"
    component={Shot49}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1764}
    defaultProps={{}}
  />
);
