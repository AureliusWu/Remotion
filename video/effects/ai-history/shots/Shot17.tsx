import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot17 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={16} />
      <Audio
        name="伊莱扎怎样接话旁白"
        src={staticFile("ai-history/05-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={16} />
    </AbsoluteFill>
  );
};
export const Shot17Composition = () => (
  <Composition
    id="AiHistoryShot0501"
    component={Shot17}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1777}
    defaultProps={{}}
  />
);
