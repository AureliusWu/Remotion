import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot51 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={50} />
      <Audio
        name="文字与图像建立联系旁白"
        src={staticFile("ai-history/13-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={50} />
    </AbsoluteFill>
  );
};
export const Shot51Composition = () => (
  <Composition
    id="AiHistoryShot1303"
    component={Shot51}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1843}
    defaultProps={{}}
  />
);
