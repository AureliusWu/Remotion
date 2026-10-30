import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot05 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={4} />
      <Audio
        name="一条纸带上的计算旁白"
        src={staticFile("ai-history/02-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={4} />
    </AbsoluteFill>
  );
};
export const Shot05Composition = () => (
  <Composition
    id="AiHistoryShot0201"
    component={Shot05}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1816}
    defaultProps={{}}
  />
);
