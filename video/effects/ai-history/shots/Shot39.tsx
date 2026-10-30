import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot39 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={38} />
      <Audio
        name="AlexNet的成绩单旁白"
        src={staticFile("ai-history/10-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={38} />
    </AbsoluteFill>
  );
};
export const Shot39Composition = () => (
  <Composition
    id="AiHistoryShot1003"
    component={Shot39}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1723}
    defaultProps={{}}
  />
);
