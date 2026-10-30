import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot12 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={11} />
      <Audio
        name="从名字回到可以运行的工作旁白"
        src={staticFile("ai-history/03-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={11} />
    </AbsoluteFill>
  );
};
export const Shot12Composition = () => (
  <Composition
    id="AiHistoryShot0304"
    component={Shot12}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1773}
    defaultProps={{}}
  />
);
