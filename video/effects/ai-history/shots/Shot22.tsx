import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot22 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={21} />
      <Audio
        name="缩小承诺，继续研究语言旁白"
        src={staticFile("ai-history/06-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={21} />
    </AbsoluteFill>
  );
};
export const Shot22Composition = () => (
  <Composition
    id="AiHistoryShot0602"
    component={Shot22}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1815}
    defaultProps={{}}
  />
);
