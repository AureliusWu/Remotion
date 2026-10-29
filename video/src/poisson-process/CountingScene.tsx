import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { sampleArrivals } from "./math";
import { clamp, colors, fonts, Frame } from "./shared";

export const CountingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clock = interpolate(frame, [2 * fps, 15 * fps], [0, 3], clamp);
  const shown = sampleArrivals.filter((time) => time <= clock);
  const x = (t: number) => 210 + (t / 3) * 1430;
  const y = (n: number) => 775 - n * 28;
  let path = `M${x(0)} ${y(0)}`;
  shown.forEach((time, i) => {
    path += ` H${x(time)} V${y(i + 1)}`;
  });
  path += ` H${x(clock)}`;
  return (
    <Frame
      number="02"
      chapter="从事件到计数"
      title="把每一次到来，留在时间上"
      note="固定种子的模拟轨迹；播放压缩了 3 分钟观察窗，不是书店实测数据。"
    >
      <Interactive.Div
        name="速率和计数"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 170,
          right: 170,
          top: 292,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontFamily: fonts.math, fontSize: 60 }}>
          λ = 2 人 / 分钟
        </div>
        <div style={{ fontSize: 37 }}>
          截至 t 的到来次数{" "}
          <span
            style={{
              fontFamily: fonts.math,
              color: colors.coral,
              fontSize: 66,
            }}
          >
            N(t) = {shown.length}
          </span>
        </div>
      </Interactive.Div>
      <Interactive.Div
        name="事件点与阶梯计数"
        premountFor={fps}
        style={{ position: "absolute", inset: 0 }}
      >
        <svg width="1920" height="1080" aria-hidden>
          <path d="M210 463H1640" stroke={colors.line} strokeWidth="4" />
          <text
            x="170"
            y="435"
            fontSize="28"
            fill={colors.muted}
            fontFamily={fonts.body}
          >
            到来
          </text>
          {sampleArrivals.map((time, i) => (
            <circle
              key={i}
              cx={x(time)}
              cy="463"
              r="10"
              fill={time <= clock ? colors.coral : colors.pale}
            />
          ))}
          <path
            d="M210 510V775H1670"
            fill="none"
            stroke={colors.ink}
            strokeWidth="3"
          />
          {[0, 1, 2, 3].map((t) => (
            <g key={t}>
              <path d={`M${x(t)} 775v11`} stroke={colors.ink} strokeWidth="3" />
              <text
                x={x(t)}
                y="827"
                textAnchor="middle"
                fontSize="31"
                fill={colors.ink}
                fontFamily={fonts.number}
              >
                {t} 分钟
              </text>
            </g>
          ))}
          <text
            x="165"
            y="552"
            textAnchor="end"
            fontFamily={fonts.math}
            fontSize="39"
            fill={colors.ink}
          >
            N(t)
          </text>
          <path
            d={path}
            fill="none"
            stroke={colors.teal}
            strokeWidth="7"
            strokeLinejoin="round"
          />
          <path
            d={`M${x(clock)} 430V785`}
            stroke={colors.coral}
            strokeWidth="2"
            strokeDasharray="6 8"
          />
          <circle
            cx={x(clock)}
            cy={y(shown.length)}
            r="9"
            fill={colors.coral}
          />
        </svg>
      </Interactive.Div>
    </Frame>
  );
};
