import { Audio } from "@remotion/media";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  Still,
  getStaticFiles,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import script from "./script.json";

type Cue = { text: string; startFrame: number; endFrame: number };
type Scene = { id: string; startFrame: number; endFrame: number; lines: Cue[] };
type Timeline = { fps: number; durationInFrames: number; scenes: Scene[] };
type Props = { timeline: Timeline };
type SceneCopy = (typeof script.scenes)[number];

const FPS = 60;
const SANS = '"Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
const MONO = '"Cascadia Mono", "Consolas", monospace';
const PAPER = "#f3f3ea";
const INK = "#101a25";
const SKY = "#91d4ff";
const LIME = "#d7fa85";
const AMBER = "#ffba80";
const QUIET = "#b0bcca";
const LINE = "#536773";
const base = "#1e2c37";
const timingPath = "superagent/timeline.json";
const audioPath = "superagent/narration.wav";
const ease = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

const Line = ({
  d,
  color = LINE,
  dotted = false,
}: {
  d: string;
  color?: string;
  dotted?: boolean;
}) => (
  <path
    d={d}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeDasharray={dotted ? "7 10" : undefined}
    strokeLinecap="round"
  />
);

const Tick = ({
  x,
  y,
  color = LIME,
}: {
  x: number;
  y: number;
  color?: string;
}) => (
  <g
    transform={`translate(${x} ${y})`}
    fill="none"
    stroke={color}
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M0 10 7 17 20 1" />
  </g>
);

const Label = ({
  x,
  y,
  children,
  color = PAPER,
  size = 24,
  mono = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  size?: number;
  mono?: boolean;
}) => (
  <text
    x={x}
    y={y}
    fill={color}
    fontSize={size}
    fontFamily={mono ? MONO : SANS}
    fontWeight={mono ? 500 : 650}
    letterSpacing={mono ? 2 : 0.5}
  >
    {children}
  </text>
);

const Badge = ({
  x,
  y,
  width,
  label,
  color,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  color: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect width={width} height="40" rx="20" fill={color} />
    <Label x={16} y={27} color={INK} size={19}>
      {label}
    </Label>
  </g>
);

const Card = ({
  x,
  y,
  width,
  height,
  color = LINE,
  children,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  children: ReactNode;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect
      x="8"
      y="10"
      width={width}
      height={height}
      rx="15"
      fill="#101a23"
      opacity="0.66"
    />
    <rect
      width={width}
      height={height}
      rx="15"
      fill={base}
      stroke={color}
      strokeWidth="2"
    />
    {children}
  </g>
);

const Doc = ({
  x,
  y,
  color = SKY,
}: {
  x: number;
  y: number;
  color?: string;
}) => (
  <g transform={`translate(${x} ${y})`}>
    <path
      d="M0 0H43L62 20V78H0Z M43 0V20H62"
      stroke={color}
      strokeWidth="3"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M13 36H45 M13 48H43 M13 60H34"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </g>
);

const TaskArt = ({ phase }: { phase: number }) => (
  <>
    <Line d="M85 387H895" dotted />
    <Line d="M504 139V554" dotted />
    <circle
      cx="507"
      cy="325"
      r={221 + 12 * phase}
      fill="none"
      stroke="#40515a"
    />
    <circle
      cx="507"
      cy="325"
      r="173"
      fill="none"
      stroke="#40515a"
      strokeDasharray="3 9"
    />
    <Card x={121 + 34 * phase} y={166} width={641} height={320} color={SKY}>
      <Badge x={35} y={28} width={135} label="新任务" color={SKY} />
      <Label x={37} y={144} size={62}>
        修一下首页错字
      </Label>
      <Label x={38} y={212} color={QUIET} size={28}>
        把要求落到一个代码仓库
      </Label>
      <Line d="M37 246H602" />
      <Label x={38} y={286} color={LIME} mono>
        01 / TASK INTAKE
      </Label>
      <Doc x={520} y={159} />
    </Card>
    <Badge
      x={670}
      y={450 - 16 * phase}
      width={204}
      label="原始请求保留"
      color={LIME}
    />
  </>
);

const work = [
  { id: "A", title: "查找", detail: "定位首页文字的源文件", color: SKY },
  { id: "B", title: "修改", detail: "只改对应的文案", color: LIME },
  { id: "C", title: "检查", detail: "运行适用的仓库检查", color: AMBER },
];

const CrewArt = ({ phase }: { phase: number }) => (
  <>
    <Card x={288} y={73} width={424} height={101} color={SKY}>
      <Label x={36} y={61} size={32}>
        原始任务
      </Label>
      <Label x={251} y={62} color={SKY} mono size={19}>
        WORKER
      </Label>
    </Card>
    <Line d="M500 174V230H188V295M329 419H359M641 419H671" color={SKY} />
    <Line d="M348 411 356 419 348 427M660 411 668 419 660 427" color={LIME} />
    <circle cx="188" cy="230" r="5" fill={LIME} />
    {work.map((item, index) => {
      const show = interpolate(
        phase,
        [index * 0.12, index * 0.12 + 0.25],
        [0.57, 1],
        ease,
      );
      return (
        <g key={item.id} opacity={show}>
          <Card
            x={47 + index * 312}
            y={295 + (1 - show) * 24}
            width={282}
            height={246}
            color={item.color}
          >
            <Label x={22} y={48} color={item.color} mono>
              0{index + 1} / {item.id}
            </Label>
            <Label x={22} y={105} size={31}>
              {item.title}
            </Label>
            <Line d="M22 137H260" />
            <Label x={22} y={182} color={QUIET} size={19}>
              {item.detail}
            </Label>
            <Line d="M22 212H260" color={item.color} />
          </Card>
        </g>
      );
    })}
  </>
);

const ReceiptArt = ({ phase }: { phase: number }) => (
  <>
    <Line d="M67 130H937M67 534H937M214 82V579M787 82V579" dotted />
    <Card x={140} y={145} width={714} height={388} color={SKY}>
      <Label x={36} y={61} color={SKY} mono>
        03 / RECEIPT
      </Label>
      <Label x={35} y={131} size={54}>
        这条回执证明什么？
      </Label>
      <Line d="M35 159H679" />
      <Tick x={39} y={194} />
      <Label x={81} y={216} size={33}>
        任务指令已送达
      </Label>
      <Line d="M35 245H679" />
      <circle
        cx="50"
        cy="286"
        r="11"
        fill="none"
        stroke={AMBER}
        strokeWidth="3"
      />
      <Label x={81} y={298} size={33}>
        PR 是否创建仍需核实
      </Label>
      <Badge x={39} y={327} width={236} label="两件事分别记录" color={LIME} />
      <path
        d={`M556 305H${556 + 105 * phase}`}
        stroke={SKY}
        strokeWidth="3"
        fill="none"
        opacity=".65"
      />
    </Card>
  </>
);

const BoundaryArt = ({ phase }: { phase: number }) => (
  <>
    <Line d="M84 321H906" dotted />
    <Card x={52} y={235} width={261} height={173}>
      <Doc x={27} y={45} />
      <Label x={113} y={95} size={29}>
        仓库写入
      </Label>
      <Label x={112} y={127} color={QUIET} size={18}>
        文件范围
      </Label>
    </Card>
    <Card x={353} y={157} width={294} height={329} color={AMBER}>
      <path
        d="M121 145V114a26 26 0 0 1 52 0v31M108 145h79v61h-79z"
        fill="none"
        stroke={AMBER}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="147" cy="170" r="4" fill={AMBER} />
      <path d="M147 174v12" stroke={AMBER} strokeWidth="3" />
      <Label x={58} y={258} size={43}>
        人工确认
      </Label>
      <Label x={81} y={300} color={AMBER} mono size={20}>
        REVIEW GATE
      </Label>
    </Card>
    <Card x={686} y={235} width={261} height={173}>
      <path
        d="M26 54H80V108H26Z M26 54L53 80 80 54"
        fill="none"
        stroke={AMBER}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <Label x={102} y={95} size={29}>
        创建 PR
      </Label>
      <Label x={102} y={127} color={QUIET} size={18}>
        账号权限
      </Label>
    </Card>
    <circle cx={320 + 19 * phase} cy="321" r="7" fill={AMBER} />
  </>
);

const FinishArt = ({ phase }: { phase: number }) => (
  <>
    <Line d="M84 142H909M84 525H909M93 334H919" dotted />
    <Card x={128} y={134} width={732} height={404} color={LIME}>
      <Doc x={36} y={35} color={LIME} />
      <Label x={127} y={74} size={47}>
        首页错字 · 改动回报
      </Label>
      <Label x={129} y={108} color={QUIET} size={21}>
        回到发起请求的对话
      </Label>
      <Line d="M37 141H692" />
      <Tick x={39} y={174} />
      <Label x={82} y={198} size={31}>
        已完成
      </Label>
      <Label x={246} y={198} color={QUIET} size={25}>
        附改动、检查结果与 PR 链接
      </Label>
      <Line d="M37 225H692" />
      <circle
        cx="50"
        cy="264"
        r="11"
        fill="none"
        stroke={AMBER}
        strokeWidth="3"
      />
      <Label x={82} y={277} size={31}>
        待确认
      </Label>
      <Label x={246} y={277} color={QUIET} size={25}>
        保留缺少证据的事项
      </Label>
      <Line d="M37 310H692" />
      <Badge x={37} y={336} width={212} label="交付物可复核" color={LIME} />
      <path
        d={`M515 356H${540 + phase * 150}`}
        stroke={LIME}
        strokeWidth="3"
        fill="none"
      />
    </Card>
  </>
);

const artworks: Record<string, (phase: number) => ReactNode> = {
  task: (phase) => <TaskArt phase={phase} />,
  crew: (phase) => <CrewArt phase={phase} />,
  receipt: (phase) => <ReceiptArt phase={phase} />,
  boundary: (phase) => <BoundaryArt phase={phase} />,
  finish: (phase) => <FinishArt phase={phase} />,
};

const background =
  "radial-gradient(ellipse at 73% 42%, #26394a 0%, #13212e 51%, #101924 100%)";
const grid =
  "linear-gradient(#8297a217 1px, transparent 1px), linear-gradient(90deg,#8297a217 1px, transparent 1px)";

const Canvas = () => (
  <AbsoluteFill style={{ background }}>
    <AbsoluteFill
      style={{
        backgroundImage: grid,
        backgroundSize: "76px 76px",
        maskImage: "linear-gradient(90deg,#0000,#0007 50%,#000a)",
      }}
    />
  </AbsoluteFill>
);

const Chapter = ({
  scene,
  copy,
  index,
}: {
  scene: Scene;
  copy: SceneCopy;
  index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const globalFrame = frame + scene.startFrame;
  const progress = interpolate(
    frame,
    [0, scene.endFrame - scene.startFrame],
    [0, 1],
    ease,
  );
  const entrance = interpolate(frame, [0, 0.78 * fps], [0.24, 1], ease);
  const line = scene.lines.find(
    (cue) => cue.startFrame <= globalFrame && globalFrame < cue.endFrame,
  );
  const accent = [SKY, LIME, SKY, AMBER, LIME][index] ?? LIME;
  const number = String(index + 1).padStart(2, "0");
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: PAPER }}>
      <Canvas />
      <header
        style={{
          position: "absolute",
          top: 46,
          left: 75,
          right: 75,
          height: 57,
          borderBottom: `1px solid ${LINE}`,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          letterSpacing: 4,
        }}
      >
        <span>
          技术拆解 <span style={{ margin: "0 13px", color: accent }}>／</span>{" "}
          AI 工作流
        </span>
        <span style={{ color: SKY, fontFamily: MONO }}>
          DEEPSEEK · 研究原型
        </span>
      </header>
      <div
        style={{
          position: "absolute",
          top: 158,
          bottom: 195,
          left: 75,
          width: 646,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            color: accent,
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 25,
            fontWeight: 650,
            letterSpacing: 4,
          }}
        >
          <span style={{ fontFamily: MONO, fontSize: 29 }}>{number}</span>
          <span style={{ background: accent, width: 56, height: 2 }} />
          {copy.kicker.replace(/^\d+\s*·\s*/u, "")}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: entrance,
            translate: `0 ${(1 - entrance) * 24}px`,
          }}
        >
          <div
            style={{
              fontSize: 85,
              fontWeight: 760,
              lineHeight: 1.19,
              letterSpacing: -1.5,
              textWrap: "balance",
              overflowWrap: "anywhere",
            }}
          >
            {copy.heading}
          </div>
          <div
            style={{
              width: 125,
              height: 3,
              background: accent,
              margin: "38px 0 23px",
            }}
          />
          <div
            style={{
              fontSize: 31,
              fontWeight: 550,
              color: QUIET,
              lineHeight: 1.55,
              maxWidth: 600,
              textWrap: "balance",
            }}
          >
            {copy.subheading}
          </div>
        </div>
        <div
          style={{
            color: SKY,
            fontFamily: MONO,
            fontSize: 19,
            letterSpacing: 2,
          }}
        >
          DSH SUPERAGENT
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 758,
          right: 75,
          top: 142,
          height: 737,
          border: `1px solid ${LINE}`,
          background: "#192834",
          overflow: "hidden",
          opacity: entrance,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: grid,
            backgroundSize: "38px 38px",
          }}
        />
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 660"
          style={{
            position: "absolute",
            inset: 0,
            display: "block",
            scale: 1.005 + 0.032 * progress,
          }}
        >
          {(artworks[scene.id] ?? artworks.task)(progress)}
        </svg>
        <span
          style={{
            position: "absolute",
            top: 24,
            left: 26,
            color: QUIET,
            fontSize: 18,
            letterSpacing: 3,
          }}
        >
          工作流示意
        </span>
        <span
          style={{
            position: "absolute",
            bottom: 21,
            right: 26,
            color: accent,
            fontSize: 18,
            fontFamily: MONO,
            letterSpacing: 3,
          }}
        >
          FIG. {number}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 75,
          right: 75,
          bottom: 131,
          display: "flex",
          height: 2,
          gap: 8,
        }}
      >
        {script.scenes.map((entry, i) => (
          <div key={entry.id} style={{ flex: 1, background: LINE }}>
            <div
              style={{
                width: `${100 * (i < index ? 1 : i === index ? progress : 0)}%`,
                height: 2,
                background: accent,
              }}
            />
          </div>
        ))}
      </div>
      {line ? (
        <div
          style={{
            position: "absolute",
            left: 124,
            right: 124,
            bottom: 31,
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <span
            style={{
              background: "#0e1721",
              color: PAPER,
              padding: "12px 28px 14px",
              border: "1px solid #5367737d",
              borderRadius: 5,
              fontSize: 39,
              lineHeight: 1.2,
              fontWeight: 650,
            }}
          >
            {line.text}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const Film = ({ timeline }: Props) => {
  const { fps } = useVideoConfig();
  if (timeline.scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background,
          color: PAPER,
          fontFamily: SANS,
          fontSize: 47,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        生成旁白与时间轴后预览 DSH SuperAgent
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background }}>
      <Audio src={staticFile(audioPath)} />
      {timeline.scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          name={script.scenes[index].heading}
          from={scene.startFrame}
          durationInFrames={scene.endFrame - scene.startFrame}
          premountFor={fps}
        >
          <Chapter scene={scene} copy={script.scenes[index]} index={index} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Cover = () => (
  <AbsoluteFill style={{ color: PAPER, fontFamily: SANS }}>
    <Canvas />
    <div
      style={{ position: "absolute", inset: 58, border: "1px solid #72899796" }}
    />
    <svg
      width="900"
      height="670"
      viewBox="0 0 900 670"
      style={{ position: "absolute", left: 817, top: 219 }}
    >
      <Line d="M204 395H369V307H640M371 307V501H678" color={SKY} />
      <circle cx="370" cy="307" r="10" fill={SKY} />
      <circle cx="370" cy="501" r="8" fill={LIME} />
      <Card x={464} y={178} width={300} height={175} color={SKY}>
        <Doc x={26} y={44} />
        <Label x={113} y={83} size={41}>
          任务
        </Label>
        <Label x={115} y={125} color={SKY} mono size={23}>
          WORK ITEM
        </Label>
      </Card>
      <Card x={514} y={447} width={253} height={136} color={LIME}>
        <Tick x={26} y={53} />
        <Label x={75} y={76} size={34}>
          可核对
        </Label>
        <Label x={75} y={106} color={LIME} mono size={17}>
          RECEIPT
        </Label>
      </Card>
    </svg>
    <div style={{ position: "absolute", left: 240, top: 211, width: 993 }}>
      <div
        style={{ color: SKY, fontSize: 35, fontWeight: 700, letterSpacing: 9 }}
      >
        研究原型 · DSH
      </div>
      <div
        style={{
          fontSize: 140,
          fontWeight: 800,
          letterSpacing: -5,
          marginTop: 16,
          lineHeight: 1.06,
        }}
      >
        DeepSeek
      </div>
      <div
        style={{
          color: LIME,
          fontSize: 115,
          fontWeight: 800,
          letterSpacing: -2,
          lineHeight: 1.25,
        }}
      >
        SuperAgent
      </div>
      <div
        style={{
          background: LIME,
          height: 4,
          width: 109,
          margin: "37px 0 26px",
        }}
      />
      <div style={{ fontSize: 53, fontWeight: 680, letterSpacing: 2 }}>
        一句话，怎么变成改动？
      </div>
    </div>
  </AbsoluteFill>
);

const calculateMetadata: CalculateMetadataFunction<Props> = async ({
  abortSignal,
}) => {
  const files = getStaticFiles();
  if (
    !files.some((file) => file.name === timingPath) ||
    !files.some((file) => file.name === audioPath)
  )
    return {};
  const response = await globalThis.fetch(staticFile(timingPath), {
    signal: abortSignal,
  });
  if (!response.ok) return {};
  const timeline = (await response.json().catch(() => null)) as Timeline | null;
  if (
    !timeline ||
    !Array.isArray(timeline.scenes) ||
    timeline.fps !== FPS ||
    timeline.scenes.length !== script.scenes.length
  )
    return {};
  const matchesScript = timeline.scenes.every((scene, index) => {
    const copy = script.scenes[index];
    return (
      scene.id === copy.id &&
      scene.startFrame === (timeline.scenes[index - 1]?.endFrame ?? 0) &&
      Number.isSafeInteger(scene.endFrame) &&
      scene.endFrame > scene.startFrame &&
      scene.lines.length === copy.lines.length &&
      scene.lines.every(
        (line, i) =>
          line.text === copy.lines[i] &&
          Number.isSafeInteger(line.startFrame) &&
          Number.isSafeInteger(line.endFrame) &&
          line.startFrame >=
            (scene.lines[i - 1]?.endFrame ?? scene.startFrame) &&
          line.endFrame > line.startFrame &&
          line.endFrame <= scene.endFrame,
      )
    );
  });
  if (
    !matchesScript ||
    timeline.scenes[timeline.scenes.length - 1]?.endFrame !==
      timeline.durationInFrames
  )
    return {};
  return { durationInFrames: timeline.durationInFrames, props: { timeline } };
};

export const SuperagentCompositions = () => (
  <>
    <Composition
      id="Superagent-Bilibili"
      component={Film}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={FPS}
      defaultProps={{
        timeline: { fps: FPS, durationInFrames: FPS, scenes: [] },
      }}
      calculateMetadata={calculateMetadata}
    />
    <Still id="Superagent-Cover" component={Cover} width={1920} height={1080} />
  </>
);
