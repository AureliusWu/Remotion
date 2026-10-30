import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "./HistoryScene";
import { HistoryCaptions } from "./HistoryCaptions";

const Preview = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={0} />
      <Audio
        name="免费本地旁白样片"
        src={staticFile("ai-history/01-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={0} />
    </AbsoluteFill>
  );
};
export const AiHistoryPreviewComposition = () => (
  <Composition
    id="AiHistoryPreview"
    component={Preview}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1800}
    defaultProps={{}}
  />
);
