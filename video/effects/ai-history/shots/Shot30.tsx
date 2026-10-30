import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot30 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={29} />
      <Audio
        name="前向计算，反向求导旁白"
        src={staticFile("ai-history/08-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={29} />
    </AbsoluteFill>
  );
};
export const Shot30Composition = () => (
  <Composition
    id="AiHistoryShot0802"
    component={Shot30}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1788}
    defaultProps={{}}
  />
);
