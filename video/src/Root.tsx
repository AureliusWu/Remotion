import { SmokeTestComposition } from "./Composition";
import { PelicanRideComposition } from "./pelican-ride/PelicanRide";
import { ChinaGenAiCompositions } from "./china-genai/ChinaGenAiTimeline";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <SmokeTestComposition />
      <PelicanRideComposition />
      <ChinaGenAiCompositions />
    </>
  );
};
