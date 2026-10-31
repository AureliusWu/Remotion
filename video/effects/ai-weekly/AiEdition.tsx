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
import voiceover from "../../public/ai-weekly/voiceover-manifest.json";
import { AiArt } from "./AiArt";

const edition: NewsEdition = {
  shots: storyboard.shots,
  voiceover: voiceover as unknown as { scenes: VoiceScene[] },
  assetDir: "ai-weekly",
  dateLabel: "10.26—10.30 · 截至目前",
  issueLabel: "九条AI进展",
  brandLabel: "AI 一周",
  bodyFontSize: 31,
  portraitBodyFontSize: 34,
  renderArt: ({ index, accent, dark }) => (
    <AiArt
      kind={storyboard.shots[index].kind ?? "computer"}
      accent={accent}
      dark={dark}
    />
  ),
};

export const AiProvider = ({ children }: { children: ReactNode }) => (
  <EditionContext.Provider value={edition}>{children}</EditionContext.Provider>
);

export const AiNewsScene = ({ index }: { index: number }) => {
  const { width, height } = useVideoConfig();
  return (
    <AiProvider>
      {height > width ? (
        <PortraitScene index={index} />
      ) : (
        <SceneFrame index={index} />
      )}
    </AiProvider>
  );
};
