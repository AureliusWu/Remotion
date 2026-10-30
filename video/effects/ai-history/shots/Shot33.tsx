import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot33 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={32} />
      <Audio
        name="让样本参与设计旁白"
        src={staticFile("ai-history/09-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={32} />
    </AbsoluteFill>
  );
};
export const Shot33Composition = () => (
  <Composition
    id="AiHistoryShot0901"
    component={Shot33}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1911}
    defaultProps={{}}
  />
);
