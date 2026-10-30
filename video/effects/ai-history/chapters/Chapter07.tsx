import { Composition, Series, useVideoConfig } from "remotion";
import { Shot25 } from "../shots/Shot25";
import { Shot26 } from "../shots/Shot26";
import { Shot27 } from "../shots/Shot27";
import { Shot28 } from "../shots/Shot28";
export const Chapter07 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="07-01 麦辛：窄领域里的推理"
        durationInFrames={1785}
        premountFor={fps}
      >
        <Shot25 />
      </Series.Sequence>
      <Series.Sequence
        name="07-02 规则库让经验可以被检查"
        durationInFrames={1773}
        premountFor={fps}
      >
        <Shot26 />
      </Series.Sequence>
      <Series.Sequence
        name="07-03 从论文走向订单配置"
        durationInFrames={1787}
        premountFor={fps}
      >
        <Shot27 />
      </Series.Sequence>
      <Series.Sequence
        name="07-04 繁荣之后，维护账单浮现"
        durationInFrames={1855}
        premountFor={fps}
      >
        <Shot28 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter07Composition = () => (
  <Composition
    id="AiHistoryChapter07"
    component={Chapter07}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
