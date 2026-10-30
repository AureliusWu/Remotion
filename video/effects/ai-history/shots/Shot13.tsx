import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot13 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={12} />
      <Audio
        name="让连接随例子改变旁白"
        src={staticFile("ai-history/04-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={12} />
    </AbsoluteFill>
  );
};
export const Shot13Composition = () => (
  <Composition
    id="AiHistoryShot0401"
    component={Shot13}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1861}
    defaultProps={{}}
  />
);
