import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot26 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={25} />
      <Audio
        name="规则库让经验可以被检查旁白"
        src={staticFile("ai-history/07-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={25} />
    </AbsoluteFill>
  );
};
export const Shot26Composition = () => (
  <Composition
    id="AiHistoryShot0702"
    component={Shot26}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1773}
    defaultProps={{}}
  />
);
