import { Folder } from "remotion";
import { EnvironmentTestComposition } from "./environment-test/EnvironmentTest";
import { AiHistoryPreviewComposition } from "./ai-history/Preview";
import { AiHistoryLayoutComposition } from "./ai-history/LayoutReview";
import { AiHistoryCompositions } from "./ai-history/AiHistoryFilm";

export const EffectsCompositions = () => (
  <Folder name="Effects">
    <EnvironmentTestComposition />
    <AiHistoryPreviewComposition />
    <AiHistoryLayoutComposition />
    <AiHistoryCompositions />
  </Folder>
);
