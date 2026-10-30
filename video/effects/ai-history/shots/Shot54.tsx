import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  staticFile,
  useVideoConfig,
} from "remotion";
import { HistoryScene } from "../HistoryScene";
import { HistoryCaptions } from "../HistoryCaptions";
export const Shot54 = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <HistoryScene sceneIndex={53} />
      <Audio
        name="一张榜单装不下可靠性旁白"
        src={staticFile("ai-history/14-02.mp3")}
        from={0.7 * fps}
        premountFor={fps}
      />
      <HistoryCaptions sceneIndex={53} />
    </AbsoluteFill>
  );
};
export const Shot54Composition = () => (
  <Composition
    id="AiHistoryShot1402"
    component={Shot54}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1829}
    defaultProps={{}}
  />
);
