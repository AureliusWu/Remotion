export type Label = { label: string; value?: string | number };
export type Caption = {
  text: string;
  startSeconds: number;
  endSeconds: number;
};
export type HistoryShot = {
  id: string;
  chapterId: string;
  chapterTitle: string;
  era: string;
  title: string;
  narration: string[];
  visual: string;
  labels: Label[];
  takeaway: string;
  sourceIds: string[];
  sourceText: string;
  audioFile?: string;
  audioDurationSeconds?: number;
  captions: Caption[];
  fromSeconds: number;
  durationInFrames: number;
  startFrame: number;
};
export type HistoryData = {
  title: string;
  fps: number;
  durationInFrames: number;
  shots: HistoryShot[];
};
