import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot35 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={34} />
      <Audio
        name="把不确定性放进模型旁白"
        src={staticFile("ai-history/09-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={34} />
    </AbsoluteFill>
  );
};
export const Shot35Composition = () => (
  <Composition
    id="AiHistoryShot0903"
    component={Shot35}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1785}
    defaultProps={{}}
  />
);
