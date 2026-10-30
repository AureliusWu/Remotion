import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot48 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={47} />
      <Audio
        name="对话改变了入口旁白"
        src={staticFile("ai-history/12-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={47} />
    </AbsoluteFill>
  );
};
export const Shot48Composition = () => (
  <Composition
    id="AiHistoryShot1204"
    component={Shot48}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1759}
    defaultProps={{}}
  />
);
