import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { applications } from "./data";
import { clamp, ease, numberFont, palette, SceneFrame } from "./shared";

export const UsesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneFrame
      index="05"
      chapter="主要用途"
      title="人数背后，是越来越多的使用场景"
      source="来源：CNNIC《生成式人工智能应用发展报告（2026）》 · 用户使用场景占比"
    >
      <Interactive.Div
        name="应用场景排行"
        premountFor={fps}
        style={{ position: "absolute", left: 120, right: 120, top: 315 }}
      >
        {applications.map((item, i) => (
          <div
            key={item.code}
            style={{
              position: "relative",
              height: 123,
              display: "flex",
              alignItems: "center",
              gap: 35,
            }}
          >
            <div style={{ width: 360, flexShrink: 0, fontSize: 36 }}>
              {item.label}
            </div>
            <div
              style={{
                flex: 1,
                height: 43,
                backgroundColor: palette.pale,
                borderRadius: "0 6px 6px 0",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${interpolate(frame, [(0.5 + i * 0.4) * fps, (2.4 + i * 0.4) * fps], [0, item.percent], { ...clamp, easing: ease })}%`,
                  backgroundColor: i === 0 ? palette.red : palette.teal,
                  borderRadius: "0 6px 6px 0",
                }}
              />
            </div>
            <div
              style={{
                width: 215,
                fontSize: 68,
                fontWeight: 600,
                fontFamily: numberFont,
                textAlign: "right",
                color: i === 0 ? palette.red : palette.ink,
              }}
            >
              {item.display}
              <span style={{ fontSize: 36 }}>%</span>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 28, color: palette.muted, marginTop: 35 }}>
          回答问题最普遍；同一用户可使用多个场景，比例不相加。
        </div>
      </Interactive.Div>
    </SceneFrame>
  );
};
