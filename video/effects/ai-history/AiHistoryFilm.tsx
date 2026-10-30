import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Folder,
  Series,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Chapter01, Chapter01Composition } from "./chapters/Chapter01";
import { Chapter02, Chapter02Composition } from "./chapters/Chapter02";
import { Chapter03, Chapter03Composition } from "./chapters/Chapter03";
import { Chapter04, Chapter04Composition } from "./chapters/Chapter04";
import { Chapter05, Chapter05Composition } from "./chapters/Chapter05";
import { Chapter06, Chapter06Composition } from "./chapters/Chapter06";
import { Chapter07, Chapter07Composition } from "./chapters/Chapter07";
import { Chapter08, Chapter08Composition } from "./chapters/Chapter08";
import { Chapter09, Chapter09Composition } from "./chapters/Chapter09";
import { Chapter10, Chapter10Composition } from "./chapters/Chapter10";
import { Chapter11, Chapter11Composition } from "./chapters/Chapter11";
import { Chapter12, Chapter12Composition } from "./chapters/Chapter12";
import { Chapter13, Chapter13Composition } from "./chapters/Chapter13";
import { Chapter14, Chapter14Composition } from "./chapters/Chapter14";
import { Chapter15, Chapter15Composition } from "./chapters/Chapter15";
import { Shot01Composition } from "./shots/Shot01";
import { Shot02Composition } from "./shots/Shot02";
import { Shot03Composition } from "./shots/Shot03";
import { Shot04Composition } from "./shots/Shot04";
import { Shot05Composition } from "./shots/Shot05";
import { Shot06Composition } from "./shots/Shot06";
import { Shot07Composition } from "./shots/Shot07";
import { Shot08Composition } from "./shots/Shot08";
import { Shot09Composition } from "./shots/Shot09";
import { Shot10Composition } from "./shots/Shot10";
import { Shot11Composition } from "./shots/Shot11";
import { Shot12Composition } from "./shots/Shot12";
import { Shot13Composition } from "./shots/Shot13";
import { Shot14Composition } from "./shots/Shot14";
import { Shot15Composition } from "./shots/Shot15";
import { Shot16Composition } from "./shots/Shot16";
import { Shot17Composition } from "./shots/Shot17";
import { Shot18Composition } from "./shots/Shot18";
import { Shot19Composition } from "./shots/Shot19";
import { Shot20Composition } from "./shots/Shot20";
import { Shot21Composition } from "./shots/Shot21";
import { Shot22Composition } from "./shots/Shot22";
import { Shot23Composition } from "./shots/Shot23";
import { Shot24Composition } from "./shots/Shot24";
import { Shot25Composition } from "./shots/Shot25";
import { Shot26Composition } from "./shots/Shot26";
import { Shot27Composition } from "./shots/Shot27";
import { Shot28Composition } from "./shots/Shot28";
import { Shot29Composition } from "./shots/Shot29";
import { Shot30Composition } from "./shots/Shot30";
import { Shot31Composition } from "./shots/Shot31";
import { Shot32Composition } from "./shots/Shot32";
import { Shot33Composition } from "./shots/Shot33";
import { Shot34Composition } from "./shots/Shot34";
import { Shot35Composition } from "./shots/Shot35";
import { Shot36Composition } from "./shots/Shot36";
import { Shot37Composition } from "./shots/Shot37";
import { Shot38Composition } from "./shots/Shot38";
import { Shot39Composition } from "./shots/Shot39";
import { Shot40Composition } from "./shots/Shot40";
import { Shot41Composition } from "./shots/Shot41";
import { Shot42Composition } from "./shots/Shot42";
import { Shot43Composition } from "./shots/Shot43";
import { Shot44Composition } from "./shots/Shot44";
import { Shot45Composition } from "./shots/Shot45";
import { Shot46Composition } from "./shots/Shot46";
import { Shot47Composition } from "./shots/Shot47";
import { Shot48Composition } from "./shots/Shot48";
import { Shot49Composition } from "./shots/Shot49";
import { Shot50Composition } from "./shots/Shot50";
import { Shot51Composition } from "./shots/Shot51";
import { Shot52Composition } from "./shots/Shot52";
import { Shot53Composition } from "./shots/Shot53";
import { Shot54Composition } from "./shots/Shot54";
import { Shot55Composition } from "./shots/Shot55";
import { Shot56Composition } from "./shots/Shot56";
import { Shot57Composition } from "./shots/Shot57";
import { Shot58Composition } from "./shots/Shot58";
import { Shot59Composition } from "./shots/Shot59";
import { Shot60Composition } from "./shots/Shot60";
export const AiHistoryFilm = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Series>
        <Series.Sequence
          name="01 机器会思考吗"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter01 />
        </Series.Sequence>
        <Series.Sequence
          name="02 让计算与推理拥有形式"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter02 />
        </Series.Sequence>
        <Series.Sequence
          name="03 达特茅斯：一个领域得到名字"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter03 />
        </Series.Sequence>
        <Series.Sequence
          name="04 感知机与符号推理"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter04 />
        </Series.Sequence>
        <Series.Sequence
          name="05 会回应的程序，会规划的机器人"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter05 />
        </Series.Sequence>
        <Series.Sequence
          name="06 低潮：承诺遇到现实"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter06 />
        </Series.Sequence>
        <Series.Sequence
          name="07 把专家经验写进规则"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter07 />
        </Series.Sequence>
        <Series.Sequence
          name="08 反向传播与连接主义回归"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter08 />
        </Series.Sequence>
        <Series.Sequence
          name="09 从规则走向统计学习"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter09 />
        </Series.Sequence>
        <Series.Sequence
          name="10 专门胜利与视觉转折"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter10 />
        </Series.Sequence>
        <Series.Sequence
          name="11 从围棋到注意力"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter11 />
        </Series.Sequence>
        <Series.Sequence
          name="12 预训练与对话入口"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter12 />
        </Series.Sequence>
        <Series.Sequence
          name="13 当模型开始生成图像"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter13 />
        </Series.Sequence>
        <Series.Sequence
          name="14 能力进入现实之后"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter14 />
        </Series.Sequence>
        <Series.Sequence
          name="15 把选择交回人的生活"
          durationInFrames={7200}
          premountFor={fps}
        >
          <Chapter15 />
        </Series.Sequence>
      </Series>
      <Audio
        name="原创配乐 Questions Across Time"
        src={staticFile("ai-history/music.mp3")}
        durationInFrames={108000}
        premountFor={fps}
      />
    </AbsoluteFill>
  );
};
export const AiHistoryCompositions = () => (
  <>
    <Composition
      id="AiHistory30m"
      component={AiHistoryFilm}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={108000}
      defaultProps={{}}
    />
    <Folder name="AiHistoryChapters">
      <Chapter01Composition />
      <Chapter02Composition />
      <Chapter03Composition />
      <Chapter04Composition />
      <Chapter05Composition />
      <Chapter06Composition />
      <Chapter07Composition />
      <Chapter08Composition />
      <Chapter09Composition />
      <Chapter10Composition />
      <Chapter11Composition />
      <Chapter12Composition />
      <Chapter13Composition />
      <Chapter14Composition />
      <Chapter15Composition />
    </Folder>
    <Folder name="AiHistoryShots">
      <Shot01Composition />
      <Shot02Composition />
      <Shot03Composition />
      <Shot04Composition />
      <Shot05Composition />
      <Shot06Composition />
      <Shot07Composition />
      <Shot08Composition />
      <Shot09Composition />
      <Shot10Composition />
      <Shot11Composition />
      <Shot12Composition />
      <Shot13Composition />
      <Shot14Composition />
      <Shot15Composition />
      <Shot16Composition />
      <Shot17Composition />
      <Shot18Composition />
      <Shot19Composition />
      <Shot20Composition />
      <Shot21Composition />
      <Shot22Composition />
      <Shot23Composition />
      <Shot24Composition />
      <Shot25Composition />
      <Shot26Composition />
      <Shot27Composition />
      <Shot28Composition />
      <Shot29Composition />
      <Shot30Composition />
      <Shot31Composition />
      <Shot32Composition />
      <Shot33Composition />
      <Shot34Composition />
      <Shot35Composition />
      <Shot36Composition />
      <Shot37Composition />
      <Shot38Composition />
      <Shot39Composition />
      <Shot40Composition />
      <Shot41Composition />
      <Shot42Composition />
      <Shot43Composition />
      <Shot44Composition />
      <Shot45Composition />
      <Shot46Composition />
      <Shot47Composition />
      <Shot48Composition />
      <Shot49Composition />
      <Shot50Composition />
      <Shot51Composition />
      <Shot52Composition />
      <Shot53Composition />
      <Shot54Composition />
      <Shot55Composition />
      <Shot56Composition />
      <Shot57Composition />
      <Shot58Composition />
      <Shot59Composition />
      <Shot60Composition />
    </Folder>
  </>
);
