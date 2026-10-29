import { Interactive, useVideoConfig } from "remotion";
import { Kicker, numberFont, palette, SceneFrame } from "./shared";
import { researchDate } from "./data";

export const MethodScene: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <SceneFrame
      index="06"
      chapter="时间与来源"
      title="记住人数，也记住它的统计时点"
      source="来源：中国互联网络信息中心 CNNIC · cnnic.cn · 详细链接见工程来源记录"
    >
      <Interactive.Div
        name="两个日期"
        premountFor={fps}
        style={{ position: "absolute", top: 337, left: 120, width: 850 }}
      >
        <Kicker>最新数据统计期</Kicker>
        <div style={{ fontSize: 72, fontWeight: 600, marginTop: 20 }}>
          2026 年上半年
        </div>
        <div
          style={{
            height: 2,
            backgroundColor: palette.line,
            width: 760,
            margin: "47px 0 39px",
          }}
        />
        <Kicker>资料检索日期</Kicker>
        <div
          style={{
            fontSize: 78,
            fontFamily: numberFont,
            fontWeight: 600,
            marginTop: 20,
            color: palette.red,
          }}
        >
          {researchDate}
        </div>
        <div style={{ fontSize: 31, marginTop: 34, color: palette.muted }}>
          最新公开统计，不推算今天的实时人数。
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="来源与口径说明"
        premountFor={fps}
        style={{ position: "absolute", left: 1040, top: 340, width: 730 }}
      >
        <Kicker>本片依据 / CNNIC</Kicker>
        <div style={{ fontSize: 34, lineHeight: 1.95, marginTop: 24 }}>
          《生成式人工智能应用发展报告》
          <br />
          2024 / 2025 / 2026 年版
          <br />第 55 次、第 57 次<br />
          《中国互联网络发展状况统计报告》
        </div>
        <div
          style={{
            fontSize: 26,
            lineHeight: 1.75,
            color: palette.muted,
            marginTop: 37,
          }}
        >
          2024 年 6 月节点作为历史参考。
          <br />
          “突破 7 亿”保留下限含义，不写精确值。
          <br />
          中文旁白由本地语音合成生成。
        </div>
      </Interactive.Div>
    </SceneFrame>
  );
};
