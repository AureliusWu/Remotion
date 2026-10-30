import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot28 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={27} />
      <Audio
        name="繁荣之后，维护账单浮现旁白"
        src={staticFile("ai-history/07-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={27} />
    </AbsoluteFill>
  );
};
export const Shot28Composition = () => (
  <Composition
    id="AiHistoryShot0704"
    component={Shot28}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1855}
    defaultProps={{}}
  />
);
