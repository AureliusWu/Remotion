import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot57 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={56} />
      <Audio
        name="回到一天里的小选择旁白"
        src={staticFile("ai-history/15-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={56} />
    </AbsoluteFill>
  );
};
export const Shot57Composition = () => (
  <Composition
    id="AiHistoryShot1501"
    component={Shot57}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1810}
    defaultProps={{}}
  />
);
