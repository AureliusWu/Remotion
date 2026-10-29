import { SmokeTestComposition } from "./Composition";
import { PelicanRideComposition } from "./pelican-ride/PelicanRide";
import { ChinaGenAiCompositions } from "./china-genai/ChinaGenAiTimeline";
import { PoissonCompositions } from "./poisson-process/PoissonFilm";
import { EffectsCompositions } from "../effects";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <SmokeTestComposition />
      <PelicanRideComposition />
      <ChinaGenAiCompositions />
      <PoissonCompositions />
      <EffectsCompositions />
    </>
  );
};
