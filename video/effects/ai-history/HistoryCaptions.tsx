import { useCurrentFrame, useVideoConfig } from "remotion";
import rawData from "./film-data.json";
import { paletteFor } from "./palette";
import type { HistoryData } from "./types";

const film = rawData as HistoryData;
export const HistoryCaptions: React.FC<{ sceneIndex: number }> = ({
  sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shot = film.shots[sceneIndex];
  const c = paletteFor(shot.chapterId);
  const caption = shot.captions.find(
    (line) => frame / fps >= line.startSeconds && frame / fps < line.endSeconds,
  );
  if (!caption) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 170,
        right: 170,
        top: 866,
        minHeight: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 30px",
        boxSizing: "border-box",
        borderRadius: 18,
        background: c.paper ? "#f9f6edee" : "#07121fee",
        border: `1px solid ${c.line}`,
        color: c.ink,
        fontSize: 37,
        lineHeight: 1.4,
        textAlign: "center",
        fontFamily: '"Microsoft YaHei", "Segoe UI", sans-serif',
        whiteSpace: "pre-line",
      }}
    >
      {caption.text}
    </div>
  );
};
