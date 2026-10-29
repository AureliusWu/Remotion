import { SmokeTestComposition } from "./Composition";
import { PelicanRideComposition } from "./pelican-ride/PelicanRide";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <SmokeTestComposition />
      <PelicanRideComposition />
    </>
  );
};
