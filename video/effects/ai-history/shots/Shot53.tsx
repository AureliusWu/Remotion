import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot53 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={52} />
      <Audio
        name="把进步落到具体任务旁白"
        src={staticFile("ai-history/14-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={52} />
    </AbsoluteFill>
  );
};
export const Shot53Composition = () => (
  <Composition
    id="AiHistoryShot1401"
    component={Shot53}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1911}
    defaultProps={{}}
  />
);
