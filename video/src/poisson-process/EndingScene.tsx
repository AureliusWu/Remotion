import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CityArtwork } from "./CityArtwork";
import { clamp, colors, fonts, Frame } from "./shared";

export const EndingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Frame number="09" chapter="给偶然一点空间" title="" dark>
      <Interactive.Div
        name="回到书店"
        premountFor={fps}
        style={{ position: "absolute", inset: 0, opacity: 0.45 }}
      >
        <CityArtwork />
      </Interactive.Div>
      <Interactive.Div
        name="三个值得记住的问题"
        premountFor={fps}
        style={{ position: "absolute", left: 120, top: 190, width: 1050 }}
      >
        <div style={{ fontSize: 31, letterSpacing: 5, color: colors.gold }}>
          三个问题，带走一个模型
        </div>
        <div style={{ fontSize: 48, lineHeight: 1.8, marginTop: 38 }}>
          来多少？{" "}
          <span style={{ color: "#a7c4bb", fontSize: 33 }}>泊松分布</span>
          <br />
          等多久？{" "}
          <span style={{ color: "#a7c4bb", fontSize: 33 }}>指数分布</span>
          <br />
          假设对不对？{" "}
          <span style={{ color: "#a7c4bb", fontSize: 33 }}>回到生活里检验</span>
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 76,
            lineHeight: 1.4,
            marginTop: 42,
            opacity: interpolate(frame, [6 * fps, 8 * fps], [0, 1], clamp),
          }}
        >
          算得出概率，
          <br />
          也为相逢留一点空间。
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="学术与书目来源"
        premountFor={fps}
        style={{
          position: "absolute",
          top: 835,
          left: 120,
          right: 120,
          fontSize: 23,
          lineHeight: 1.75,
          color: "#bbcbc1",
          opacity: interpolate(frame, [11 * fps, 12 * fps], [0, 1], clamp),
        }}
      >
        数学依据：MIT 18.445 Lecture 20 · MIT 6.262 Chapter 2<br />
        历史依据：法国国家图书馆 BnF 1837 年书目 ·
        本片书店情境与人文旁白为原创。
      </Interactive.Div>
    </Frame>
  );
};
