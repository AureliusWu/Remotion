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
import { AiProvider } from "./AiEdition";
import { AiOpening } from "./AiOpening";
import { AiClosing } from "./AiClosing";
import { Scene01 } from "./Scene01";
import { Scene02 } from "./Scene02";
import { Scene03 } from "./Scene03";
import { Scene04 } from "./Scene04";
import { Scene05 } from "./Scene05";
import { Scene06 } from "./Scene06";
import { Scene07 } from "./Scene07";
import { Scene08 } from "./Scene08";
import { Scene09 } from "./Scene09";

const OpeningScene = () => (
  <AiProvider>
    <AiOpening />
  </AiProvider>
);
const ClosingScene = () => (
  <AiProvider>
    <AiClosing />
  </AiProvider>
);

export const AiFilm = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence
          name="AI一周 · 开场"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <OpeningScene />
        </Series.Sequence>
        <Series.Sequence
          name="01 · 模型与电脑操作"
          durationInFrames={18 * fps}
          premountFor={fps}
        >
          <Scene01 />
        </Series.Sequence>
        <Series.Sequence
          name="02 · 智能体基础设施"
          durationInFrames={18 * fps}
          premountFor={fps}
        >
          <Scene02 />
        </Series.Sequence>
        <Series.Sequence
          name="03 · 长文档识别"
          durationInFrames={18 * fps}
          premountFor={fps}
        >
          <Scene03 />
        </Series.Sequence>
        <Series.Sequence
          name="04 · 药物研发早期案例"
          durationInFrames={18 * fps}
          premountFor={fps}
        >
          <Scene04 />
        </Series.Sequence>
        <Series.Sequence
          name="05 · AI素养与来源核对"
          durationInFrames={18 * fps}
          premountFor={fps}
        >
          <Scene05 />
        </Series.Sequence>
        <Series.Sequence
          name="06 · 代码生成研究"
          durationInFrames={18 * fps}
          premountFor={fps}
        >
          <Scene06 />
        </Series.Sequence>
        <Series.Sequence
          name="07 · AI参与研究"
          durationInFrames={18 * fps}
          premountFor={fps}
        >
          <Scene07 />
        </Series.Sequence>
        <Series.Sequence
          name="08 · 网络安全防御"
          durationInFrames={17 * fps}
          premountFor={fps}
        >
          <Scene08 />
        </Series.Sequence>
        <Series.Sequence
          name="09 · 机器人世界模型"
          durationInFrames={17 * fps}
          premountFor={fps}
        >
          <Scene09 />
        </Series.Sequence>
        <Series.Sequence
          name="AI一周 · 收束"
          durationInFrames={10 * fps}
          premountFor={fps}
        >
          <ClosingScene />
        </Series.Sequence>
      </Series>
      <Audio
        name="原创配乐 · AI一周"
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

export const AiWeeklyCompositions = () => (
  <Folder name="AiWeekly-20261030">
    <Composition
      id="AiWeekly-Bilibili"
      component={AiFilm}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={10800}
    />
    <Composition
      id="AiWeekly-Douyin"
      component={AiFilm}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={10800}
    />
    <Folder name="Landscape-Scenes">
      <Composition
        id="AiWeekly-Opening"
        component={OpeningScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
      />
      <Composition
        id="AiWeekly-Terra"
        component={Scene01}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Infrastructure"
        component={Scene02}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Document"
        component={Scene03}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Research"
        component={Scene04}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Literacy"
        component={Scene05}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Diffusion"
        component={Scene06}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Training"
        component={Scene07}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Security"
        component={Scene08}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1020}
      />
      <Composition
        id="AiWeekly-Robotics"
        component={Scene09}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1020}
      />
      <Composition
        id="AiWeekly-Closing"
        component={ClosingScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
      />
    </Folder>
    <Folder name="Portrait-Scenes">
      <Composition
        id="AiWeekly-Portrait-Opening"
        component={OpeningScene}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={600}
      />
      <Composition
        id="AiWeekly-Portrait-Terra"
        component={Scene01}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Portrait-Infrastructure"
        component={Scene02}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Portrait-Document"
        component={Scene03}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Portrait-Research"
        component={Scene04}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Portrait-Literacy"
        component={Scene05}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Portrait-Diffusion"
        component={Scene06}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Portrait-Training"
        component={Scene07}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1080}
      />
      <Composition
        id="AiWeekly-Portrait-Security"
        component={Scene08}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1020}
      />
      <Composition
        id="AiWeekly-Portrait-Robotics"
        component={Scene09}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1020}
      />
      <Composition
        id="AiWeekly-Portrait-Closing"
        component={ClosingScene}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={600}
      />
    </Folder>
  </Folder>
);
