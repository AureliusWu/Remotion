import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot56 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={55} />
      <Audio
        name="计算背后有物理成本旁白"
        src={staticFile("ai-history/14-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={55} />
    </AbsoluteFill>
  );
};
export const Shot56Composition = () => (
  <Composition
    id="AiHistoryShot1404"
    component={Shot56}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1665}
    defaultProps={{}}
  />
);
