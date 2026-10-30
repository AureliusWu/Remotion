import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot31 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={30} />
      <Audio
        name="学习的不只是最后一道分界旁白"
        src={staticFile("ai-history/08-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={30} />
    </AbsoluteFill>
  );
};
export const Shot31Composition = () => (
  <Composition
    id="AiHistoryShot0803"
    component={Shot31}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1822}
    defaultProps={{}}
  />
);
