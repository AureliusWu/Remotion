import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot19 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={18} />
      <Audio
        name="沙基把感知、规划与行动连起来旁白"
        src={staticFile("ai-history/05-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={18} />
    </AbsoluteFill>
  );
};
export const Shot19Composition = () => (
  <Composition
    id="AiHistoryShot0503"
    component={Shot19}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1830}
    defaultProps={{}}
  />
);
