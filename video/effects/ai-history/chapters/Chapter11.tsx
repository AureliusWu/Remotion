import { Composition, Series, useVideoConfig } from "remotion";
import { Shot41 } from "../shots/Shot41";
import { Shot42 } from "../shots/Shot42";
import { Shot43 } from "../shots/Shot43";
import { Shot44 } from "../shots/Shot44";
export const Chapter11 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="11-01 围棋中的学习与搜索"
        durationInFrames={1742}
        premountFor={fps}
      >
        <Shot41 />
      </Series.Sequence>
      <Series.Sequence
        name="11-02 棋盘之外还有距离"
        durationInFrames={1835}
        premountFor={fps}
      >
        <Shot42 />
      </Series.Sequence>
      <Series.Sequence
        name="11-03 一句话中的远近关系"
        durationInFrames={1803}
        premountFor={fps}
      >
        <Shot43 />
      </Series.Sequence>
      <Series.Sequence
        name="11-04 一种架构，多种任务"
        durationInFrames={1820}
        premountFor={fps}
      >
        <Shot44 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter11Composition = () => (
  <Composition
    id="AiHistoryChapter11"
    component={Chapter11}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
