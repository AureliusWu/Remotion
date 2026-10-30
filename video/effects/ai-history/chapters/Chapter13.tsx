import { Composition, Series, useVideoConfig } from "remotion";
import { Shot49 } from "../shots/Shot49";
import { Shot50 } from "../shots/Shot50";
import { Shot51 } from "../shots/Shot51";
import { Shot52 } from "../shots/Shot52";
export const Chapter13 = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence
        name="13-01 生成器与判别器"
        durationInFrames={1764}
        premountFor={fps}
      >
        <Shot49 />
      </Series.Sequence>
      <Series.Sequence
        name="13-02 从噪声一步步重建"
        durationInFrames={1827}
        premountFor={fps}
      >
        <Shot50 />
      </Series.Sequence>
      <Series.Sequence
        name="13-03 文字与图像建立联系"
        durationInFrames={1843}
        premountFor={fps}
      >
        <Shot51 />
      </Series.Sequence>
      <Series.Sequence
        name="13-04 在潜在空间里扩散"
        durationInFrames={1766}
        premountFor={fps}
      >
        <Shot52 />
      </Series.Sequence>
    </Series>
  );
};
export const Chapter13Composition = () => (
  <Composition
    id="AiHistoryChapter13"
    component={Chapter13}
    width={1920}
    height={1080}
    fps={60}
    durationInFrames={7200}
    defaultProps={{}}
  />
);
