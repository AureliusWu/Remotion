import { Composition, Series, useVideoConfig } from "remotion";
import { Shot57 } from "../shots/Shot57";
import { Shot58 } from "../shots/Shot58";
import { Shot59 } from "../shots/Shot59";
import { Shot60 } from "../shots/Shot60";
export const Chapter15 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="15-01 回到一天里的小选择"
        durationInFrames={1810}
        premountFor={fps}
      >
        <Shot57 />
      </Series.Sequence>
      <Series.Sequence
        name="15-02 责任不能留在黑箱里"
        durationInFrames={1846}
        premountFor={fps}
      >
        <Shot58 />
      </Series.Sequence>
      <Series.Sequence
        name="15-03 未来需要更好的问题"
        durationInFrames={1717}
        premountFor={fps}
      >
        <Shot59 />
      </Series.Sequence>
      <Series.Sequence
        name="15-04 历史继续，由人参与"
        durationInFrames={1827}
        premountFor={fps}
      >
        <Shot60 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter15Composition = () => (
  <Composition
    id="AiHistoryChapter15"
    component={Chapter15}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
