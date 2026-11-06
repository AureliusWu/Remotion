import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const red = "#e9635b";
const ink = "#172735";
const cream = "#f4ead8";
const quiet = "#8ba2ac";
const ease = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;
const sans = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';

const Artwork = ({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) => (
  <svg
    viewBox="0 0 1040 650"
    width="100%"
    height="100%"
    role="presentation"
    style={{ display: "block", fontFamily: sans }}
  >
    <rect width="1040" height="650" fill={light ? "#e9dfce" : "#1a2b3b"} />
    {children}
    <rect
      x="1"
      y="1"
      width="1038"
      height="648"
      fill="none"
      stroke={light ? "#baa997" : "#758b9855"}
      strokeWidth="2"
    />
  </svg>
);

const Umbrella = ({ color }: { color: string }) => (
  <>
    <path
      d="M0-67v37q0 12 12 12 8 0 8-7"
      fill="none"
      stroke="#b6b1a6"
      strokeWidth="3"
    />
    <path
      d="M-54-67q6-39 54-47 48 8 54 47-13-11-27 0-13-12-27 0-14-12-27 0-14-11-27 0Z"
      fill={color}
    />
    <path
      d="M-27-68q4-26 27-45m27 45q-4-26-27-45M0-113v46"
      fill="none"
      stroke="#f4ead870"
      strokeWidth="1.7"
    />
    <path
      d="M-49-71q13-28 49-40"
      fill="none"
      stroke="#ffffff65"
      strokeWidth="2"
    />
    <circle cy="-115" r="2.6" fill="#e7dbcc" />
  </>
);

const walkerPositions = [
  [123, 487, 0.78, "#6f9ca3"],
  [271, 441, 0.62, red],
  [385, 407, 0.51, "#9aa9a1"],
  [488, 387, 0.43, "#8791aa"],
  [580, 398, 0.54, red],
  [668, 452, 0.72, "#6d93a7"],
  [809, 511, 0.94, red],
  [944, 486, 0.68, "#d6a46d"],
] as const;
const extraWalkers = [
  [190, 557, 0.88, "#a58c9d"],
  [542, 548, 0.81, "#8da792"],
  [745, 385, 0.44, "#a6b9c0"],
] as const;
const buildings = [
  [0, 105, 137, 280],
  [133, 134, 118, 243],
  [244, 181, 115, 190],
  [348, 210, 72, 164],
  [415, 235, 93, 136],
  [509, 222, 70, 158],
  [576, 193, 102, 187],
  [673, 156, 125, 220],
  [789, 119, 123, 264],
  [908, 81, 132, 303],
];

type StreetMood = "first" | "again" | "wet" | "after";
const Street = ({ mood, tag }: { mood: StreetMood; tag: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const focus = interpolate(frame, [0, 3 * fps, 8 * fps], [0, 0.55, 1], ease);
  const shine = mood === "after" ? 0.82 : 0.51;
  const sharing = interpolate(frame, [2.6 * fps, 5.2 * fps], [0, 1], ease);
  const rainCount = mood === "after" ? 12 : mood === "wet" ? 103 : 69;
  const walkers =
    mood === "wet" ? [...walkerPositions, ...extraWalkers] : walkerPositions;
  return (
    <svg
      viewBox="0 0 1040 650"
      width="100%"
      height="100%"
      role="presentation"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={tag + "-sky"} x2="0" y2="1">
          <stop stopColor="#101b2a" />
          <stop
            offset="1"
            stopColor={mood === "after" ? "#b68569" : "#657e8e"}
          />
        </linearGradient>
        <linearGradient id={tag + "-road"} x2="0" y2="1">
          <stop stopColor="#314a5e" />
          <stop offset="1" stopColor="#142838" />
        </linearGradient>
        <radialGradient id={tag + "-lamp"}>
          <stop stopColor="#ffe0a5" stopOpacity={0.55} />
          <stop offset="1" stopColor="#eab77f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1040" height="650" fill={"url(#" + tag + "-sky)"} />
      <path d="M0 383h1040v267H0z" fill={"url(#" + tag + "-road)"} />
      {buildings.map(([x, y, w, h], i) => (
        <g key={x}>
          <path
            d={
              "M" +
              x +
              " " +
              (y + 9) +
              "l" +
              w * 0.68 +
              " -15 " +
              w * 0.32 +
              " 15v" +
              h +
              "h-" +
              w +
              "z"
            }
            fill={["#172431", "#263746", "#20303f"][i % 3]}
          />
          <path
            d={"M" + (x + 6) + " " + (y + 23) + "h" + (w - 12)}
            stroke="#819ca745"
            strokeWidth="2"
          />
          {Array.from({ length: 4 }, (_, row) =>
            Array.from({ length: 3 }, (_, col) => (
              <rect
                key={row + "-" + col}
                x={x + 13 + ((w - 21) / 3) * col}
                y={y + 40 + 27 * row}
                width={Math.min(w / 7, 17)}
                height="14"
                rx="1"
                fill={(row + i + col * 2) % 4 === 0 ? "#d9a16c" : "#4b6475"}
                opacity={(row + i) % 3 ? 0.7 : 0.46}
              />
            )),
          )}
          <rect
            x={x + 5}
            y={y + h - 48}
            width={w - 10}
            height="43"
            fill="#102332"
          />
          {i % 2 === 0 && (
            <rect
              x={x + 14}
              y={y + h - 37}
              width={w - 28}
              height="17"
              rx="2"
              fill="#d9a36c"
              opacity={0.38}
            />
          )}
        </g>
      ))}
      <path
        d="M0 429 426 383h198l416 54v62L616 394H422L0 529Z"
        fill="#798c96"
        opacity={0.28}
      />
      <path
        d="M0 531 424 392m192 2 424 106M0 554l430-157m181 1 429 126"
        fill="none"
        stroke="#b1ada4"
        opacity={0.23}
        strokeWidth="3"
      />
      <path
        d="M312 650 492 416m208 234L550 416"
        fill="none"
        stroke="#9eb3b7"
        opacity={0.18}
        strokeWidth="3"
      />
      {Array.from({ length: 6 }, (_, i) => (
        <path
          key={i}
          d={
            "M" +
            (287 - 21 * i) +
            " " +
            (565 + 15 * i) +
            "h" +
            (416 + 38 * i) +
            "l7 7H" +
            (277 - 22 * i) +
            "Z"
          }
          fill="#c6cdc1"
          opacity={0.15 + i * 0.022}
        />
      ))}
      {[145, 886].map((x, i) => (
        <g key={x}>
          <ellipse
            cx={x}
            cy={248 + i * 8}
            rx="118"
            ry="155"
            fill={"url(#" + tag + "-lamp)"}
            opacity={shine}
          />
          <path
            d={"M" + (x + 24) + " 473V245q0-24-24-24h-13"}
            fill="none"
            stroke="#1a2530"
            strokeWidth="7"
          />
          <path d={"M" + (x - 23) + " 222h24l7 8h-37Z"} fill="#ffe3af" />
          <path
            d={"M" + (x - 12) + " 484l-29 128h74l-17-128Z"}
            fill="#d4a477"
            opacity={0.08 + shine * 0.08}
          />
        </g>
      ))}
      {walkers.map(([x, y, size, color], i) => {
        const stride = Math.sin(frame / 24 + i) * 4;
        const tracking = mood === "again" && color === red;
        return (
          <g
            key={x}
            transform={
              "translate(" +
              (x + (frame / fps) * (i % 2 ? -1.3 : 1.6)) +
              " " +
              y +
              ") scale(" +
              size +
              ")"
            }
          >
            <ellipse cy="5" rx="33" ry="7" fill="#0b1a24" opacity={0.6} />
            <path
              d={"M-9-21l" + (stride - 6) + " 26M7-21l" + (8 - stride) + " 26"}
              stroke="#14202c"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M-17-20q2-32 17-35 14 4 17 35Z"
              fill={
                mood === "after"
                  ? ["#677d8b", "#9d736e", "#536d82"][i % 3]
                  : "#2a3c4c"
              }
            />
            <circle
              cy="-62"
              r="10"
              fill={mood === "after" ? "#c5a08a" : "#455665"}
            />
            <path
              d="M-4-46 13-39l12-10"
              stroke="#697d89"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <Umbrella color={color} />
            {tracking && (
              <circle
                cy="-86"
                r={59 + 5 * Math.sin(frame / 37 + i)}
                fill="none"
                stroke="#ffcdb5"
                strokeWidth="2"
                strokeDasharray="3 6"
                opacity={focus * 0.76}
              />
            )}
            <path
              d="M-34 19q32 8 68 0m-51 10h35m-28 10h19"
              fill="none"
              stroke={color}
              strokeWidth="2"
              opacity={0.24}
            />
          </g>
        );
      })}
      {mood === "after" && (
        <>
          <path
            d="M736 430V214h-29"
            stroke="#182735"
            strokeWidth="7"
            fill="none"
          />
          <rect
            x="682"
            y="188"
            width="48"
            height="101"
            rx="11"
            fill="#162936"
          />
          <circle cx="706" cy="213" r="17" fill="#ff6d65" opacity=".17" />
          <circle cx="706" cy="213" r="10" fill="#f16b63" />
          <circle cx="706" cy="239" r="8" fill="#494e47" />
          <circle cx="706" cy="265" r="8" fill="#344d4a" />
          <g transform="translate(750 575) scale(1.5)">
            <ellipse
              cx="2"
              cy="9"
              rx="91"
              ry="9"
              fill="#112330"
              opacity=".62"
            />
            <path
              d="M-53-22v29m22-29 8 28M28-21l-3 29m24-26 7 25"
              stroke="#20313d"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path d="M-62-20q3-33 16-41 18 2 26 41Z" fill="#8298a2" />
            <path d="M17-20q6-30 20-34 19 3 24 34Z" fill="#a38277" />
            <circle cx="-44" cy="-69" r="12" fill="#c7a38c" />
            <circle cx="38" cy="-65" r="11" fill="#c9a58e" />
            <path
              d="M-55-71q-1-16 13-15 12 1 12 13-10-2-18-6Z"
              fill="#263744"
            />
            <path
              d="M27-65q-5-18 10-18 12 2 15 16l-11-7-13 11Z"
              fill="#2a3944"
            />
            <path
              d={"M-48-48Q-31-34 " + (-40 + sharing * 43) + " -56"}
              stroke="#a6b5b4"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <g
              transform={
                "translate(" + (-40 + sharing * 43) + " -17) scale(1.25 1.1)"
              }
            >
              <Umbrella color={red} />
            </g>
            <path
              d="M-48 22q46 7 108-3m-86 14h58m-34 10h36"
              stroke="#e28069"
              strokeWidth="2"
              opacity=".32"
              fill="none"
            />
          </g>
        </>
      )}
      <g stroke="#dae2de" strokeWidth="1.35">
        {Array.from({ length: rainCount }, (_, i) => {
          const x =
            ((i * 119 + 19 + frame * (0.24 + (i % 3) * 0.07)) % 1080) - 20;
          const y = ((i * 53 + frame * (4 + (i % 4))) % 690) - 25;
          return (
            <path
              key={i}
              d={"M" + x + " " + y + "l-8 " + (16 + (i % 10))}
              opacity={mood === "after" ? 0.1 : 0.1 + (i % 5) * 0.045}
            />
          );
        })}
      </g>
    </svg>
  );
};

const StreetArt = ({ mood, label }: { mood: StreetMood; label: string }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      position: "relative",
      boxShadow: "0 24px 72px #0005",
      border: "1px solid #a4b4bd4d",
    }}
  >
    <Street mood={mood} tag={"street-" + mood} />
    <div
      style={{
        position: "absolute",
        bottom: 26,
        right: 29,
        color: cream,
        font: "600 23px " + sans,
        background: "#182936d9",
        padding: "10px 18px",
        border: "1px solid #b5c7c34d",
      }}
    >
      {label}
    </div>
  </div>
);

export const SameStreetArt = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 22,
      alignContent: "center",
    }}
  >
    <StreetArt mood="first" label="认识之前" />
    <StreetArt mood="again" label="认识之后" />
    <div
      style={{
        gridColumn: "span 2",
        textAlign: "center",
        color: cream,
        font: "600 28px " + sans,
        marginTop: 34,
        letterSpacing: 3,
      }}
    >
      同一街角 · 同一批伞
    </div>
  </div>
);

export const NamingArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Artwork light>
      <path
        d="M180 104h670v440H180z"
        fill="#a2907c"
        opacity=".3"
        transform="translate(12 18)"
      />
      <path
        d="M180 104h670v440H180z"
        fill="#fff7e7"
        stroke="#b9a68d"
        strokeWidth="2"
      />
      {Array.from({ length: 13 }, (_, i) => (
        <path
          key={i}
          d={"M218 " + (146 + i * 29) + "h592"}
          stroke="#c2aa91"
          opacity=".22"
        />
      ))}
      <path d="M258 108v433" stroke="#d6736f" opacity=".49" />
      <text x="289" y="215" fill={red} fontSize="92" fontWeight="750">
        2005
      </text>
      <text x="291" y="315" fill={ink} fontSize="66" fontWeight="750">
        频率错觉
      </text>
      <path
        d="M288 337h309"
        stroke={red}
        strokeWidth="4"
        strokeDasharray="310"
        strokeDashoffset={interpolate(frame, [fps, 2.5 * fps], [310, 0], ease)}
      />
      <text x="293" y="396" fill="#566771" fontSize="33" letterSpacing="3">
        FREQUENCY ILLUSION
      </text>
      <text x="293" y="461" fill="#53636b" fontSize="26">
        一个名字，描述一种熟悉的感受
      </text>
      <g transform="translate(767 470) scale(.8)">
        <Umbrella color={red} />
      </g>
    </Artwork>
  );
};

export const FocusArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const attention = interpolate(frame, [fps, 4 * fps], [0, 1], ease);
  const target = [3, 12, 21, 27];
  return (
    <Artwork>
      <text x="66" y="80" fill={cream} fontSize="26" letterSpacing="4">
        任务{"\u3000"}找红色的伞
      </text>
      {Array.from({ length: 28 }, (_, i) => {
        const x = 110 + (i % 7) * 137;
        const y = 209 + Math.floor(i / 7) * 118;
        const selected = target.includes(i);
        return (
          <g
            key={i}
            transform={"translate(" + x + " " + y + ") scale(.67)"}
            opacity={selected ? 1 : 1 - attention * 0.63}
          >
            <Umbrella
              color={
                selected
                  ? red
                  : ["#839da6", "#cfac7b", "#a398b6", "#8ea08c"][i % 4]
              }
            />
            {selected && (
              <circle
                cy="-72"
                r="68"
                fill="none"
                stroke="#ffccb2"
                strokeWidth="2"
                strokeDasharray="4 7"
                opacity={attention}
              />
            )}
          </g>
        );
      })}
      <path d="M67 578h906" stroke="#9eb2b3" opacity=".36" />
      <text x="66" y="615" fill={quiet} fontSize="23">
        输入相同，注意力的分配改变了。
      </text>
    </Artwork>
  );
};

const PlayerFigure = ({
  x,
  y,
  color,
  phase,
}: {
  x: number;
  y: number;
  color: string;
  phase: number;
}) => (
  <g
    transform={"translate(" + x + " " + y + ")"}
    fill="none"
    stroke={color}
    strokeWidth="10"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cy="-83" r="13" fill={color} stroke="none" />
    <path
      d={
        "M0-63v39m0-29-25 " +
        (-12 + phase) +
        "m25 0 31 " +
        (-12 - phase) +
        "M0-24-18 4m18-28 21 28"
      }
    />
  </g>
);

export const ExperimentArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phase = frame / fps;
  const crossing = interpolate(frame, [4 * fps, 10 * fps], [-114, 1110], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ball = (phase * 0.52) % 1;
  const motion = phase % 4 < 2 ? ball : 1 - ball;
  return (
    <Artwork>
      <path
        d="M55 168h930v391H55z"
        fill="#142333"
        stroke="#729099"
        strokeWidth="2"
      />
      <circle
        cx="520"
        cy="365"
        r="104"
        fill="none"
        stroke="#729099"
        strokeWidth="2"
      />
      <path
        d="M520 168v391M54 258h145v203H54m931-203H840v203h145"
        stroke="#729099"
        strokeWidth="2"
        fill="none"
      />
      <g transform={"translate(" + crossing + " 364)"} opacity=".9">
        <ellipse cy="70" rx="60" ry="9" fill="#07131b" />
        <path
          d="M-52 56q-18-22-15-60 4-40 33-47 7-24 34-25 28 1 37 25 26 8 34 40l-10 54-22-1-12-38-9 61h-24l-13-54-17 40Z"
          fill="#0a151e"
          stroke="#526678"
          strokeWidth="2"
        />
        <ellipse cy="-45" rx="25" ry="23" fill="#394653" />
        <path
          d="M-8-39q9-6 18 0"
          fill="none"
          stroke="#778287"
          strokeWidth="3"
        />
      </g>
      <PlayerFigure
        x={211}
        y={347}
        color={cream}
        phase={Math.sin(phase * 4) * 12}
      />
      <PlayerFigure
        x={475}
        y={440}
        color="#627987"
        phase={Math.cos(phase * 2) * 11}
      />
      <PlayerFigure
        x={707}
        y={354}
        color={cream}
        phase={Math.cos(phase * 4) * 12}
      />
      <PlayerFigure
        x={845}
        y={490}
        color="#627987"
        phase={Math.sin(phase * 3) * 11}
      />
      <PlayerFigure
        x={338}
        y={506}
        color={cream}
        phase={Math.sin(phase * 4) * 12}
      />
      <circle
        cx={237 + motion * 447}
        cy={278 - Math.sin(motion * Math.PI) * 71}
        r="13"
        fill="#f1aa78"
      />
      <text x="58" y="100" fill={cream} fontSize="30" fontWeight="700">
        只数白队的传球
      </text>
      <text x="981" y="612" fill={quiet} fontSize="21" textAnchor="end">
        研究情境重绘 · 非实验原片
      </text>
    </Artwork>
  );
};

export const EvidenceArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const weight = interpolate(frame, [fps, 4.5 * fps], [0, 1], ease);
  const rows = [
    "遇到一把红伞",
    "旁边还有蓝伞",
    "又遇到一把红伞",
    "有人没撑伞",
    "第三次看见红伞",
  ];
  return (
    <Artwork light>
      <text x="85" y="96" fill={ink} fontSize="31" letterSpacing="4">
        记忆里的街景
      </text>
      <path d="M84 121h870" stroke="#a39381" />
      {rows.map((line, i) => (
        <g key={line} opacity={i % 2 ? 1 - weight * 0.52 : 1}>
          <rect
            x="91"
            y={153 + i * 83}
            width="857"
            height="66"
            fill="#fff8ed"
          />
          <circle
            cx="132"
            cy={186 + i * 83}
            r="8"
            fill={i % 2 ? "#8f9b98" : red}
          />
          <text x="170" y={198 + i * 83} fill={ink} fontSize="32">
            {line}
          </text>
          {i % 2 === 0 && (
            <path
              d={"M164 " + (206 + i * 83) + "q100 5 213-2"}
              stroke={red}
              strokeWidth="3"
              fill="none"
              opacity={weight}
            />
          )}
        </g>
      ))}
      <text x="948" y="613" fill="#5d6c71" fontSize="25" textAnchor="end">
        记得清楚 ≠ 证据更完整
      </text>
    </Artwork>
  );
};

export const RuleArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const answer = interpolate(frame, [9 * fps, 10.1 * fps], [0, 1], ease);
  const tuples = [
    ["2", "4", "6"],
    ["8", "10", "12"],
    ["1", "3", "8"],
  ];
  return (
    <Artwork light>
      <text x="86" y="87" fill={ink} fontSize="28" letterSpacing="4">
        猜规则
      </text>
      {tuples.map((numbers, i) => (
        <g
          key={numbers[0]}
          opacity={
            i
              ? interpolate(
                  frame,
                  [i * 3 * fps, (i * 3 + 0.65) * fps],
                  [0.12, 1],
                  ease,
                )
              : 1
          }
        >
          {numbers.map((number, j) => (
            <g key={number}>
              <rect
                x={89 + j * 171}
                y={124 + i * 122}
                width="146"
                height="96"
                fill="#fff8ec"
                stroke="#b7aa97"
              />
              <text
                x={162 + j * 171}
                y={190 + i * 122}
                textAnchor="middle"
                fill={ink}
                fontSize="51"
                fontWeight="650"
              >
                {number}
              </text>
            </g>
          ))}
          <text
            x="648"
            y={183 + i * 122}
            fill={i ? "#53696b" : red}
            fontSize="30"
          >
            {["给定例子", "两种猜法都吻合", "符合隐藏规则"][i]}
          </text>
          {i === 2 && (
            <text x="649" y="467" fill="#ae4d48" fontSize="25">
              推翻「每次加 2」
            </text>
          )}
        </g>
      ))}
      <rect
        x="87"
        y="512"
        width="866"
        height="77"
        fill="#203645"
        opacity={0.1 + 0.9 * answer}
      />
      <text
        x="121"
        y="564"
        fill={cream}
        fontSize="37"
        fontWeight="700"
        opacity={answer}
      >
        规则{"\u3000"}只要依次递增
      </text>
    </Artwork>
  );
};

export const FeedArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scroll = interpolate(
    frame,
    [0, 2 * fps, 8 * fps, 13 * fps],
    [0, 0, 113, 207],
    ease,
  );
  return (
    <Artwork>
      <defs>
        <clipPath id="frequency-phone-window">
          <rect x="118" y="100" width="373" height="451" rx="19" />
        </clipPath>
      </defs>
      <rect
        x="99"
        y="76"
        width="411"
        height="503"
        rx="37"
        fill="#101f2c"
        stroke="#9aabb1"
        strokeWidth="3"
      />
      <rect x="118" y="100" width="373" height="451" rx="19" fill="#e1e8e3" />
      <g clipPath="url(#frequency-phone-window)">
        {Array.from({ length: 6 }, (_, i) => (
          <g
            key={i}
            transform={"translate(0 " + (124 + i * 125 - scroll) + ")"}
          >
            <rect
              x="137"
              width="335"
              height="106"
              rx="11"
              fill={i === 1 || i > 2 ? "#d9a19a" : "#b0c5c6"}
            />
            <g transform="translate(204 85) scale(.55)">
              <Umbrella color={i === 1 || i > 2 ? red : "#7b9eaa"} />
            </g>
            <path
              d="M265 34h174m-174 22h124m-124 21h70"
              stroke="#293b45"
              strokeWidth="6"
              opacity=".43"
            />
          </g>
        ))}
      </g>
      <path
        d="M536 284h106l-14-15m14 15-14 15"
        stroke="#d49989"
        strokeWidth="3"
        fill="none"
      />
      <text x="682" y="258" fill={cream} fontSize="33" fontWeight="700">
        观看记录
      </text>
      <text x="682" y="320" fill={cream} fontSize="33" fontWeight="700">
        后续推荐
      </text>
      <text x="683" y="386" fill={quiet} fontSize="25">
        看到的内容可能变了
      </text>
    </Artwork>
  );
};

export const DenominatorArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = interpolate(frame, [0, 4 * fps], [0, 1], ease);
  return (
    <Artwork light>
      {[20, 40].map((total, i) => (
        <g key={total} transform={"translate(" + (i ? 538 : 48) + " 0)"}>
          <rect
            x="0"
            y="94"
            width="455"
            height="444"
            fill="#fff8ec"
            stroke="#b8aa99"
          />
          <text x="28" y="153" fill="#677a7c" fontSize="27">
            第 {i + 1} 次观察
          </text>
          {Array.from({ length: total }, (_, j) => (
            <g
              key={j}
              transform={
                "translate(" +
                (29 + (j % 10) * 40) +
                " " +
                (185 + Math.floor(j / 10) * 40) +
                ")"
              }
            >
              <rect width="26" height="26" rx="5" fill="#a5b5ad" opacity=".6" />
              {j < (i + 1) * 2 && (
                <rect
                  width="26"
                  height="26"
                  rx="5"
                  fill={red}
                  opacity={count}
                />
              )}
            </g>
          ))}
          <text x="29" y="443" fill={ink} fontSize="52" fontWeight="750">
            {(i + 1) * 2} / {total}
          </text>
          <text x="31" y="494" fill="#617576" fontSize="27">
            红伞占比 10%
          </text>
        </g>
      ))}
      <text x="986" y="609" fill="#677a7c" fontSize="22" textAnchor="end">
        假设数据，仅用于说明
      </text>
    </Artwork>
  );
};

export const NotebookArt = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const checklist = [
    ["01", "固定路段", "选同一段路"],
    ["02", "固定时间", "选相近的时段"],
    ["03", "同时记录", "总伞数与红伞数"],
  ];
  return (
    <Artwork light>
      <rect
        x="153"
        y="75"
        width="737"
        height="511"
        rx="8"
        fill="#fff8ed"
        stroke="#b2a391"
        strokeWidth="2"
      />
      <path d="M204 77v506" stroke="#ce8e87" strokeWidth="2" />
      <text x="252" y="158" fill={ink} fontSize="43" fontWeight="720">
        观察记录
      </text>
      {checklist.map(([number, title, note], i) => (
        <g
          key={number}
          opacity={interpolate(
            frame,
            [fps + i * 1.6 * fps, (2 + i * 1.6) * fps],
            [0.24, 1],
            ease,
          )}
        >
          <path d={"M229 " + (270 + i * 95) + "h625"} stroke="#cab9a3" />
          <text x="253" y={244 + i * 95} fill={red} fontSize="28">
            {number}
          </text>
          <text
            x="329"
            y={244 + i * 95}
            fill={ink}
            fontSize="36"
            fontWeight="700"
          >
            {title}
          </text>
          <text x="593" y={244 + i * 95} fill="#637573" fontSize="24">
            {note}
          </text>
        </g>
      ))}
      <text x="255" y="544" fill="#647576" fontSize="26">
        先定怎么数，再出去看。
      </text>
    </Artwork>
  );
};

export const FirstStreetArt = () => (
  <StreetArt mood="first" label="傍晚 · 同一个路口" />
);
export const WetStreetArt = () => (
  <StreetArt mood="wet" label="雨势变大 · 情境示意" />
);
export const LastStreetArt = () => (
  <StreetArt mood="after" label="红灯前 · 再看一眼" />
);
