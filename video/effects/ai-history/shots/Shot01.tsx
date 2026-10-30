import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot01 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={0} />
      <Audio
        name="一块屏幕，几个不同的问题旁白"
        src={staticFile("ai-history/01-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={0} />
    </AbsoluteFill>
  );
};
export const Shot01Composition = () => (
  <Composition
    id="AiHistoryShot0101"
    component={Shot01}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1792}
    defaultProps={{}}
  />
);
