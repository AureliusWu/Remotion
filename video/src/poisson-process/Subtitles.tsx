import { Interactive, useCurrentFrame, useVideoConfig } from "remotion";
import manifest from "../../public/poisson-process/voiceover-manifest.json";
import { fonts } from "./shared";

export const Subtitles: React.FC<{ track: number }> = ({ track }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = manifest.scenes[track];
  const line = scene.captions.find(
    (caption) =>
      frame / fps >= caption.startSeconds && frame / fps < caption.endSeconds,
  );
  return (
    <Interactive.Div
      name="逐句中文字幕"
      premountFor={fps}
      style={{
        position: "absolute",
        left: 160,
        right: 160,
        top: 969,
        minHeight: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {line ? (
        <div
          style={{
            fontFamily: fonts.body,
            fontSize: 34,
            lineHeight: 1.4,
            textAlign: "center",
            color: "#fff6e2",
            backgroundColor: "rgba(12, 35, 43, 0.9)",
            padding: "10px 26px 12px",
            borderRadius: 6,
          }}
        >
          {line.text}
        </div>
      ) : null}
    </Interactive.Div>
  );
};
