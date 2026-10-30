import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot11 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={10} />
      <Audio
        name="夏天并没有交出万能机器旁白"
        src={staticFile("ai-history/03-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={10} />
    </AbsoluteFill>
  );
};
export const Shot11Composition = () => (
  <Composition
    id="AiHistoryShot0303"
    component={Shot11}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1773}
    defaultProps={{}}
  />
);
