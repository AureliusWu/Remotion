import { createContext, useContext, type ReactNode } from "react";
import storyboard from "./storyboard.json";
import voiceover from "../../public/daily-ten/voiceover-manifest.json";
export type NewsShot = {
  id: string;
  durationSeconds: number;
  title: string;
  narration: string[];
  kind?: string;
  category?: string;
  stat?: string;
  statLabel?: string;
  details?: string[];
  sourceLabel?: string;
  sourceUrl?: string;
  publishedOn?: string;
  eventOn?: string;
  accent?: string;
};
export type VoiceScene = {
  id: string;
  file: string;
  fromSeconds: number;
  sceneDurationSeconds: number;
  durationSeconds: number;
  captions: { text: string; startSeconds: number; endSeconds: number }[];
};
export type NewsEdition = {
  shots: NewsShot[];
  voiceover: { scenes: VoiceScene[] };
  assetDir: string;
  dateLabel: string;
  issueLabel: string;
  brandLabel?: string;
  bodyFontSize?: number;
  portraitBodyFontSize?: number;
  renderArt?: (props: {
    index: number;
    accent: string;
    dark: boolean;
  }) => ReactNode;
};
const daily: NewsEdition = {
  shots: storyboard.shots,
  voiceover: voiceover as unknown as { scenes: VoiceScene[] },
  assetDir: "daily-ten",
  dateLabel: "2026.10.30",
  issueLabel: "十件事 / 近期新闻精选",
};
export const EditionContext = createContext<NewsEdition>(daily);
export const useNewsEdition = () => useContext(EditionContext);
