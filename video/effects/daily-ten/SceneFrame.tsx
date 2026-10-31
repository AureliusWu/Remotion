import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { NewsArt } from "./NewsArt";
import { useNewsEdition } from "./EditionContext";

export const FONT = '"Microsoft YaHei", "DengXian", sans-serif';
export const DISPLAY = '"SimSun", "Songti SC", serif';
export const INK = "#15313C";
export const PAPER = "#EEF2F0";
const ease = Easing.bezier(0.19, 1, 0.22, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Narration = ({ id }: { id: string }) => {
  const edition = useNewsEdition();
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const clip = edition.voiceover.scenes.find(
    (s) => s.id === id && Number.isFinite(s.fromSeconds),
  );
  const caption = clip?.captions.find(
    (c) => frame / fps >= c.startSeconds && frame / fps < c.endSeconds,
  );
  return (
    <>
      {clip ? (
        <Audio
          name="中文旁白"
          from={Math.round(clip.fromSeconds * fps)}
          src={staticFile(`${edition.assetDir}/${clip.file}`)}
          premountFor={fps}
          volume={0.88}
        />
      ) : null}
      {caption ? (
        <Interactive.Div
          name="逐句字幕"
          style={{
            position: "absolute",
            bottom: portrait ? 330 : 84,
            left: portrait ? 64 : 120,
            right: portrait ? 160 : 120,
            display: "flex",
            justifyContent: "center",
            fontFamily: FONT,
            fontSize: portrait ? 34 : 29,
            lineHeight: 1.5,
            color: "#FAFCF8",
            textAlign: "center",
          }}
        >
          <span
            style={{
              background: "rgba(13,37,47,0.92)",
              padding: portrait ? "12px 18px" : "9px 25px",
              borderRadius: 4,
              maxWidth: portrait ? 856 : 1660,
            }}
          >
            {caption.text}
          </span>
        </Interactive.Div>
      ) : null}
    </>
  );
};

export const Folio = ({
  index,
  dark = false,
  category,
}: {
  index: number;
  dark?: boolean;
  category?: string;
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const color = dark ? "#DAE6E7" : INK;
  const edition = useNewsEdition();
  return (
    <>
      <Interactive.Div
        name="刊头"
        style={{
          position: "absolute",
          top: 55,
          left: 90,
          right: 90,
          color,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: FONT,
          fontSize: 22,
          letterSpacing: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontWeight: 700, letterSpacing: 5, fontSize: 28 }}>
            {edition.brandLabel ?? "此 刻"}
          </span>
          <span
            style={{ width: 1, height: 23, background: color, opacity: 0.3 }}
          />
          <span style={{ opacity: 0.7 }}>{category ?? edition.issueLabel}</span>
        </div>
        <span style={{ fontFamily: "Bahnschrift", letterSpacing: 3 }}>
          {edition.dateLabel}
        </span>
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          top: 109,
          left: 90,
          right: 90,
          height: 1,
          background: color,
          opacity: 0.18,
        }}
      />
      <Interactive.Div
        name="本期进度"
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          bottom: 42,
          display: "flex",
          gap: 9,
        }}
      >
        {Array.from({ length: edition.shots.length - 2 }, (_, i) => (
          <div
            key={i}
            style={{
              height: 3,
              flex: 1,
              background: color,
              opacity: i < index ? 0.7 : 0.15,
              position: "relative",
            }}
          >
            {i === index - 1 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: dark ? "#DAE6E7" : INK,
                  scale: `${interpolate(frame, [0, Math.min((edition.shots[index]?.durationSeconds ?? 16) * fps, durationInFrames)], [0, 1], clamp)} 1`,
                  transformOrigin: "left",
                }}
              />
            ) : null}
          </div>
        ))}
      </Interactive.Div>
    </>
  );
};

export const SceneFrame = ({ index }: { index: number }) => {
  const edition = useNewsEdition();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const story = edition.shots[index];
  const dark = [3, 6, 8, 9].includes(index);
  const color = dark ? "#EDF2EE" : INK;
  const accent = story.accent ?? "#B85640";
  const secondAt = (story.durationSeconds / 2 - 0.2) * fps;
  const second = frame >= secondAt;
  const detailOpacity = second
    ? interpolate(frame, [secondAt, secondAt + 0.6 * fps], [0, 1], clamp)
    : interpolate(
        frame,
        [0.7 * fps, 1.6 * fps, secondAt - 0.4 * fps, secondAt],
        [0, 1, 1, 0],
        clamp,
      );
  return (
    <AbsoluteFill
      style={{
        background: dark
          ? index === 9
            ? "#102833"
            : "#173844"
          : index === 2
            ? "#E6EDF0"
            : PAPER,
        fontFamily: FONT,
        color,
        overflow: "hidden",
      }}
    >
      <Folio index={index} dark={dark} category={story.category} />
      <Interactive.Div
        name="新闻序号"
        style={{
          position: "absolute",
          left: 1008,
          top: 82,
          fontFamily: "Georgia",
          fontSize: 510,
          lineHeight: 1,
          letterSpacing: -44,
          color,
          opacity: 0.045,
        }}
      >
        {String(index).padStart(2, "0")}
      </Interactive.Div>
      <Interactive.Div
        name="本条标题"
        style={{
          position: "absolute",
          left: 96,
          top: 165,
          width: 900,
          whiteSpace: "pre-line",
          fontFamily: DISPLAY,
          fontSize: index === 7 ? 85 : 94,
          fontWeight: 600,
          lineHeight: 1.22,
          letterSpacing: 2,
          opacity: interpolate(frame, [0, 0.65 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0, 1.15 * fps],
            ["0px 36px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        {story.title}
      </Interactive.Div>
      <Interactive.Div
        name="事实与背景"
        style={{
          position: "absolute",
          left: 100,
          top: 445,
          width: 820,
          opacity: detailOpacity,
          translate: interpolate(
            frame,
            second ? [secondAt, secondAt + 0.85 * fps] : [0.7 * fps, 1.6 * fps],
            ["0px 14px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 3,
            color: dark ? "#AAC4CA" : "#57717A",
            marginBottom: 16,
          }}
        >
          {second ? "多一点背景" : "发生了什么"}
        </div>
        <div
          style={{
            fontSize: edition.bodyFontSize ?? 33,
            lineHeight: 1.68,
            fontWeight: 400,
            letterSpacing: 0.4,
          }}
        >
          {story.details?.[second ? 1 : 0]}
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="核心数字"
        style={{
          position: "absolute",
          left: 96,
          top: 713,
          opacity: interpolate(frame, [1.3 * fps, 2.2 * fps], [0, 1], clamp),
        }}
      >
        <div
          style={{
            fontFamily: "Bahnschrift, Microsoft YaHei",
            fontSize: index === 6 ? 81 : 105,
            lineHeight: 1.1,
            color: accent,
            letterSpacing: -2,
            fontWeight: 600,
          }}
        >
          {story.stat}
        </div>
        <div
          style={{
            fontSize: 22,
            lineHeight: 1.5,
            marginTop: 15,
            color,
            opacity: 0.7,
          }}
        >
          {story.statLabel}
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="原创新闻图形"
        style={{
          position: "absolute",
          right: 58,
          top: 164,
          width: 840,
          height: 682,
          opacity: interpolate(frame, [0.25 * fps, 1.6 * fps], [0, 1], clamp),
          translate: interpolate(frame, [0, 2 * fps], ["85px 0px", "0px 0px"], {
            ...clamp,
            easing: ease,
          }),
          scale: interpolate(
            frame,
            [0, story.durationSeconds * fps],
            [0.96, 1.025],
            clamp,
          ),
        }}
      >
        {edition.renderArt ? (
          edition.renderArt({ index, accent, dark })
        ) : (
          <NewsArt
            kind={story.id as Parameters<typeof NewsArt>[0]["kind"]}
            accent={accent}
            dark={dark}
          />
        )}
      </Interactive.Div>
      <Interactive.Div
        name="来源与日期"
        style={{
          position: "absolute",
          bottom: 165,
          left: 101,
          fontSize: 19,
          lineHeight: 1.3,
          opacity: 0.55,
          color,
          width: 1650,
        }}
      >
        资料：{story.sourceLabel}
      </Interactive.Div>
      <Narration id={story.id} />
      <Interactive.Div
        name="翻页转场"
        style={{
          position: "absolute",
          inset: 0,
          background: dark ? "#D8E2E1" : "#214552",
          translate: interpolate(
            frame,
            [0, 0.65 * fps],
            ["0px 0px", "1920px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      />
    </AbsoluteFill>
  );
};
