import { Composition, Series, useVideoConfig } from "remotion";
import { Shot45 } from "../shots/Shot45";
import { Shot46 } from "../shots/Shot46";
import { Shot47 } from "../shots/Shot47";
import { Shot48 } from "../shots/Shot48";
export const Chapter12 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="12-01 先从大量文本中学习"
        durationInFrames={1834}
        premountFor={fps}
      >
        <Shot45 />
      </Series.Sequence>
      <Series.Sequence
        name="12-02 从填空理解上下文"
        durationInFrames={1776}
        premountFor={fps}
      >
        <Shot46 />
      </Series.Sequence>
      <Series.Sequence
        name="12-03 规模化是一条经验规律"
        durationInFrames={1831}
        premountFor={fps}
      >
        <Shot47 />
      </Series.Sequence>
      <Series.Sequence
        name="12-04 对话改变了入口"
        durationInFrames={1759}
        premountFor={fps}
      >
        <Shot48 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter12Composition = () => (
  <Composition
    id="AiHistoryChapter12"
    component={Chapter12}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
