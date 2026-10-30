import { Composition, Series, useVideoConfig } from "remotion";
import { Shot37 } from "../shots/Shot37";
import { Shot38 } from "../shots/Shot38";
import { Shot39 } from "../shots/Shot39";
import { Shot40 } from "../shots/Shot40";
export const Chapter10 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="10-01 深蓝赢下的是棋局"
        durationInFrames={1767}
        premountFor={fps}
      >
        <Shot37 />
      </Series.Sequence>
      <Series.Sequence
        name="10-02 先修建共同考场"
        durationInFrames={1807}
        premountFor={fps}
      >
        <Shot38 />
      </Series.Sequence>
      <Series.Sequence
        name="10-03 AlexNet的成绩单"
        durationInFrames={1723}
        premountFor={fps}
      >
        <Shot39 />
      </Series.Sequence>
      <Series.Sequence
        name="10-04 三种条件相遇"
        durationInFrames={1903}
        premountFor={fps}
      >
        <Shot40 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter10Composition = () => (
  <Composition
    id="AiHistoryChapter10"
    component={Chapter10}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
