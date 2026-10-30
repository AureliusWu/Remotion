import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot47 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={46} />
      <Audio
        name="规模化是一条经验规律旁白"
        src={staticFile("ai-history/12-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={46} />
    </AbsoluteFill>
  );
};
export const Shot47Composition = () => (
  <Composition
    id="AiHistoryShot1203"
    component={Shot47}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1831}
    defaultProps={{}}
  />
);
