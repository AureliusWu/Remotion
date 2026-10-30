import { Composition, Series, useVideoConfig } from "remotion";
import { Shot53 } from "../shots/Shot53";
import { Shot54 } from "../shots/Shot54";
import { Shot55 } from "../shots/Shot55";
import { Shot56 } from "../shots/Shot56";
export const Chapter14 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="14-01 把进步落到具体任务"
        durationInFrames={1911}
        premountFor={fps}
      >
        <Shot53 />
      </Series.Sequence>
      <Series.Sequence
        name="14-02 一张榜单装不下可靠性"
        durationInFrames={1829}
        premountFor={fps}
      >
        <Shot54 />
      </Series.Sequence>
      <Series.Sequence
        name="14-03 平均值也会遮住人"
        durationInFrames={1795}
        premountFor={fps}
      >
        <Shot55 />
      </Series.Sequence>
      <Series.Sequence
        name="14-04 计算背后有物理成本"
        durationInFrames={1665}
        premountFor={fps}
      >
        <Shot56 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter14Composition = () => (
  <Composition
    id="AiHistoryChapter14"
    component={Chapter14}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
