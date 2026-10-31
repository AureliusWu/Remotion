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
import { WeeklyProvider } from "./WeeklyEdition";
import { WeeklyOpening } from "./WeeklyOpening";
import { WeeklyClosing } from "./WeeklyClosing";
import { Scene01 } from "./Scene01";
import { Scene02 } from "./Scene02";
import { Scene03 } from "./Scene03";
import { Scene04 } from "./Scene04";
import { Scene05 } from "./Scene05";
import { Scene06 } from "./Scene06";
import { Scene07 } from "./Scene07";
import { Scene08 } from "./Scene08";
import { Scene09 } from "./Scene09";
import { Scene10 } from "./Scene10";
const OpeningScene = () => (
  <WeeklyProvider>
    <WeeklyOpening />
  </WeeklyProvider>
);
const ClosingScene = () => (
  <WeeklyProvider>
    <WeeklyClosing />
  </WeeklyProvider>
);
export const WeeklyFilm = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence
          name="本周 · 开场"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <OpeningScene />
        </Series.Sequence>
        <Series.Sequence
          name="01 · 出游数据"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene01 />
        </Series.Sequence>
        <Series.Sequence
          name="02 · 双十一提示"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene02 />
        </Series.Sequence>
        <Series.Sequence
          name="03 · 短池游泳"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene03 />
        </Series.Sequence>
        <Series.Sequence
          name="04 · 火星尘埃"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene04 />
        </Series.Sequence>
        <Series.Sequence
          name="05 · 音像遗产"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene05 />
        </Series.Sequence>
        <Series.Sequence
          name="06 · 利率决议"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene06 />
        </Series.Sequence>
        <Series.Sequence
          name="07 · 联大投票"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene07 />
        </Series.Sequence>
        <Series.Sequence
          name="08 · 世界大赛"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene08 />
        </Series.Sequence>
        <Series.Sequence
          name="09 · 机器人交付"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene09 />
        </Series.Sequence>
        <Series.Sequence
          name="10 · U17女足"
          durationInFrames={16 * fps}
          premountFor={fps}
        >
          <Scene10 />
        </Series.Sequence>
        <Series.Sequence
          name="本周 · 收束"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <ClosingScene />
        </Series.Sequence>
      </Series>
      <Audio
        name="原创配乐 · 周报"
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
export const WeeklyCompositions = () => (
  <Folder name="WeeklyTen-20261030">
    <Composition
      id="WeeklyTen-Bilibili"
      component={WeeklyFilm}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={10800}
    />
    <Composition
      id="WeeklyTen-Douyin"
      component={WeeklyFilm}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={10800}
    />
    <Folder name="Landscape-Scenes">
      <Composition
        id="WeeklyTen-Opening"
        component={OpeningScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
      />
      <Composition
        id="WeeklyTen-Tourism"
        component={Scene01}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Shopping"
        component={Scene02}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Swimming"
        component={Scene03}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-MarsDust"
        component={Scene04}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Archive"
        component={Scene05}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Rates"
        component={Scene06}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Vote"
        component={Scene07}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Baseball"
        component={Scene08}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Robot"
        component={Scene09}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Football"
        component={Scene10}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Closing"
        component={ClosingScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
      />
    </Folder>
    <Folder name="Portrait-Scenes">
      <Composition
        id="WeeklyTen-Portrait-Opening"
        component={OpeningScene}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={600}
      />
      <Composition
        id="WeeklyTen-Portrait-Tourism"
        component={Scene01}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Shopping"
        component={Scene02}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Swimming"
        component={Scene03}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-MarsDust"
        component={Scene04}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Archive"
        component={Scene05}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Rates"
        component={Scene06}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Vote"
        component={Scene07}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Baseball"
        component={Scene08}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Robot"
        component={Scene09}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Football"
        component={Scene10}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={960}
      />
      <Composition
        id="WeeklyTen-Portrait-Closing"
        component={ClosingScene}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={600}
      />
    </Folder>
  </Folder>
);
