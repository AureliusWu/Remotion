import { Composition, Series, useVideoConfig } from "remotion";
import { Shot29 } from "../shots/Shot29";
import { Shot30 } from "../shots/Shot30";
import { Shot31 } from "../shots/Shot31";
import { Shot32 } from "../shots/Shot32";
export const Chapter08 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="08-01 中间那层，应该怎样学"
        durationInFrames={1844}
        premountFor={fps}
      >
        <Shot29 />
      </Series.Sequence>
      <Series.Sequence
        name="08-02 前向计算，反向求导"
        durationInFrames={1788}
        premountFor={fps}
      >
        <Shot30 />
      </Series.Sequence>
      <Series.Sequence
        name="08-03 学习的不只是最后一道分界"
        durationInFrames={1822}
        premountFor={fps}
      >
        <Shot31 />
      </Series.Sequence>
      <Series.Sequence
        name="08-04 方法回归，困难并未消失"
        durationInFrames={1746}
        premountFor={fps}
      >
        <Shot32 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter08Composition = () => (
  <Composition
    id="AiHistoryChapter08"
    component={Chapter08}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
