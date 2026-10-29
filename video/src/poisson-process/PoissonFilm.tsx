import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Folder,
  Interactive,
  interpolate,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { EncountersScene } from "./EncountersScene";
import { CountingScene } from "./CountingScene";
import { AssumptionsScene } from "./AssumptionsScene";
import { CountsScene } from "./CountsScene";
import { WaitingScene } from "./WaitingScene";
import { MemoryScene } from "./MemoryScene";
import { HistoryScene } from "./HistoryScene";
import { LimitsScene } from "./LimitsScene";
import { EndingScene } from "./EndingScene";
import { Subtitles } from "./Subtitles";
import { clamp, colors } from "./shared";

export const PoissonFilm: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.night }}>
      <Series>
        <Series.Sequence
          name="01 等待与偶遇"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <EncountersScene />
          <Audio
            name="01 书店旁白"
            src={staticFile("poisson-process/01-encounters.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={0} />
        </Series.Sequence>
        <Series.Sequence
          name="02 计数过程"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <CountingScene />
          <Audio
            name="02 时间轴旁白"
            src={staticFile("poisson-process/02-counting.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={1} />
        </Series.Sequence>
        <Series.Sequence
          name="03 模型条件"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <AssumptionsScene />
          <Audio
            name="03 条件旁白"
            src={staticFile("poisson-process/03-assumptions.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={2} />
        </Series.Sequence>
        <Series.Sequence
          name="04 泊松计数"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <CountsScene />
          <Audio
            name="04 分布旁白"
            src={staticFile("poisson-process/04-counts.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={3} />
        </Series.Sequence>
        <Series.Sequence
          name="05 指数等待"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <WaitingScene />
          <Audio
            name="05 等待旁白"
            src={staticFile("poisson-process/05-waiting.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={4} />
        </Series.Sequence>
        <Series.Sequence
          name="06 无记忆性"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <MemoryScene />
          <Audio
            name="06 无记忆旁白"
            src={staticFile("poisson-process/06-memory.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={5} />
        </Series.Sequence>
        <Series.Sequence
          name="07 概率与人的判断"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <HistoryScene />
          <Audio
            name="07 历史旁白"
            src={staticFile("poisson-process/07-history.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={6} />
        </Series.Sequence>
        <Series.Sequence
          name="08 模型的边界"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <LimitsScene />
          <Audio
            name="08 边界旁白"
            src={staticFile("poisson-process/08-limits.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={7} />
        </Series.Sequence>
        <Series.Sequence
          name="09 为相逢留一点空间"
          durationInFrames={20 * fps}
          premountFor={fps}
        >
          <EndingScene />
          <Audio
            name="09 片尾旁白"
            src={staticFile("poisson-process/09-ending.mp3")}
            from={0.7 * fps}
            premountFor={fps}
          />
          <Subtitles track={8} />
        </Series.Sequence>
      </Series>
      <Audio
        name="原创轻音乐"
        src={staticFile("poisson-process/quiet-pages-music.mp3")}
        durationInFrames={180 * fps}
        premountFor={fps}
        volume={interpolate(
          frame,
          [0, 3 * fps, 176 * fps, 180 * fps],
          [0, 1, 1, 0],
          clamp,
        )}
      />
      <Interactive.Div
        name="片尾淡出"
        premountFor={fps}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: colors.night,
          pointerEvents: "none",
          opacity: interpolate(frame, [179.2 * fps, 180 * fps], [0, 1], clamp),
        }}
      />
    </AbsoluteFill>
  );
};

export const PoissonCompositions = () => (
  <>
    <Composition
      id="PoissonEncounters"
      component={PoissonFilm}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={10800}
      defaultProps={{}}
    />
    <Folder name="PoissonScenes">
      <Composition
        id="PoissonOpening"
        component={EncountersScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonCounting"
        component={CountingScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonAssumptions"
        component={AssumptionsScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonCounts"
        component={CountsScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonWaiting"
        component={WaitingScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonMemory"
        component={MemoryScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonHistory"
        component={HistoryScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonLimits"
        component={LimitsScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
      <Composition
        id="PoissonEnding"
        component={EndingScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1200}
        defaultProps={{}}
      />
    </Folder>
  </>
);
