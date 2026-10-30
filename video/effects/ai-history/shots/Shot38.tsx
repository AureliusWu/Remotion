import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot38 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={37} />
      <Audio
        name="先修建共同考场旁白"
        src={staticFile("ai-history/10-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={37} />
    </AbsoluteFill>
  );
};
export const Shot38Composition = () => (
  <Composition
    id="AiHistoryShot1002"
    component={Shot38}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1807}
    defaultProps={{}}
  />
);
