import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot29 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={28} />
      <Audio
        name="中间那层，应该怎样学旁白"
        src={staticFile("ai-history/08-01.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={28} />
    </AbsoluteFill>
  );
};
export const Shot29Composition = () => (
  <Composition
    id="AiHistoryShot0801"
    component={Shot29}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1844}
    defaultProps={{}}
  />
);
