import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot14 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={13} />
      <Audio
        name="一条会移动的分界线旁白"
        src={staticFile("ai-history/04-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={13} />
    </AbsoluteFill>
  );
};
export const Shot14Composition = () => (
  <Composition
    id="AiHistoryShot0402"
    component={Shot14}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1845}
    defaultProps={{}}
  />
);
