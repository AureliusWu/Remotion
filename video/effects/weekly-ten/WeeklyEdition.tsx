import { type ReactNode } from "react";
import { useVideoConfig } from "remotion";
import {
  EditionContext,
  type NewsEdition,
  type VoiceScene,
} from "../daily-ten/EditionContext";
import { SceneFrame } from "../daily-ten/SceneFrame";
import { PortraitScene } from "../daily-ten/PortraitScene";
import storyboard from "./storyboard.json";
import voiceover from "../../public/weekly-ten/voiceover-manifest.json";
import { WeeklyArt } from "./WeeklyArt";
const edition: NewsEdition = {
  shots: storyboard.shots,
  voiceover: voiceover as unknown as { scenes: VoiceScene[] },
  assetDir: "weekly-ten",
  dateLabel: "10.26—10.30 · 截至目前",
  issueLabel: "这一周 / 十件事",
  renderArt: ({ index, accent, dark }) => (
    <WeeklyArt
      kind={storyboard.shots[index].kind ?? "archive"}
      accent={accent}
      dark={dark}
    />
  ),
};
export const WeeklyProvider = ({ children }: { children: ReactNode }) => (
  <EditionContext.Provider value={edition}>{children}</EditionContext.Provider>
);
export const WeeklyNewsScene = ({ index }: { index: number }) => {
  const { width, height } = useVideoConfig();
  return (
    <WeeklyProvider>
      {height > width ? (
        <PortraitScene index={index} />
      ) : (
        <SceneFrame index={index} />
      )}
    </WeeklyProvider>
  );
};
