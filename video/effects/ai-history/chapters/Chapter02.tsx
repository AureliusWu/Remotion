import { Composition, Series, useVideoConfig } from "remotion";
import { Shot05 } from "../shots/Shot05";
import { Shot06 } from "../shots/Shot06";
import { Shot07 } from "../shots/Shot07";
import { Shot08 } from "../shots/Shot08";
export const Chapter02 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="02-01 一条纸带上的计算"
        durationInFrames={1816}
        premountFor={fps}
      >
        <Shot05 />
      </Series.Sequence>
      <Series.Sequence
        name="02-02 神经元成为逻辑单元"
        durationInFrames={1793}
        premountFor={fps}
      >
        <Shot06 />
      </Series.Sequence>
      <Series.Sequence
        name="02-03 图灵换了一种提问方式"
        durationInFrames={1735}
        premountFor={fps}
      >
        <Shot07 />
      </Series.Sequence>
      <Series.Sequence
        name="02-04 执行规则与获得规则"
        durationInFrames={1856}
        premountFor={fps}
      >
        <Shot08 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter02Composition = () => (
  <Composition
    id="AiHistoryChapter02"
    component={Chapter02}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
