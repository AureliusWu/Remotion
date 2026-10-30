import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot52 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={51} />
      <Audio
        name="在潜在空间里扩散旁白"
        src={staticFile("ai-history/13-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={51} />
    </AbsoluteFill>
  );
};
export const Shot52Composition = () => (
  <Composition
    id="AiHistoryShot1304"
    component={Shot52}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1766}
    defaultProps={{}}
  />
);
