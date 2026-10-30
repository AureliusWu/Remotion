import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot16 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={15} />
      <Audio
        name="能力边界开始显形旁白"
        src={staticFile("ai-history/04-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={15} />
    </AbsoluteFill>
  );
};
export const Shot16Composition = () => (
  <Composition
    id="AiHistoryShot0404"
    component={Shot16}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1769}
    defaultProps={{}}
  />
);
