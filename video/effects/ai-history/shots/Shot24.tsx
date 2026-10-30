import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot24 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={23} />
      <Audio
        name="寒冬不是全球统一的停机按钮旁白"
        src={staticFile("ai-history/06-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={23} />
    </AbsoluteFill>
  );
};
export const Shot24Composition = () => (
  <Composition
    id="AiHistoryShot0604"
    component={Shot24}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1788}
    defaultProps={{}}
  />
);
