import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { HistoryShot } from "./types";
import type { Palette } from "./palette";
import { clamp } from "./palette";
import { SpecialDiagram } from "./SpecialDiagrams";

type Props = { shot: HistoryShot; palette: Palette; step: number };
const Text: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  fill: string;
  size?: number;
  anchor?: "middle" | "start" | "end";
}> = ({ x, y, children, fill, size = 27, anchor = "middle" }) => (
  <text x={x} y={y} fill={fill} fontSize={size} textAnchor={anchor}>
    {children}
  </text>
);
const Box: React.FC<{
  x: number;
  y: number;
  width: number;
  height?: number;
  fill: string;
  stroke: string;
  children?: React.ReactNode;
}> = ({ x, y, width, height = 80, fill, stroke, children }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={18}
      fill={fill}
      stroke={stroke}
      strokeWidth={2}
    />
    {children}
  </g>
);

export const HistoryDiagram: React.FC<Props> = ({ shot, palette: c, step }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const visible = (index: number) =>
    interpolate(t, [index * 0.32, index * 0.32 + 0.7], [0, 1], clamp);
  const pulse = (Math.sin(t * 1.3) + 1) / 2;
  const kind = shot.visual;
  if (
    [
      "01-03",
      "02-02",
      "02-03",
      "04-04",
      "08-01",
      "08-02",
      "09-03",
      "10-01",
      "10-03",
      "12-01",
      "12-02",
      "13-01",
      "13-03",
      "14-01",
    ].includes(shot.id)
  )
    return <SpecialDiagram shot={shot} palette={c} step={step} />;
  const note = (text: string) => (
    <Text x={570} y={472} fill={c.muted} size={21}>
      {text}
    </Text>
  );
  let content: React.ReactNode;

  if (kind === "network") {
    const layers = [4, 6, 5, 3];
    const positions = layers.map((count, layer) =>
      Array.from({ length: count }, (_, node) => ({
        x: 140 + layer * 270,
        y: 205 + (node - (count - 1) / 2) * 62,
      })),
    );
    content = (
      <>
        {positions
          .slice(0, -1)
          .flatMap((layer, l) =>
            layer.flatMap((a, i) =>
              positions[l + 1].map((b, j) => (
                <line
                  key={`${l}-${i}-${j}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={(i + j + step) % 5 === 0 ? c.accent : c.line}
                  strokeWidth={(i + j + step) % 5 === 0 ? 3 : 1.1}
                  opacity={visible(l) * 0.65}
                />
              )),
            ),
          )}
        {positions.flatMap((layer, l) =>
          layer.map((p, i) => (
            <g key={`${l}-${i}`} opacity={visible(l)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={17}
                fill={c.bg}
                stroke={(l + i + step) % 3 === 0 ? c.accent : c.secondary}
                strokeWidth={3}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={5 + pulse * 4}
                fill={c.secondary}
                opacity={0.65}
              />
            </g>
          )),
        )}
        {["输入", "中间表征", "组合特征", "输出"].map((s, i) => (
          <Text key={s} x={140 + i * 270} y={420} fill={c.ink}>
            {s}
          </Text>
        ))}
        {note("结构与激活示意；不是特定模型的实际权重")}
      </>
    );
  } else if (kind === "logic") {
    content = (
      <>
        <Text x={570} y={64} size={32} fill={c.ink}>
          把推理拆成可以执行的步骤
        </Text>
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i} opacity={visible(i / 3)}>
            <rect
              x={125 + i * 82}
              y={150}
              width={78}
              height={84}
              rx={5}
              fill={i === (Math.floor(t / 2) % 7) + 2 ? c.accent : c.panel}
              stroke={c.line}
              strokeWidth={2}
            />
            <Text
              x={164 + i * 82}
              y={203}
              fill={i === (Math.floor(t / 2) % 7) + 2 ? c.bg : c.ink}
              size={32}
            >
              {["…", "0", "1", "1", "0", "1", "0", "0", "1", "0", "…"][i]}
            </Text>
          </g>
        ))}
        <path d="M565 247 L590 277 L540 277 Z" fill={c.secondary} />
        <Box x={400} y={305} width={330} fill={c.panel} stroke={c.secondary}>
          <Text x={565} y={354} fill={c.ink}>
            状态 · 规则 · 下一步
          </Text>
        </Box>
        <path
          d="M730 345 H955 V200"
          fill="none"
          stroke={c.accent}
          strokeWidth={4}
          strokeDasharray="10 8"
        />
        {note("纸带与控制器的概念重绘，不是历史设备实物")}
      </>
    );
  } else if (kind === "dialogue") {
    content = (
      <>
        <rect
          x={80}
          y={25}
          width={980}
          height={385}
          rx={25}
          fill={c.panel}
          stroke={c.line}
          strokeWidth={2}
        />
        <circle cx={115} cy={58} r={7} fill={c.accent} />
        <circle cx={143} cy={58} r={7} fill={c.secondary} />
        <Text x={200} y={66} anchor="start" size={20} fill={c.muted}>
          DIALOGUE / 机制示意
        </Text>
        <Box
          x={135}
          y={105}
          width={670}
          height={92}
          fill={c.bg}
          stroke={c.line}
        >
          <Text x={465} y={162} fill={c.ink}>
            我最近有些担心。
          </Text>
        </Box>
        <g opacity={visible(3)}>
          <Box
            x={300}
            y={240}
            width={700}
            height={92}
            fill={c.bg}
            stroke={c.secondary}
          >
            <Text x={650} y={297} fill={c.ink}>
              你为什么会觉得担心？
            </Text>
          </Box>
        </g>
        <path
          d="M805 150 Q1070 150 1000 270"
          fill="none"
          stroke={c.accent}
          strokeWidth={3}
          strokeDasharray="8 8"
        />
        {note("示例为机制演示，不是原程序对话实录")}
      </>
    );
  } else if (kind === "search") {
    const nodes = [
      { x: 570, y: 55 },
      { x: 300, y: 165 },
      { x: 840, y: 165 },
      { x: 160, y: 300 },
      { x: 430, y: 300 },
      { x: 705, y: 300 },
      { x: 975, y: 300 },
    ];
    content = (
      <>
        {nodes.slice(1).map((p, i) => {
          const parent = nodes[Math.floor(i / 2)];
          return (
            <line
              key={i}
              x1={parent.x}
              y1={parent.y}
              x2={p.x}
              y2={p.y}
              stroke={i % 2 === step % 2 ? c.accent : c.line}
              strokeWidth={i % 2 === step % 2 ? 5 : 2}
              opacity={visible(i / 2)}
            />
          );
        })}
        {nodes.map((p, i) => (
          <g key={i} opacity={visible(Math.log2(i + 1))}>
            <circle
              cx={p.x}
              cy={p.y}
              r={34}
              fill={c.panel}
              stroke={i === 0 || i === 2 || i === 6 ? c.accent : c.secondary}
              strokeWidth={3}
            />
            <Text x={p.x} y={p.y + 9} fill={c.ink} size={24}>
              {i === 0 ? "问题" : i < 3 ? "选择" : "状态"}
            </Text>
          </g>
        ))}
        <Text x={570} y={414} fill={c.ink}>
          产生候选 → 评估 → 继续搜索
        </Text>
        {note("搜索树示意；分支数量不代表真实搜索规模")}
      </>
    );
  } else if (kind === "expert") {
    content = (
      <>
        <Box
          x={65}
          y={120}
          width={260}
          height={180}
          fill={c.panel}
          stroke={c.line}
        >
          <Text x={195} y={182} fill={c.ink} size={32}>
            知识库
          </Text>
          <Text x={195} y={238} fill={c.muted}>
            如果…那么…
          </Text>
        </Box>
        <Box
          x={440}
          y={120}
          width={260}
          height={180}
          fill={c.panel}
          stroke={c.secondary}
        >
          <Text x={570} y={182} fill={c.ink} size={32}>
            推理引擎
          </Text>
          <Text x={570} y={238} fill={c.muted}>
            匹配 · 串联
          </Text>
        </Box>
        <Box
          x={815}
          y={120}
          width={260}
          height={180}
          fill={c.panel}
          stroke={c.accent}
        >
          <Text x={945} y={182} fill={c.ink} size={32}>
            建议
          </Text>
          <Text x={945} y={238} fill={c.muted}>
            说明依据
          </Text>
        </Box>
        {[330, 705].map((x) => (
          <path
            key={x}
            d={`M${x} 210 h100 m-17 -14 17 14 -17 14`}
            fill="none"
            stroke={c.secondary}
            strokeWidth={4}
          />
        ))}
        <Text x={570} y={398} fill={c.ink}>
          规则由人提供；维护同样需要人
        </Text>
        {note("专家系统机制示意；不是实际医疗或工程建议")}
      </>
    );
  } else if (kind === "winter") {
    content = (
      <>
        <circle
          cx={420}
          cy={205}
          r={150}
          fill="none"
          stroke={c.line}
          strokeWidth={35}
        />
        <circle
          cx={710}
          cy={205}
          r={150}
          fill="none"
          stroke={c.secondary}
          strokeWidth={2}
        />
        <Text x={420} y={200} fill={c.ink} size={40}>
          期待
        </Text>
        <Text x={420} y={244} fill={c.muted}>
          承诺与投入
        </Text>
        <Text x={710} y={200} fill={c.ink} size={40}>
          能力
        </Text>
        <Text x={710} y={244} fill={c.muted}>
          数据与条件
        </Text>
        <path
          d="M540 205 H590"
          stroke={c.accent}
          strokeWidth={8}
          strokeDasharray="8 6"
        />
        <Text x={570} y={420} fill={c.accent} size={31}>
          当承诺超出验证，信任就会收缩
        </Text>
        {note("概念关系图；圆的大小不表示经费或能力的测量值")}
      </>
    );
  } else if (kind === "learning") {
    content = (
      <>
        <path
          d="M125 385 V40 M125 385 H1025"
          stroke={c.line}
          strokeWidth={2}
          fill="none"
        />
        {Array.from({ length: 38 }, (_, i) => {
          const group = i % 2;
          const x = 210 + ((i * 73) % 330) + group * 390;
          const y = 75 + ((i * 109) % 265);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={9}
              fill={group ? c.accent : c.secondary}
              opacity={visible(i / 12)}
            />
          );
        })}
        <path
          d={`M${580 - Math.sin(Math.min(t / 4, Math.PI / 2)) * 40} 45 L${610 + Math.sin(Math.min(t / 4, Math.PI / 2)) * 40} 370`}
          stroke={c.ink}
          strokeWidth={4}
        />
        <Text x={570} y={430} fill={c.ink}>
          用样本约束一个可检验的决策边界
        </Text>
        {note("二维合成点与分类边界示意，非历史实验数据")}
      </>
    );
  } else if (kind === "data") {
    content = (
      <>
        {Array.from({ length: 20 }, (_, i) => {
          const x = 70 + (i % 5) * 110;
          const y = 40 + Math.floor(i / 5) * 88;
          return (
            <g key={i} opacity={visible(i / 5)}>
              <rect
                x={x}
                y={y}
                width={90}
                height={70}
                rx={9}
                fill={c.panel}
                stroke={c.line}
              />
              <path
                d={`M${x + 10} ${y + 53} l20 -30 18 17 20 -23 14 36`}
                stroke={i % 2 ? c.accent : c.secondary}
                strokeWidth={3}
                fill="none"
              />
            </g>
          );
        })}
        <path
          d="M640 190 H750 m-18 -16 18 16 -18 16"
          fill="none"
          stroke={c.secondary}
          strokeWidth={4}
        />
        <Box
          x={805}
          y={85}
          width={235}
          height={225}
          fill={c.panel}
          stroke={c.accent}
        >
          <Text x={922} y={162} fill={c.ink} size={32}>
            训练与测试
          </Text>
          <Text x={922} y={222} fill={c.muted} size={24}>
            数据 · 标签 · 划分
          </Text>
          <Text x={922} y={272} fill={c.secondary} size={23}>
            用共同任务比较方法
          </Text>
        </Box>
        {note("图像样本与流程为原创示意，不是原始数据集截图")}
      </>
    );
  } else if (kind === "game") {
    const grid = Array.from({ length: 19 }, (_, i) => i);
    const stones = [
      [7, 7],
      [8, 7],
      [8, 8],
      [9, 8],
      [9, 9],
      [10, 7],
      [6, 8],
      [7, 9],
      [11, 9],
      [9, 6],
      [6, 6],
      [10, 10],
      [12, 7],
      [7, 11],
    ];
    content = (
      <>
        <rect
          x={130}
          y={10}
          width={480}
          height={400}
          rx={16}
          fill={c.panel}
          stroke={c.line}
        />
        {grid.map((i) => (
          <g key={i} stroke={c.line} strokeWidth={1}>
            <line x1={160 + i * 23} x2={160 + i * 23} y1={28} y2={388} />
            <line x1={160} x2={574} y1={28 + i * 20} y2={28 + i * 20} />
          </g>
        ))}
        {stones.map(([x, y], i) => (
          <circle
            key={i}
            cx={160 + x * 23}
            cy={28 + y * 20}
            r={9}
            fill={i % 2 ? "#e8e1d5" : "#07111c"}
            stroke={c.muted}
            opacity={visible(i / 3)}
          />
        ))}
        <circle
          cx={160 + 10 * 23}
          cy={28 + 8 * 20}
          r={17 + pulse * 4}
          fill="none"
          stroke={c.accent}
          strokeWidth={3}
        />
        <Text x={870} y={145} fill={c.ink} size={34}>
          策略
        </Text>
        <Text x={870} y={215} fill={c.secondary} size={34}>
          价值
        </Text>
        <Text x={870} y={285} fill={c.accent} size={34}>
          搜索
        </Text>
        {note("围棋与候选位置示意，不是比赛棋谱重放")}
      </>
    );
  } else if (kind === "attention") {
    const tokens = ["那只猫", "因为", "困了", "所以", "睡觉"];
    content = (
      <>
        {tokens.map((token, i) => (
          <g key={token} opacity={visible(i / 2)}>
            <Box
              x={45 + i * 220}
              y={285}
              width={190}
              height={75}
              fill={c.panel}
              stroke={i === step % 5 ? c.accent : c.line}
            >
              <Text x={140 + i * 220} y={333} fill={c.ink} size={31}>
                {token}
              </Text>
            </Box>
            <path
              d={`M${140 + i * 220} 280 Q${570} ${40 + Math.abs(i - 2) * 20} ${140 + ((step + 2) % 5) * 220} 280`}
              stroke={i % 2 ? c.secondary : c.accent}
              strokeWidth={i === step % 5 ? 5 : 2}
              fill="none"
              opacity={0.6}
            />
          </g>
        ))}
        <Text x={570} y={420} fill={c.ink}>
          依据上下文建立信息之间的联系
        </Text>
        {note("注意力关联的概念示意，非模型权重实测")}
      </>
    );
  } else if (kind === "generative") {
    content = (
      <>
        {[0, 1, 2].map((stage) => (
          <g key={stage} opacity={visible(stage * 1.5)}>
            <rect
              x={60 + stage * 370}
              y={65}
              width={280}
              height={260}
              rx={20}
              fill={c.panel}
              stroke={c.line}
            />
            {stage < 2 ? (
              Array.from({ length: 100 }, (_, i) => (
                <rect
                  key={i}
                  x={78 + stage * 370 + (i % 10) * 24}
                  y={83 + Math.floor(i / 10) * 22}
                  width={22}
                  height={20}
                  fill={(i * 31 + 17) % 101 > 50 ? c.secondary : c.accent}
                  opacity={
                    (stage === 0 ? 0.1 : 0.04) +
                    (((i * 19) % 17) / 25) * (stage === 0 ? 1 : 0.5)
                  }
                />
              ))
            ) : (
              <>
                <circle cx={1040} cy={127} r={27} fill={c.accent} />
                <path
                  d="M820 270 L900 150 L965 230 L1020 180 L1080 270 Z"
                  fill={c.secondary}
                  opacity={0.8}
                />
              </>
            )}
            <Text x={200 + stage * 370} y={385} fill={c.ink} size={30}>
              {["噪声", "逐步变换", "生成样本"][stage]}
            </Text>
          </g>
        ))}
        <path
          d="M345 190 H420 M715 190 H790"
          stroke={c.accent}
          strokeWidth={4}
          strokeDasharray="8 8"
        />
        {note("扩散采样的概念图；GAN 与其他生成路线采用不同机制")}
      </>
    );
  } else if (kind === "evaluation") {
    const checks = ["事实与来源", "任务可靠性", "偏差与公平", "隐私与代价"];
    content = (
      <>
        {checks.map((label, i) => (
          <g key={label} opacity={visible(i)}>
            <Box
              x={70 + (i % 2) * 540}
              y={35 + Math.floor(i / 2) * 200}
              width={470}
              height={160}
              fill={c.panel}
              stroke={i === step % 4 ? c.accent : c.line}
            >
              <circle
                cx={125 + (i % 2) * 540}
                cy={115 + Math.floor(i / 2) * 200}
                r={20}
                stroke={c.secondary}
                fill="none"
                strokeWidth={3}
              />
              <path
                d={`M${115 + (i % 2) * 540} ${115 + Math.floor(i / 2) * 200} l8 8 14 -18`}
                fill="none"
                stroke={c.secondary}
                strokeWidth={3}
              />
              <Text
                x={340 + (i % 2) * 540}
                y={124 + Math.floor(i / 2) * 200}
                fill={c.ink}
                size={32}
              >
                {label}
              </Text>
            </Box>
          </g>
        ))}
        {note("评估维度示意，不代表本片对某个系统作出的评分")}
      </>
    );
  } else if (kind === "timeline") {
    const labels = shot.labels.slice(0, 4);
    content = (
      <>
        <path d="M100 220 H1040" fill="none" stroke={c.line} strokeWidth={4} />
        {labels.map((l, i) => (
          <g key={i} opacity={visible(i)}>
            <circle
              cx={160 + i * 280}
              cy={220}
              r={16 + pulse * 2}
              fill={i === step % labels.length ? c.accent : c.secondary}
            />
            <Text x={160 + i * 280} y={130} fill={c.ink} size={31}>
              {String(l.value ?? "").slice(0, 20)}
            </Text>
            <foreignObject x={60 + i * 280} y={265} width={210} height={105}>
              <div
                style={{
                  color: c.ink,
                  fontSize: 27,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                {l.label}
              </div>
            </foreignObject>
          </g>
        ))}
        {note("节点按叙述顺序排列，间距不表示等长历史时间")}
      </>
    );
  } else {
    const tags =
      kind === "human"
        ? ["提问", "核验", "选择", "负责"]
        : ["规则", "数据", "学习", "生成"];
    content = (
      <>
        <circle
          cx={570}
          cy={205}
          r={130}
          fill={c.panel}
          stroke={c.line}
          strokeWidth={2}
        />
        <circle
          cx={570}
          cy={205}
          r={76 + pulse * 7}
          fill="none"
          stroke={c.secondary}
          strokeWidth={4}
        />
        <circle cx={570} cy={205} r={32} fill={c.accent} />
        {tags.map((s, i) => {
          const x = 570 + Math.cos((i * Math.PI) / 2) * 380;
          const y = 205 + Math.sin((i * Math.PI) / 2) * 145;
          return (
            <g key={s} opacity={visible(i)}>
              <line
                x1={570}
                y1={205}
                x2={x}
                y2={y}
                stroke={c.line}
                strokeWidth={2}
              />
              <Box
                x={x - 96}
                y={y - 36}
                width={192}
                height={72}
                fill={c.bg}
                stroke={i === step % 4 ? c.accent : c.secondary}
              >
                <Text x={x} y={y + 10} fill={c.ink} size={33}>
                  {s}
                </Text>
              </Box>
            </g>
          );
        })}
        <Text x={570} y={430} fill={c.ink} size={31}>
          {kind === "human"
            ? "能力的扩大，也意味着选择的责任"
            : "沿着一个问题，走过多条技术路线"}
        </Text>
      </>
    );
  }
  return (
    <svg
      width="1140"
      height="490"
      viewBox="0 0 1140 490"
      style={{ overflow: "visible" }}
    >
      <g fontFamily='"Microsoft YaHei", "Segoe UI", sans-serif'>{content}</g>
    </svg>
  );
};
