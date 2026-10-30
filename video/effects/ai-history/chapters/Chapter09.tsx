import { Composition, Series, useVideoConfig } from "remotion";
import { Shot33 } from "../shots/Shot33";
import { Shot34 } from "../shots/Shot34";
import { Shot35 } from "../shots/Shot35";
import { Shot36 } from "../shots/Shot36";
export const Chapter09 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="09-01 让样本参与设计"
        durationInFrames={1911}
        premountFor={fps}
      >
        <Shot33 />
      </Series.Sequence>
      <Series.Sequence
        name="09-02 支持向量机的间隔"
        durationInFrames={1781}
        premountFor={fps}
      >
        <Shot34 />
      </Series.Sequence>
      <Series.Sequence
        name="09-03 把不确定性放进模型"
        durationInFrames={1785}
        premountFor={fps}
      >
        <Shot35 />
      </Series.Sequence>
      <Series.Sequence
        name="09-04 数据也要接受检查"
        durationInFrames={1723}
        premountFor={fps}
      >
        <Shot36 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter09Composition = () => (
  <Composition
    id="AiHistoryChapter09"
    component={Chapter09}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
