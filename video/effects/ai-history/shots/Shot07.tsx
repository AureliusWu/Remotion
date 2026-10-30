import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot07 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={6} />
      <Audio
        name="图灵换了一种提问方式旁白"
        src={staticFile("ai-history/02-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={6} />
    </AbsoluteFill>
  );
};
export const Shot07Composition = () => (
  <Composition
    id="AiHistoryShot0203"
    component={Shot07}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1735}
    defaultProps={{}}
  />
);
