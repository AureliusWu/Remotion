import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useNewsEdition } from "./EditionContext";
import { NewsArt, type NewsArtKind } from "./NewsArt";
import { DISPLAY, FONT, INK, PAPER, Narration } from "./SceneFrame";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.19, 1, 0.22, 1);

export const PortraitScene = ({ index }: { index: number }) => {
  const edition = useNewsEdition();
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const story = edition.shots[index];
  const dark = [3, 6, 8, 9].includes(index);
  const ink = dark ? "#EDF2EE" : INK;
  const accent = story.accent ?? "#477C8B";
  const secondAt = (story.durationSeconds / 2 - 0.2) * fps;
  const second = frame >= secondAt;
  return (
    <AbsoluteFill
      style={{
        background: dark ? "#173844" : PAPER,
        fontFamily: FONT,
        color: ink,
        overflow: "hidden",
      }}
    >
      <Interactive.Div
        name="竖屏刊头"
        style={{
          position: "absolute",
          left: 68,
          top: 108,
          width: 838,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 32, letterSpacing: 7, fontWeight: 700 }}>
          {edition.brandLabel ?? "此 刻"}
        </span>
        <span
          style={{ fontSize: 25, fontFamily: "Bahnschrift", letterSpacing: 2 }}
        >
          {edition.dateLabel}
        </span>
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          left: 68,
          top: 167,
          width: 838,
          display: "flex",
          gap: 8,
        }}
      >
        {Array.from({ length: edition.shots.length - 2 }, (_, i) => (
          <div
            key={i}
            style={{
              height: 3,
              flex: 1,
              background: ink,
              opacity: i < index ? 0.65 : 0.16,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 73,
          top: 201,
          fontSize: 24,
          letterSpacing: 2,
          opacity: 0.64,
        }}
      >
        {String(index).padStart(2, "0")} / {story.category}
      </div>
      <Interactive.Div
        name="竖屏标题"
        style={{
          position: "absolute",
          left: 68,
          top: 251,
          width: 855,
          fontFamily: DISPLAY,
          fontSize: index === 7 ? 71 : 79,
          lineHeight: 1.2,
          letterSpacing: 1,
          fontWeight: 600,
          whiteSpace: "pre-line",
          opacity: interpolate(frame, [0, 0.7 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0, 1.15 * fps],
            ["0px 28px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        {story.title}
      </Interactive.Div>
      <Interactive.Div
        name="竖屏主题插画"
        style={{
          position: "absolute",
          left: 64,
          top: 414,
          width: 838,
          height: 456,
          opacity: interpolate(frame, [0.25 * fps, 1.5 * fps], [0, 1], clamp),
          scale: interpolate(
            frame,
            [0, story.durationSeconds * fps],
            [0.95, 1.025],
            clamp,
          ),
        }}
      >
        {edition.renderArt ? (
          edition.renderArt({ index, accent, dark })
        ) : (
          <NewsArt kind={story.id as NewsArtKind} accent={accent} dark={dark} />
        )}
      </Interactive.Div>
      <Interactive.Div
        name="竖屏核心数字"
        style={{
          position: "absolute",
          left: 70,
          top: 872,
          width: 838,
          opacity: interpolate(frame, [0.9 * fps, 1.8 * fps], [0, 1], clamp),
        }}
      >
        <div
          style={{
            fontFamily: "Bahnschrift, Microsoft YaHei",
            fontSize: index === 6 ? 77 : 93,
            fontWeight: 600,
            letterSpacing: -2,
            lineHeight: 1.05,
            color: accent,
          }}
        >
          {story.stat}
        </div>
        <div
          style={{
            fontSize: 25,
            opacity: 0.74,
            lineHeight: 1.55,
            marginTop: 12,
          }}
        >
          {story.statLabel}
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="竖屏事实与背景"
        style={{
          position: "absolute",
          left: 72,
          top: 1064,
          width: 834,
          opacity: second
            ? interpolate(
                frame,
                [secondAt, secondAt + 0.6 * fps],
                [0, 1],
                clamp,
              )
            : interpolate(
                frame,
                [0.7 * fps, 1.6 * fps, secondAt - 0.4 * fps, secondAt],
                [0, 1, 1, 0],
                clamp,
              ),
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: 3,
            opacity: 0.6,
            marginBottom: 15,
          }}
        >
          {second ? "多一点背景" : "发生了什么"}
        </div>
        <div
          style={{
            fontSize: edition.portraitBodyFontSize ?? 36,
            lineHeight: 1.6,
            letterSpacing: 0.25,
          }}
        >
          {story.details?.[second ? 1 : 0]}
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="竖屏来源"
        style={{
          position: "absolute",
          left: 73,
          top: 1412,
          width: 832,
          fontSize: 22,
          lineHeight: 1.55,
          opacity: 0.55,
        }}
      >
        资料：{story.sourceLabel}
      </Interactive.Div>
      <Narration id={story.id} />
      <Interactive.Div
        name="竖屏翻页转场"
        style={{
          position: "absolute",
          inset: 0,
          background: dark ? "#D8E2E1" : "#214552",
          translate: interpolate(
            frame,
            [0, 0.65 * fps],
            ["0px 0px", `${width}px 0px`],
            { ...clamp, easing: ease },
          ),
        }}
      />
    </AbsoluteFill>
  );
};
