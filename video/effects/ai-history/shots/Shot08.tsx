import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot08 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={7} />
      <Audio
        name="执行规则与获得规则旁白"
        src={staticFile("ai-history/02-04.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={7} />
    </AbsoluteFill>
  );
};
export const Shot08Composition = () => (
  <Composition
    id="AiHistoryShot0204"
    component={Shot08}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1856}
    defaultProps={{}}
  />
);
