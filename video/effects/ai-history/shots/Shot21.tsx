import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot21 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={20} />
      <Audio
        name="阿尔帕克评估的具体对象旁白"
        src={staticFile("ai-history/06-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={20} />
    </AbsoluteFill>
  );
};
export const Shot21Composition = () => (
  <Composition
    id="AiHistoryShot0601"
    component={Shot21}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1798}
    defaultProps={{}}
  />
);
