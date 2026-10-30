import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot55 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={54} />
      <Audio
        name="平均值也会遮住人旁白"
        src={staticFile("ai-history/14-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={54} />
    </AbsoluteFill>
  );
};
export const Shot55Composition = () => (
  <Composition
    id="AiHistoryShot1403"
    component={Shot55}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1795}
    defaultProps={{}}
  />
);
