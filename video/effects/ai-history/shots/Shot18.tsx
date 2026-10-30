import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot18 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={17} />
      <Audio
        name="熟悉的语气怎样影响判断旁白"
        src={staticFile("ai-history/05-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={17} />
    </AbsoluteFill>
  );
};
export const Shot18Composition = () => (
  <Composition
    id="AiHistoryShot0502"
    component={Shot18}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1782}
    defaultProps={{}}
  />
);
