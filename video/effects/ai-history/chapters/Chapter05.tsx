import { Composition, Series, useVideoConfig } from "remotion";
import { Shot17 } from "../shots/Shot17";
import { Shot18 } from "../shots/Shot18";
import { Shot19 } from "../shots/Shot19";
import { Shot20 } from "../shots/Shot20";
export const Chapter05 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="05-01 伊莱扎怎样接话"
        durationInFrames={1777}
        premountFor={fps}
      >
        <Shot17 />
      </Series.Sequence>
      <Series.Sequence
        name="05-02 熟悉的语气怎样影响判断"
        durationInFrames={1782}
        premountFor={fps}
      >
        <Shot18 />
      </Series.Sequence>
      <Series.Sequence
        name="05-03 沙基把感知、规划与行动连起来"
        durationInFrames={1830}
        premountFor={fps}
      >
        <Shot19 />
      </Series.Sequence>
      <Series.Sequence
        name="05-04 从整洁房间走向真实世界有多远"
        durationInFrames={1811}
        premountFor={fps}
      >
        <Shot20 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter05Composition = () => (
  <Composition
    id="AiHistoryChapter05"
    component={Chapter05}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
