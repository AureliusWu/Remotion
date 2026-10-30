import { Composition, Series, useVideoConfig } from "remotion";
import { Shot09 } from "../shots/Shot09";
import { Shot10 } from "../shots/Shot10";
import { Shot11 } from "../shots/Shot11";
import { Shot12 } from "../shots/Shot12";
export const Chapter03 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="03-01 先有一份提案"
        durationInFrames={1788}
        premountFor={fps}
      >
        <Shot09 />
      </Series.Sequence>
      <Series.Sequence
        name="03-02 把雄心展开成研究清单"
        durationInFrames={1866}
        premountFor={fps}
      >
        <Shot10 />
      </Series.Sequence>
      <Series.Sequence
        name="03-03 夏天并没有交出万能机器"
        durationInFrames={1773}
        premountFor={fps}
      >
        <Shot11 />
      </Series.Sequence>
      <Series.Sequence
        name="03-04 从名字回到可以运行的工作"
        durationInFrames={1773}
        premountFor={fps}
      >
        <Shot12 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter03Composition = () => (
  <Composition
    id="AiHistoryChapter03"
    component={Chapter03}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
