import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot36 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={35} />
      <Audio
        name="数据也要接受检查旁白"
        src={staticFile("ai-history/09-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={35} />
    </AbsoluteFill>
  );
};
export const Shot36Composition = () => (
  <Composition
    id="AiHistoryShot0904"
    component={Shot36}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1723}
    defaultProps={{}}
  />
);
