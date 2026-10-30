import { AbsoluteFill, Composition } from "remotion";
import { HistoryScene } from "./HistoryScene";
import { HistoryCaptions } from "./HistoryCaptions";

const LayoutReview: React.FC<{ sceneIndex: number }> = ({ sceneIndex }) => (
  <AbsoluteFill>
    <HistoryScene sceneIndex={sceneIndex} />
    <HistoryCaptions sceneIndex={sceneIndex} />
  </AbsoluteFill>
);
export const AiHistoryLayoutComposition = () => (
  <Composition
    id="AiHistoryLayoutReview"
    component={LayoutReview}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={1800}
    defaultProps={{ sceneIndex: 0 }}
  />
);
