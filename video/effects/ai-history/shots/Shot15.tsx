import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot15 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={14} />
      <Audio
        name="另一条路：寻找一条证明旁白"
        src={staticFile("ai-history/04-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={14} />
    </AbsoluteFill>
  );
};
export const Shot15Composition = () => (
  <Composition
    id="AiHistoryShot0403"
    component={Shot15}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1725}
    defaultProps={{}}
  />
);
