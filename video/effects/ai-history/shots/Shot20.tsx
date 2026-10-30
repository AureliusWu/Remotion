import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot20 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={19} />
      <Audio
        name="从整洁房间走向真实世界有多远旁白"
        src={staticFile("ai-history/05-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={19} />
    </AbsoluteFill>
  );
};
export const Shot20Composition = () => (
  <Composition
    id="AiHistoryShot0504"
    component={Shot20}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1811}
    defaultProps={{}}
  />
);
