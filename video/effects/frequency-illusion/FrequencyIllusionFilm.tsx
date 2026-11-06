import { Audio } from "@remotion/media";
import type { Caption } from "@remotion/captions";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Folder,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import storyboard from "./storyboard.json";
import narrationTiming from "../../public/frequency-illusion/timing.json";
import {
  DenominatorArt,
  EvidenceArt,
  ExperimentArt,
  FeedArt,
  FirstStreetArt,
  FocusArt,
  LastStreetArt,
  NamingArt,
  NotebookArt,
  RuleArt,
  SameStreetArt,
  WetStreetArt,
} from "./Illustrations";

const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const mono = 'Consolas, "Microsoft YaHei", monospace';
const ease = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;
type SubtitleCue = Pick<Caption, "text" | "startMs" | "endMs">;
const timing: { scenes: { cues: SubtitleCue[] }[] } = narrationTiming;

const Subtitle = ({ index }: { index: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const now = (frame * 1000) / fps;
  const cue = timing.scenes[index]?.cues.find(
    (item) => item.startMs <= now && now < item.endMs,
  );
  if (!cue) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 140,
        right: 140,
        bottom: 54,
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "inline-block",
          color: "#fff8eb",
          background: "#121f2df2",
          padding: "11px 26px 13px",
          borderRadius: 6,
          fontSize: 36,
          lineHeight: 1.28,
          fontWeight: 650,
          letterSpacing: 0.25,
          boxShadow: "0 9px 27px #111b2529",
        }}
      >
        {cue.text}
      </span>
    </div>
  );
};

const Chapter = ({
  index,
  light = false,
  children,
}: {
  index: number;
  light?: boolean;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scene = storyboard.scenes[index];
  const foreground = light ? "#172936" : "#f9edda";
  const secondary = light ? "#405965" : "#adc4ca";
  const accent = light ? "#ad403c" : "#ff8a7a";
  const rule = light ? "#17324627" : "#d2e4df37";
  return (
    <AbsoluteFill
      style={{
        background: light
          ? "linear-gradient(140deg, #f9f1e1 0%, #ebe1d0 100%)"
          : "radial-gradient(ellipse at 69% 42%, #283c4b 0%, #142534 55%, #101b29 100%)",
        color: foreground,
        fontFamily: sans,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 104,
          right: 104,
          top: 91,
          height: 1,
          background: rule,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 104,
          top: 109,
          font: "600 21px " + sans,
          letterSpacing: 4,
          color: secondary,
        }}
      >
        眼睛会漏掉什么
      </div>
      <div
        style={{
          position: "absolute",
          right: 104,
          top: 110,
          font: "500 22px " + mono,
          letterSpacing: 2,
          color: secondary,
        }}
      >
        {scene.section} / 12
      </div>
      <div
        style={{
          position: "absolute",
          left: 788,
          top: 161,
          width: 1026,
          height: 641,
          opacity: interpolate(frame, [0, 0.43 * fps], [0.84, 1], ease),
          translate: interpolate(
            frame,
            [0, 0.64 * fps],
            ["0px 11px", "0px 0px"],
            ease,
          ),
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          left: 104,
          top: 218,
          width: 640,
          opacity: interpolate(frame, [0, 0.64 * fps], [0.2, 1], ease),
          translate: interpolate(
            frame,
            [0, 0.8 * fps],
            ["0px 17px", "0px 0px"],
            ease,
          ),
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 15,
            alignItems: "center",
            color: accent,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            marginBottom: 25,
          }}
        >
          <span
            style={{
              display: "block",
              width: 34,
              height: 2,
              background: accent,
            }}
          />
          {scene.sticker}
        </div>
        <div
          style={{
            color: foreground,
            fontSize: index === 2 ? 108 : 76,
            lineHeight: 1.16,
            fontWeight: 750,
            letterSpacing: -2.2,
            textWrap: "balance",
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 36,
            lineHeight: 1.56,
            fontWeight: 480,
            color: secondary,
            whiteSpace: "pre-line",
          }}
        >
          {scene.deck}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 104,
          right: 104,
          top: 830,
          height: 1,
          background: rule,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 104,
          top: 850,
          color: secondary,
          fontSize: 22,
          letterSpacing: 1,
        }}
      >
        {scene.note}
      </div>
      <div
        style={{
          position: "absolute",
          right: 104,
          top: 850,
          color: secondary,
          fontSize: 22,
          textAlign: "right",
        }}
      >
        {scene.source}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 4,
          background: accent,
          opacity: 0.82,
          width: (100 * (index + Math.min(1, frame / (15 * fps)))) / 12 + "%",
        }}
      />
      <Subtitle index={index} />
    </AbsoluteFill>
  );
};

export const FrequencyIllusionFilm = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Audio
        name="主旁白 · 频率错觉"
        src={staticFile("frequency-illusion/narration.wav")}
        premountFor={fps}
      />
      <Audio
        name="原创配乐 · 安静电钢琴"
        src={staticFile("poisson-process/quiet-pages-music.mp3")}
        premountFor={fps}
      />
      <Series>
        <Series.Sequence
          name="01 · 第三把红伞"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={0}>
            <FirstStreetArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="02 · 同一街角复看"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={1}>
            <SameStreetArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="03 · 频率错觉"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={2} light>
            <NamingArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="04 · 选择性注意"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={3}>
            <FocusArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="05 · 数白队传球"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={4}>
            <ExperimentArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="06 · 确认偏误"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={5} light>
            <EvidenceArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="07 · 数字规则"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={6} light>
            <RuleArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="08 · 个人信息流"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={7}>
            <FeedArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="09 · 可能真增长"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={8}>
            <WetStreetArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="10 · 先看分母"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={9} light>
            <DenominatorArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="11 · 提前约定怎么观察"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={10} light>
            <NotebookArt />
          </Chapter>
        </Series.Sequence>
        <Series.Sequence
          name="12 · 再看一眼"
          durationInFrames={15 * fps}
          premountFor={fps}
        >
          <Chapter index={11}>
            <LastStreetArt />
          </Chapter>
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};

export const FrequencyIllusionCompositions = () => (
  <Folder name="FrequencyIllusion">
    <Composition
      id="FrequencyIllusion-Bilibili"
      component={FrequencyIllusionFilm}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={10800}
    />
  </Folder>
);
