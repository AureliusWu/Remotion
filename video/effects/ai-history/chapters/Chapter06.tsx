import { Composition, Series, useVideoConfig } from "remotion";
import { Shot21 } from "../shots/Shot21";
import { Shot22 } from "../shots/Shot22";
import { Shot23 } from "../shots/Shot23";
import { Shot24 } from "../shots/Shot24";
export const Chapter06 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="06-01 阿尔帕克评估的具体对象"
        durationInFrames={1798}
        premountFor={fps}
      >
        <Shot21 />
      </Series.Sequence>
      <Series.Sequence
        name="06-02 缩小承诺，继续研究语言"
        durationInFrames={1815}
        premountFor={fps}
      >
        <Shot22 />
      </Series.Sequence>
      <Series.Sequence
        name="06-03 英国的莱特希尔报告与争论"
        durationInFrames={1799}
        premountFor={fps}
      >
        <Shot23 />
      </Series.Sequence>
      <Series.Sequence
        name="06-04 寒冬不是全球统一的停机按钮"
        durationInFrames={1788}
        premountFor={fps}
      >
        <Shot24 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter06Composition = () => (
  <Composition
    id="AiHistoryChapter06"
    component={Chapter06}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
