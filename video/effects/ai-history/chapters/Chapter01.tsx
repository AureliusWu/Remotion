import { Composition, Series, useVideoConfig } from "remotion";
import { Shot01 } from "../shots/Shot01";
import { Shot02 } from "../shots/Shot02";
import { Shot03 } from "../shots/Shot03";
import { Shot04 } from "../shots/Shot04";
export const Chapter01 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="01-01 一块屏幕，几个不同的问题"
        durationInFrames={1792}
        premountFor={fps}
      >
        <Shot01 />
      </Series.Sequence>
      <Series.Sequence
        name="01-02 把大问题拆成可以检查的任务"
        durationInFrames={1810}
        premountFor={fps}
      >
        <Shot02 />
      </Series.Sequence>
      <Series.Sequence
        name="01-03 答案之外，还要看条件"
        durationInFrames={1811}
        premountFor={fps}
      >
        <Shot03 />
      </Series.Sequence>
      <Series.Sequence
        name="01-04 沿着问题，而不是神话前进"
        durationInFrames={1787}
        premountFor={fps}
      >
        <Shot04 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter01Composition = () => (
  <Composition
    id="AiHistoryChapter01"
    component={Chapter01}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
