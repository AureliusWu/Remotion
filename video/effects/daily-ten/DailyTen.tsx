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
import { Opening } from "./Opening";
import { Closing } from "./Closing";
import { Football } from "./Football";
import { Calendar } from "./Calendar";
import { Trade } from "./Trade";
import { Robot } from "./Robot";
import { Loans } from "./Loans";
import { Rates } from "./Rates";
import { Vote } from "./Vote";
import { Mars } from "./Mars";
import { Voyager } from "./Voyager";
import { Baseball } from "./Baseball";
import { PortraitFilm, PortraitCompositions } from "./PortraitFilm";

export const DailyTen = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence
          name="开场 · 此刻世界"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <Opening />
        </Series.Sequence>
        <Series.Sequence
          name="01 · 中国U17女足"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Football />
        </Series.Sequence>
        <Series.Sequence
          name="02 · 北京汽车补贴"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Calendar />
        </Series.Sequence>
        <Series.Sequence
          name="03 · 中秘自贸升级"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Trade />
        </Series.Sequence>
        <Series.Sequence
          name="04 · 机器人交付"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Robot />
        </Series.Sequence>
        <Series.Sequence
          name="05 · 科技企业融资"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Loans />
        </Series.Sequence>
        <Series.Sequence
          name="06 · 美联储利率"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Rates />
        </Series.Sequence>
        <Series.Sequence
          name="07 · 联大表决"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Vote />
        </Series.Sequence>
        <Series.Sequence
          name="08 · 火星陨石"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Mars />
        </Series.Sequence>
        <Series.Sequence
          name="09 · 旅行者1号"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Voyager />
        </Series.Sequence>
        <Series.Sequence
          name="10 · 世界大赛首冠"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Baseball />
        </Series.Sequence>
        <Series.Sequence
          name="片尾 · 看见来处"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <Closing />
        </Series.Sequence>
      </Series>
      <Audio
        name="原创配乐 · A Window on Today"
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

export const DailyTenCompositions = () => (
  <>
    <Folder name="DailyTen-Platforms">
      <Composition
        id="DailyTen-Bilibili"
        component={DailyTen}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={10800}
      />
      <Composition
        id="DailyTen-Douyin"
        component={PortraitFilm}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={10800}
      />
    </Folder>
    <PortraitCompositions />
    <Composition
      id="DailyTen20261030"
      component={DailyTen}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={10800}
    />
    <Folder name="DailyTen-Scenes">
      <Composition
        id="DailyTen-Opening"
        component={Opening}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
      />
      <Composition
        id="DailyTen-Football"
        component={Football}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Calendar"
        component={Calendar}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Trade"
        component={Trade}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Robot"
        component={Robot}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Loans"
        component={Loans}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Rates"
        component={Rates}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Vote"
        component={Vote}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Mars"
        component={Mars}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Voyager"
        component={Voyager}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Baseball"
        component={Baseball}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="DailyTen-Closing"
        component={Closing}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
      />
    </Folder>
  </>
);
