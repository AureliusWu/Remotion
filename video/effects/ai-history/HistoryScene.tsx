import {
  AbsoluteFill,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import initialData from "./film-data.json";
import { HistoryDiagram } from "./Diagrams";
import { clamp, paletteFor } from "./palette";
import type { HistoryData } from "./types";

const film = initialData as HistoryData;

export const HistoryScene: React.FC<{ sceneIndex: number }> = ({
  sceneIndex,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const shot = film.shots[sceneIndex];
  const durationInFrames = shot.durationInFrames;
  const c = paletteFor(shot.chapterId);
  const seconds = frame / fps;
  const chapter = Number(shot.chapterId);
  const active = shot.captions.reduce(
    (last, line, index) => (seconds >= line.startSeconds ? index : last),
    0,
  );
  const focus = shot.labels.length ? active % shot.labels.length : 0;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: c.bg,
        color: c.ink,
        fontFamily: '"Microsoft YaHei", "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${c.line}18 1px, transparent 1px),linear-gradient(90deg,${c.line}18 1px,transparent 1px)`,
          backgroundSize: "80px 80px",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 46,
          fontSize: 25,
          letterSpacing: 4,
          color: c.muted,
        }}
      >
        从提问到共创 / 人工智能发展历程
      </div>
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 46,
          fontSize: 25,
          color: c.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        第 {chapter.toString().padStart(2, "0")} / 15 章 · {shot.id}
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 116,
          width: 470,
          fontSize: shot.era.length > 12 ? 49 : 68,
          lineHeight: 1.25,
          color: c.accent,
          fontWeight: 700,
        }}
      >
        {shot.era}
      </div>
      <div style={{ position: "absolute", left: 640, top: 112, right: 100 }}>
        <div
          style={{
            fontSize: 25,
            letterSpacing: 3,
            color: c.muted,
            marginBottom: 18,
          }}
        >
          {shot.chapterTitle}
        </div>
        <div
          style={{
            fontSize: shot.title.length > 20 ? 44 : 53,
            lineHeight: 1.26,
            fontWeight: 700,
          }}
        >
          {shot.title}
        </div>
      </div>
      <Interactive.Div
        name="Explanatory diagram"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 80,
          top: 286,
          opacity: interpolate(frame, [0, 0.55 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0, 0.75 * fps],
            ["0px 12px", "0px 0px"],
            clamp,
          ),
        }}
      >
        <HistoryDiagram shot={shot} palette={c} step={active} />
      </Interactive.Div>
      <div style={{ position: "absolute", left: 1280, top: 298, width: 535 }}>
        {shot.labels.slice(0, 4).map((item, index) => (
          <div
            key={index}
            style={{
              padding: "16px 22px",
              marginBottom: 14,
              minHeight: 70,
              borderLeft: `4px solid ${index === focus ? c.accent : c.line}`,
              background: index === focus ? `${c.accent}16` : `${c.panel}99`,
              opacity: interpolate(
                frame,
                [index * 0.35 * fps, (index * 0.35 + 0.5) * fps],
                [0, 1],
                clamp,
              ),
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: 29, lineHeight: 1.35, color: c.ink }}>
              {item.label}
            </div>
            {item.value !== undefined && (
              <div
                style={{
                  fontSize: 25,
                  color: c.secondary,
                  marginTop: 6,
                  lineHeight: 1.3,
                }}
              >
                {item.value}
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 802,
          height: 50,
          color: c.secondary,
          fontSize: 31,
          lineHeight: 1.35,
        }}
      >
        {shot.takeaway}
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          top: 1002,
          height: 36,
          color: c.muted,
          fontSize: 20,
          lineHeight: 1.45,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        资料：{shot.sourceText} · 图形均为概念示意或原创重绘
      </div>
      <div
        style={{
          position: "absolute",
          left: 100,
          right: 100,
          bottom: 27,
          height: 3,
          background: c.line,
        }}
      >
        <div
          style={{
            height: 3,
            width: `${((shot.startFrame + Math.min(frame, durationInFrames)) / 108000) * 100}%`,
            background: c.accent,
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 100,
          bottom: 38,
          fontSize: 16,
          color: c.muted,
        }}
      >
        章节进度 · 非等比例历史刻度
      </div>
    </AbsoluteFill>
  );
};
