import { Composition, Series, useVideoConfig } from "remotion";
import { Shot13 } from "../shots/Shot13";
import { Shot14 } from "../shots/Shot14";
import { Shot15 } from "../shots/Shot15";
import { Shot16 } from "../shots/Shot16";
export const Chapter04 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="04-01 让连接随例子改变"
        durationInFrames={1861}
        premountFor={fps}
      >
        <Shot13 />
      </Series.Sequence>
      <Series.Sequence
        name="04-02 一条会移动的分界线"
        durationInFrames={1845}
        premountFor={fps}
      >
        <Shot14 />
      </Series.Sequence>
      <Series.Sequence
        name="04-03 另一条路：寻找一条证明"
        durationInFrames={1725}
        premountFor={fps}
      >
        <Shot15 />
      </Series.Sequence>
      <Series.Sequence
        name="04-04 能力边界开始显形"
        durationInFrames={1769}
        premountFor={fps}
      >
        <Shot16 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter04Composition = () => (
  <Composition
    id="AiHistoryChapter04"
    component={Chapter04}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
