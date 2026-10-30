import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot27 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={26} />
      <Audio
        name="从论文走向订单配置旁白"
        src={staticFile("ai-history/07-03.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={26} />
    </AbsoluteFill>
  );
};
export const Shot27Composition = () => (
  <Composition
    id="AiHistoryShot0703"
    component={Shot27}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1787}
    defaultProps={{}}
  />
);
