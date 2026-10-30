import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot10 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={9} />
      <Audio
        name="把雄心展开成研究清单旁白"
        src={staticFile("ai-history/03-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={9} />
    </AbsoluteFill>
  );
};
export const Shot10Composition = () => (
  <Composition
    id="AiHistoryShot0302"
    component={Shot10}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1866}
    defaultProps={{}}
  />
);
