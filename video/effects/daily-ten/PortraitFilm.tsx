import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Folder,
  Series,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { PortraitOpening } from "./PortraitOpening";
import { PortraitClosing } from "./PortraitClosing";
import { PortraitFootball } from "./PortraitFootball";
import { PortraitCalendar } from "./PortraitCalendar";
import { PortraitTrade } from "./PortraitTrade";
import { PortraitRobot } from "./PortraitRobot";
import { PortraitLoans } from "./PortraitLoans";
import { PortraitRates } from "./PortraitRates";
import { PortraitVote } from "./PortraitVote";
import { PortraitMars } from "./PortraitMars";
import { PortraitVoyager } from "./PortraitVoyager";
import { PortraitBaseball } from "./PortraitBaseball";
export const PortraitFilm = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence
          name="竖版开场"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <PortraitOpening />
        </Series.Sequence>
        <Series.Sequence
          name="01 · 中国U17女足"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitFootball />
        </Series.Sequence>
        <Series.Sequence
          name="02 · 北京汽车补贴"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitCalendar />
        </Series.Sequence>
        <Series.Sequence
          name="03 · 中秘自贸升级"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitTrade />
        </Series.Sequence>
        <Series.Sequence
          name="04 · 机器人交付"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitRobot />
        </Series.Sequence>
        <Series.Sequence
          name="05 · 科技企业融资"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitLoans />
        </Series.Sequence>
        <Series.Sequence
          name="06 · 美联储利率"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitRates />
        </Series.Sequence>
        <Series.Sequence
          name="07 · 联大表决"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitVote />
        </Series.Sequence>
        <Series.Sequence
          name="08 · 火星陨石"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitMars />
        </Series.Sequence>
        <Series.Sequence
          name="09 · 旅行者1号"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitVoyager />
        </Series.Sequence>
        <Series.Sequence
          name="10 · 世界大赛首冠"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <PortraitBaseball />
        </Series.Sequence>
        <Series.Sequence
          name="竖版片尾"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <PortraitClosing />
        </Series.Sequence>
      </Series>
      <Audio
        name="原创配乐 · 竖版"
        src={staticFile("daily-ten/music.mp3")}
        premountFor={fps}
        volume={(f) =>
          interpolate(f, [0, 2 * fps, 176 * fps, 180 * fps], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
    </AbsoluteFill>
  );
};
export const PortraitCompositions = () => (
  <Folder name="DailyTen-Portrait-Scenes">
    <Composition
      id="DailyTen-Portrait-Opening"
      component={PortraitOpening}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={600}
    />
    <Composition
      id="DailyTen-Portrait-Football"
      component={PortraitFootball}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Calendar"
      component={PortraitCalendar}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Trade"
      component={PortraitTrade}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Robot"
      component={PortraitRobot}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Loans"
      component={PortraitLoans}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Rates"
      component={PortraitRates}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Vote"
      component={PortraitVote}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Mars"
      component={PortraitMars}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Voyager"
      component={PortraitVoyager}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Baseball"
      component={PortraitBaseball}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={960}
    />
    <Composition
      id="DailyTen-Portrait-Closing"
      component={PortraitClosing}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={600}
    />
  </Folder>
);
