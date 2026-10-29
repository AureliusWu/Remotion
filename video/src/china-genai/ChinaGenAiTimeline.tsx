import { Audio } from "@remotion/media";
import {
  Composition,
  Folder,
  Series,
  staticFile,
  useVideoConfig,
} from "remotion";
import { LatestScene } from "./LatestScene";
import { HistoryScene } from "./HistoryScene";
import { GrowthScene } from "./GrowthScene";
import { PenetrationScene } from "./PenetrationScene";
import { UsesScene } from "./UsesScene";
import { MethodScene } from "./MethodScene";

export const ChinaGenAiTimeline: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="01 最新公开规模"
        durationInFrames={10 * fps}
        premountFor={fps}
      >
        <LatestScene />
        <Audio
          name="01 中文旁白"
          src={staticFile("china-genai/01-latest.mp3")}
          from={0.6 * fps}
          premountFor={fps}
        />
      </Series.Sequence>
      <Series.Sequence
        name="02 历史公开记录"
        durationInFrames={14 * fps}
        premountFor={fps}
      >
        <HistoryScene />
        <Audio
          name="02 中文旁白"
          src={staticFile("china-genai/02-history.mp3")}
          from={0.6 * fps}
          premountFor={fps}
        />
      </Series.Sequence>
      <Series.Sequence
        name="03 2025年规模增量"
        durationInFrames={10 * fps}
        premountFor={fps}
      >
        <GrowthScene />
        <Audio
          name="03 中文旁白"
          src={staticFile("china-genai/03-growth.mp3")}
          from={0.6 * fps}
          premountFor={fps}
        />
      </Series.Sequence>
      <Series.Sequence
        name="04 使用覆盖过半"
        durationInFrames={8 * fps}
        premountFor={fps}
      >
        <PenetrationScene />
        <Audio
          name="04 中文旁白"
          src={staticFile("china-genai/04-penetration.mp3")}
          from={0.6 * fps}
          premountFor={fps}
        />
      </Series.Sequence>
      <Series.Sequence
        name="05 主要使用场景"
        durationInFrames={10 * fps}
        premountFor={fps}
      >
        <UsesScene />
        <Audio
          name="05 中文旁白"
          src={staticFile("china-genai/05-uses.mp3")}
          from={0.6 * fps}
          premountFor={fps}
        />
      </Series.Sequence>
      <Series.Sequence
        name="06 统计时点与来源"
        durationInFrames={8 * fps}
        premountFor={fps}
      >
        <MethodScene />
        <Audio
          name="06 中文旁白"
          src={staticFile("china-genai/06-method.mp3")}
          from={0.6 * fps}
          premountFor={fps}
        />
      </Series.Sequence>
    </Series>
  );
};

export const ChinaGenAiCompositions = () => (
  <>
    <Composition
      id="ChinaGenAiTimeline"
      component={ChinaGenAiTimeline}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={3600}
      defaultProps={{}}
    />
    <Folder name="GenAiScenes">
      <Composition
        id="GenAiLatest"
        component={LatestScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
        defaultProps={{}}
      />
      <Composition
        id="GenAiHistory"
        component={HistoryScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={840}
        defaultProps={{}}
      />
      <Composition
        id="GenAiGrowth"
        component={GrowthScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
        defaultProps={{}}
      />
      <Composition
        id="GenAiPenetration"
        component={PenetrationScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={480}
        defaultProps={{}}
      />
      <Composition
        id="GenAiUses"
        component={UsesScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={600}
        defaultProps={{}}
      />
      <Composition
        id="GenAiMethod"
        component={MethodScene}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={480}
        defaultProps={{}}
      />
    </Folder>
  </>
);
