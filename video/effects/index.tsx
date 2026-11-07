import { Folder } from "remotion";
import { EnvironmentTestComposition } from "./environment-test/EnvironmentTest";
import { AiHistoryPreviewComposition } from "./ai-history/Preview";
import { AiHistoryLayoutComposition } from "./ai-history/LayoutReview";
import { AiHistoryCompositions } from "./ai-history/AiHistoryFilm";
import { DailyTenCompositions } from "./daily-ten/DailyTen";
import {WeeklyCompositions} from './weekly-ten/WeeklyFilm';
import { AiWeeklyCompositions } from "./ai-weekly/AiFilm";
import { FrequencyIllusionCompositions } from "./frequency-illusion/FrequencyIllusionFilm";
import { DemianCompositions } from "./demian/DemianFilm";
import { SuperagentCompositions } from "./superagent/SuperagentFilm";

export const EffectsCompositions = () => (
  <Folder name="Effects">
    <FrequencyIllusionCompositions />
    <SuperagentCompositions />
    <DemianCompositions />
    <AiWeeklyCompositions />
    <WeeklyCompositions/>
    <DailyTenCompositions />
    <EnvironmentTestComposition />
    <AiHistoryPreviewComposition />
    <AiHistoryLayoutComposition />
    <AiHistoryCompositions />
  </Folder>
);
