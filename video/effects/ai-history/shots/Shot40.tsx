import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot40 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={39} />
      <Audio
        name="三种条件相遇旁白"
        src={staticFile("ai-history/10-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={39} />
    </AbsoluteFill>
  );
};
export const Shot40Composition = () => (
  <Composition
    id="AiHistoryShot1004"
    component={Shot40}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1903}
    defaultProps={{}}
  />
);
