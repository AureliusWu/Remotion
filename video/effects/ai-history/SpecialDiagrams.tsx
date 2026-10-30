import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, type Palette } from "./palette";
import type { HistoryShot } from "./types";

type Props = { shot: HistoryShot; palette: Palette; step: number };
type Point = { x: number; y: number };

const Text: React.FC<{
  x: number;
  y: number;
  children: React.ReactNode;
  color: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}> = ({
  x,
  y,
  children,
  color,
  size = 28,
  anchor = "middle",
  weight = 400,
}) => (
  <text
    x={x}
    y={y}
    fill={color}
    fontSize={size}
    textAnchor={anchor}
    fontWeight={weight}
  >
    {children}
  </text>
);

const Arrow: React.FC<{
  from: Point;
  to: Point;
  color: string;
  dashed?: boolean;
}> = ({ from, to, color, dashed = false }) => {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const points = [
    to,
    {
      x: to.x - 15 * Math.cos(angle) + 7 * Math.sin(angle),
      y: to.y - 15 * Math.sin(angle) - 7 * Math.cos(angle),
    },
    {
      x: to.x - 15 * Math.cos(angle) - 7 * Math.sin(angle),
      y: to.y - 15 * Math.sin(angle) + 7 * Math.cos(angle),
    },
  ];
  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={3}
        strokeDasharray={dashed ? "10 8" : undefined}
      />
      <polygon
        points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        fill={color}
      />
    </g>
  );
};

const Card: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  palette: Palette;
  accent?: boolean;
  children?: React.ReactNode;
}> = ({ x, y, width, height, palette: c, accent = false, children }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={17}
      fill={c.panel}
      stroke={accent ? c.accent : c.line}
      strokeWidth={accent ? 3 : 2}
    />
    {children}
  </g>
);

const Note: React.FC<{ palette: Palette; children: string }> = ({
  palette: c,
  children,
}) => (
  <Text x={570} y={472} color={c.muted} size={21}>
    {children}
  </Text>
);

const ChessBoard: React.FC<{ palette: Palette }> = ({ palette: c }) => {
  const pieces = [
    ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
    Array.from({ length: 8 }, () => "♟"),
    [],
    [],
    [],
    [],
    Array.from({ length: 8 }, () => "♙"),
    ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"],
  ];
  return (
    <g>
      <Text x={230} y={40} color={c.ink} size={30}>
        国际象棋 · 8×8
      </Text>
      {Array.from({ length: 64 }, (_, i) => {
        const row = Math.floor(i / 8);
        const column = i % 8;
        return (
          <g key={i}>
            <rect
              x={70 + column * 40}
              y={65 + row * 40}
              width={40}
              height={40}
              fill={(row + column) % 2 === 0 ? "#d6d9d0" : "#6e9595"}
            />
            {pieces[row][column] ? (
              <text
                x={90 + column * 40}
                y={96 + row * 40}
                textAnchor="middle"
                fontFamily='"Segoe UI Symbol", "DejaVu Sans", serif'
                fontSize={35}
                fill={row < 2 ? "#14262d" : "#fffdf4"}
                stroke={row < 2 ? "#14262d" : "#14262d"}
                strokeWidth={row < 2 ? 0 : 0.7}
                paintOrder="stroke"
              >
                {pieces[row][column]}
              </text>
            ) : null}
          </g>
        );
      })}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <Text x={90 + i * 40} y={422} color={c.muted} size={26}>
            {String.fromCharCode(97 + i)}
          </Text>
          <Text x={43} y={93 + i * 40} color={c.muted} size={26}>
            {8 - i}
          </Text>
        </g>
      ))}
    </g>
  );
};

const ExampleImage: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  palette: Palette;
}> = ({ x, y, width, height, palette: c }) => (
  <g>
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={12}
      fill={c.bg}
      stroke={c.line}
      strokeWidth={2}
    />
    <circle
      cx={x + width * 0.75}
      cy={y + height * 0.27}
      r={11}
      fill={c.accent}
    />
    <path
      d={`M${x + 15} ${y + height - 16} L${x + width * 0.36} ${y + height * 0.43} L${x + width * 0.56} ${y + height * 0.7} L${x + width * 0.71} ${y + height * 0.5} L${x + width - 15} ${y + height - 16} Z`}
      fill={c.secondary}
      opacity={0.8}
    />
  </g>
);

export const SpecialDiagram: React.FC<Props> = ({ shot, palette: c, step }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const seconds = frame / fps;
  let content: React.ReactNode;

  switch (shot.id) {
    case "01-03":
      content = (
        <>
          <Text x={570} y={42} color={c.ink} size={32}>
            同一个问题，换一种问法
          </Text>
          {[
            { x: 65, title: "解释结论", answer: "回答 A" },
            { x: 655, title: "检查前提", answer: "回答 B" },
          ].map((item) => (
            <g key={item.title}>
              <Card x={item.x} y={95} width={420} height={95} palette={c}>
                <Text x={item.x + 210} y={152} color={c.ink} size={32}>
                  {item.title}
                </Text>
              </Card>
              <Arrow
                from={{ x: item.x + 210, y: 200 }}
                to={{ x: item.x + 210, y: 260 }}
                color={c.secondary}
              />
              <Card x={item.x} y={270} width={420} height={85} palette={c}>
                <Text x={item.x + 210} y={323} color={c.ink} size={30}>
                  {item.answer}
                </Text>
              </Card>
            </g>
          ))}
          <Text x={570} y={318} color={c.accent} size={28}>
            比较
          </Text>
          {["事实", "推理", "一致性"].map((label, i) => (
            <g key={label}>
              <rect
                x={250 + i * 220}
                y={390}
                width={200}
                height={47}
                rx={13}
                fill={i === step % 3 ? c.accent : c.panel}
              />
              <Text
                x={350 + i * 220}
                y={423}
                color={i === step % 3 ? c.bg : c.ink}
                size={27}
              >
                {label}
              </Text>
            </g>
          ))}
          <Note palette={c}>可靠性比较示意；回答一致，也不保证事实正确</Note>
        </>
      );
      break;

    case "02-02": {
      const secondInput = Math.floor(seconds / 4) % 2;
      const output = secondInput === 1 ? 1 : 0;
      content = (
        <>
          <Text x={570} y={40} color={c.ink} size={32}>
            二值输入 → 阈值判断 → 二值输出
          </Text>
          {[
            { y: 130, value: 1 },
            { y: 300, value: secondInput },
          ].map(({ y, value }, i) => (
            <g key={y}>
              <circle
                cx={150}
                cy={y}
                r={46}
                fill={c.panel}
                stroke={value ? c.secondary : c.line}
                strokeWidth={3}
              />
              <Text x={150} y={y + 14} color={c.ink} size={40}>
                {value}
              </Text>
              <Text x={150} y={y + 84} color={c.muted} size={26}>
                输入 {i + 1}
              </Text>
              <Arrow
                from={{ x: 205, y }}
                to={{ x: 470, y: 210 }}
                color={value ? c.secondary : c.line}
              />
            </g>
          ))}
          <circle
            cx={555}
            cy={210}
            r={78}
            fill={c.panel}
            stroke={c.accent}
            strokeWidth={3}
          />
          <Text x={555} y={202} color={c.ink} size={30}>
            求和
          </Text>
          <Text x={555} y={244} color={c.accent} size={32}>
            ≥ θ
          </Text>
          <Arrow
            from={{ x: 643, y: 210 }}
            to={{ x: 890, y: 210 }}
            color={output ? c.secondary : c.line}
          />
          <circle
            cx={965}
            cy={210}
            r={63}
            fill={output ? c.secondary : c.panel}
            stroke={c.secondary}
            strokeWidth={3}
          />
          <Text x={965} y={226} color={output ? c.bg : c.ink} size={48}>
            {output}
          </Text>
          <Text x={965} y={312} color={c.muted} size={26}>
            输出
          </Text>
          <Text x={570} y={407} color={c.ink} size={28}>
            θ = 2；每个输入贡献 1
          </Text>
          <Note palette={c}>
            固定门槛的简化示意；非现代深层网络，不还原神经元生理细节
          </Note>
        </>
      );
      break;
    }

    case "02-03":
      content = (
        <>
          <Text x={570} y={45} color={c.ink} size={32}>
            只通过文字判断回答者
          </Text>
          <Card x={40} y={170} width={250} height={130} palette={c} accent>
            <Text x={165} y={224} color={c.ink} size={34}>
              提问者
            </Text>
            <Text x={165} y={267} color={c.muted} size={26}>
              看不到对方身份
            </Text>
          </Card>
          <line
            x1={590}
            y1={65}
            x2={590}
            y2={415}
            stroke={c.line}
            strokeWidth={3}
            strokeDasharray="10 10"
          />
          <Text x={590} y={443} color={c.muted} size={26}>
            隔屏
          </Text>
          {[
            { y: 95, name: "终端 A", role: "人" },
            { y: 285, name: "终端 B", role: "机器" },
          ].map((item) => (
            <g key={item.name}>
              <path
                d={`M300 235 H430 V${item.y + 55} H720`}
                fill="none"
                stroke={c.secondary}
                strokeWidth={3}
              />
              <polygon
                points={`720,${item.y + 55} 705,${item.y + 48} 705,${item.y + 62}`}
                fill={c.secondary}
              />
              <Card x={730} y={item.y} width={345} height={110} palette={c}>
                <Text x={902} y={item.y + 43} color={c.ink} size={30}>
                  {item.name}
                </Text>
                <Text x={902} y={item.y + 84} color={c.secondary} size={27}>
                  {item.role} · 身份遮蔽
                </Text>
              </Card>
            </g>
          ))}
          <Text x={470} y={106} color={c.muted} size={26}>
            提问 / 回答
          </Text>
          <polygon points="300,235 315,228 315,242" fill={c.secondary} />
          <Note palette={c}>
            机器参与的文字问答机制示意；不复现原论文模仿游戏的全部设置
          </Note>
        </>
      );
      break;

    case "04-04": {
      const tilt = 35 * Math.sin(seconds * 0.35);
      const points = [
        { x: 200, y: 335, value: 0, label: "(0,0)" },
        { x: 470, y: 125, value: 0, label: "(1,1)" },
        { x: 200, y: 125, value: 1, label: "(0,1)" },
        { x: 470, y: 335, value: 1, label: "(1,0)" },
      ];
      content = (
        <>
          <Arrow
            from={{ x: 140, y: 390 }}
            to={{ x: 560, y: 390 }}
            color={c.muted}
          />
          <Arrow
            from={{ x: 140, y: 390 }}
            to={{ x: 140, y: 55 }}
            color={c.muted}
          />
          <Text x={565} y={427} color={c.muted} size={26}>
            x₁
          </Text>
          <Text x={110} y={64} color={c.muted} size={26}>
            x₂
          </Text>
          <line
            x1={315 - tilt}
            y1={80}
            x2={355 + tilt}
            y2={375}
            stroke={c.accent}
            strokeWidth={3}
            strokeDasharray="11 8"
          />
          {points.map((p) => (
            <g key={p.label}>
              {p.value === 0 ? (
                <circle cx={p.x} cy={p.y} r={25} fill={c.accent} />
              ) : (
                <rect
                  x={p.x - 25}
                  y={p.y - 25}
                  width={50}
                  height={50}
                  rx={6}
                  fill={c.secondary}
                />
              )}
              <Text x={p.x} y={p.y + 10} color={c.bg} size={29} weight={700}>
                {p.value}
              </Text>
              <Text
                x={p.x}
                y={p.y + (p.y < 200 ? -45 : 55)}
                color={c.ink}
                size={27}
              >
                {p.label}
              </Text>
            </g>
          ))}
          <Text x={837} y={105} color={c.ink} size={34}>
            异或 XOR
          </Text>
          <Text x={837} y={173} color={c.accent} size={28}>
            类别 0：(0,0)、(1,1)
          </Text>
          <Text x={837} y={225} color={c.secondary} size={28}>
            类别 1：(0,1)、(1,0)
          </Text>
          <Text x={837} y={315} color={c.ink} size={30}>
            一条直线
          </Text>
          <Text x={837} y={360} color={c.ink} size={30}>
            无法把两类完全分开
          </Text>
          <Note palette={c}>
            四个点是异或真值表；虚线仅示意单一线性分界，类别不随动画改变
          </Note>
        </>
      );
      break;
    }

    case "08-01":
    case "08-02": {
      const layers = [
        [
          { x: 150, y: 190 },
          { x: 150, y: 320 },
        ],
        [
          { x: 435, y: 155 },
          { x: 435, y: 250 },
          { x: 435, y: 345 },
        ],
        [{ x: 730, y: 250 }],
      ];
      content = (
        <>
          <Text x={570} y={42} color={c.ink} size={32}>
            多层网络：把输出误差联系到内部参数
          </Text>
          <Arrow
            from={{ x: 150, y: 105 }}
            to={{ x: 1080, y: 105 }}
            color={c.secondary}
          />
          <Text x={570} y={87} color={c.secondary} size={26}>
            前向：预测与损失
          </Text>
          {layers
            .slice(0, -1)
            .flatMap((layer, l) =>
              layer.flatMap((from, i) =>
                layers[l + 1].map((to, j) => (
                  <line
                    key={`${l}-${i}-${j}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={(i + j + step) % 3 === 0 ? c.accent : c.line}
                    strokeWidth={2.5}
                  />
                )),
              ),
            )}
          {layers.flatMap((layer, l) =>
            layer.map((p, i) => (
              <circle
                key={`${l}-${i}`}
                cx={p.x}
                cy={p.y}
                r={23}
                fill={c.panel}
                stroke={c.secondary}
                strokeWidth={3}
              />
            )),
          )}
          <Text x={150} y={405} color={c.ink} size={28}>
            输入
          </Text>
          <Text x={435} y={405} color={c.ink} size={28}>
            隐藏层 / 参数
          </Text>
          <Text x={730} y={405} color={c.ink} size={28}>
            预测
          </Text>
          <Arrow
            from={{ x: 765, y: 250 }}
            to={{ x: 885, y: 250 }}
            color={c.secondary}
          />
          <Card x={900} y={195} width={190} height={110} palette={c} accent>
            <Text x={995} y={240} color={c.ink} size={32}>
              损失
            </Text>
            <Text x={995} y={283} color={c.muted} size={26}>
              与目标比较
            </Text>
          </Card>
          <Text x={995} y={162} color={c.muted} size={27}>
            目标
          </Text>
          <Arrow
            from={{ x: 995, y: 169 }}
            to={{ x: 995, y: 188 }}
            color={c.accent}
          />
          <path
            d="M995 317 V445 H165"
            fill="none"
            stroke={c.accent}
            strokeWidth={3}
            strokeDasharray="10 8"
            strokeDashoffset={seconds * 18}
          />
          <polygon points="165,445 180,438 180,452" fill={c.accent} />
          <Text x={570} y={435} color={c.accent} size={26}>
            反向：求梯度 → 随后更新参数
          </Text>
          <Note palette={c}>
            简化机制示意；反向箭头是求导信息，不是神经元生理信号的解释
          </Note>
        </>
      );
      break;
    }

    case "09-03":
      content = (
        <>
          <Text x={570} y={45} color={c.ink} size={32}>
            概率模型：隐状态与观测的依赖
          </Text>
          {[250, 570, 890].map((x, i) => (
            <g key={x}>
              <circle
                cx={x}
                cy={140}
                r={56}
                fill={c.bg}
                stroke={c.accent}
                strokeWidth={3}
              />
              <Text x={x} y={150} color={c.ink} size={28}>
                状态 {i + 1}
              </Text>
              <Arrow
                from={{ x, y: 205 }}
                to={{ x, y: 294 }}
                color={c.secondary}
              />
              <Text x={x + 130} y={258} color={c.muted} size={26}>
                观测概率
              </Text>
              <Card x={x - 92} y={305} width={184} height={76} palette={c}>
                <Text x={x} y={353} color={c.ink} size={28}>
                  观测 {i + 1}
                </Text>
              </Card>
              {i < 2 ? (
                <>
                  <Arrow
                    from={{ x: x + 66, y: 140 }}
                    to={{ x: x + 254, y: 140 }}
                    color={c.accent}
                  />
                  <Text x={x + 160} y={105} color={c.muted} size={26}>
                    转移概率
                  </Text>
                </>
              ) : null}
            </g>
          ))}
          <Text x={570} y={430} color={c.muted} size={26}>
            圆：隐状态 / 方框：已观测证据
          </Text>
          <Note palette={c}>
            隐马尔可夫模型的简化依赖图；不是神经网络的层结构
          </Note>
        </>
      );
      break;

    case "10-01":
      content = (
        <>
          <ChessBoard palette={c} />
          {["搜索", "评估", "棋类知识"].map((label, i) => (
            <Card
              key={label}
              x={475}
              y={70 + i * 115}
              width={295}
              height={83}
              palette={c}
              accent={i === step % 3}
            >
              <Text x={622} y={123 + i * 115} color={c.ink} size={34}>
                {label}
              </Text>
            </Card>
          ))}
          <Arrow
            from={{ x: 400, y: 225 }}
            to={{ x: 460, y: 225 }}
            color={c.secondary}
          />
          <path
            d="M835 140 L950 220 L1080 110 M950 220 L1080 325 M835 325 L950 220"
            fill="none"
            stroke={c.line}
            strokeWidth={3}
          />
          {[
            { x: 835, y: 140 },
            { x: 835, y: 325 },
            { x: 950, y: 220 },
            { x: 1080, y: 110 },
            { x: 1080, y: 325 },
          ].map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={15}
              fill={i === 2 ? c.accent : c.secondary}
            />
          ))}
          <Text x={950} y={407} color={c.muted} size={27}>
            比较候选走法
          </Text>
          <Note palette={c}>
            8×8国际象棋；棋盘为初始布局示意，非1997年实盘棋谱
          </Note>
        </>
      );
      break;

    case "10-03":
      content = (
        <>
          <Text x={570} y={45} color={c.ink} size={32}>
            ILSVRC 2012 测试集 · 前五错误率
          </Text>
          {[0, 10, 20, 30].map((value) => (
            <g key={value}>
              <line
                x1={200}
                y1={390 - value * 10}
                x2={1030}
                y2={390 - value * 10}
                stroke={c.line}
                strokeWidth={value === 0 ? 3 : 1}
              />
              <Text
                x={175}
                y={399 - value * 10}
                color={c.muted}
                size={26}
                anchor="end"
              >
                {value}%
              </Text>
            </g>
          ))}
          {[
            {
              x: 340,
              value: 15.3,
              label: "AlexNet竞赛版本",
              color: c.secondary,
            },
            { x: 710, value: 26.2, label: "第二名", color: c.accent },
          ].map((bar, i) => (
            <g
              key={bar.label}
              opacity={interpolate(
                frame,
                [i * 0.4 * fps, (i * 0.4 + 0.7) * fps],
                [0, 1],
                clamp,
              )}
            >
              <rect
                x={bar.x}
                y={390 - bar.value * 10}
                width={170}
                height={bar.value * 10}
                rx={5}
                fill={bar.color}
              />
              <Text
                x={bar.x + 85}
                y={370 - bar.value * 10}
                color={bar.color}
                size={36}
                weight={700}
              >
                {bar.value}%
              </Text>
              <Text x={bar.x + 85} y={433} color={c.ink} size={27}>
                {bar.label}
              </Text>
            </g>
          ))}
          <Text x={1020} y={65} color={c.muted} size={26} anchor="end">
            越低越好
          </Text>
          <Note palette={c}>
            原论文报告值；前五候选均未命中正确类别的比例；纵轴统一从0开始
          </Note>
        </>
      );
      break;

    case "12-01":
      content = (
        <>
          <Text x={570} y={42} color={c.ink} size={32}>
            先预训练，再适应任务
          </Text>
          <Card x={40} y={145} width={250} height={140} palette={c}>
            <Text x={165} y={199} color={c.ink} size={32}>
              预训练语料
            </Text>
            <Text x={165} y={250} color={c.muted} size={26}>
              未逐项人工标注
            </Text>
          </Card>
          <Arrow
            from={{ x: 305, y: 215 }}
            to={{ x: 385, y: 215 }}
            color={c.secondary}
          />
          <Card x={400} y={145} width={250} height={140} palette={c} accent>
            <Text x={525} y={199} color={c.ink} size={32}>
              预训练
            </Text>
            <Text x={525} y={250} color={c.muted} size={26}>
              预测后续片段
            </Text>
          </Card>
          <Arrow
            from={{ x: 665, y: 215 }}
            to={{ x: 775, y: 215 }}
            color={c.secondary}
          />
          <Text x={725} y={112} color={c.muted} size={26}>
            迁移参数
          </Text>
          <Card x={790} y={145} width={300} height={140} palette={c}>
            <Text x={940} y={199} color={c.ink} size={32}>
              任务适应
            </Text>
            <Text x={940} y={250} color={c.muted} size={26}>
              分类 / 问答等
            </Text>
          </Card>
          <Card x={815} y={365} width={250} height={63} palette={c}>
            <Text x={940} y={405} color={c.ink} size={27}>
              任务数据
            </Text>
          </Card>
          <Arrow
            from={{ x: 940, y: 352 }}
            to={{ x: 940, y: 298 }}
            color={c.accent}
          />
          <Note palette={c}>
            2018年GPT论文路线的简化示意；预训练不等于已核实的知识库
          </Note>
        </>
      );
      break;

    case "12-02":
      content = (
        <>
          <Text x={570} y={45} color={c.ink} size={32}>
            利用两侧上下文，恢复被遮盖内容
          </Text>
          <Arrow
            from={{ x: 80, y: 80 }}
            to={{ x: 407, y: 80 }}
            color={c.secondary}
          />
          <Arrow
            from={{ x: 1050, y: 80 }}
            to={{ x: 407, y: 80 }}
            color={c.secondary}
          />
          <Arrow
            from={{ x: 407, y: 82 }}
            to={{ x: 407, y: 115 }}
            color={c.secondary}
          />
          {["这", "只", "[MASK]", "正", "在", "奔", "跑"].map((token, i) => (
            <Card
              key={i}
              x={70 + i * 140}
              y={125}
              width={115}
              height={82}
              palette={c}
              accent={i === 2}
            >
              <Text
                x={127 + i * 140}
                y={177}
                color={i === 2 ? c.accent : c.ink}
                size={token.length > 1 ? 26 : 34}
              >
                {token}
              </Text>
            </Card>
          ))}
          <Text x={195} y={272} color={c.muted} size={27}>
            左侧上下文
          </Text>
          <Text x={800} y={272} color={c.muted} size={27}>
            右侧上下文
          </Text>
          <Arrow
            from={{ x: 407, y: 220 }}
            to={{ x: 407, y: 312 }}
            color={c.accent}
          />
          <Card x={257} y={325} width={300} height={98} palette={c} accent>
            <Text x={407} y={365} color={c.ink} size={28}>
              恢复原词
            </Text>
            <Text x={407} y={406} color={c.secondary} size={30}>
              训练原词示例：狗
            </Text>
          </Card>
          <Note palette={c}>
            遮盖词训练的玩具句子；不表示该语境只有一种可能补词
          </Note>
        </>
      );
      break;

    case "13-01":
      content = (
        <>
          <path
            d="M990 173 V45 H385 V88"
            fill="none"
            stroke={c.accent}
            strokeWidth={3}
            strokeDasharray="10 8"
            strokeDashoffset={-seconds * 18}
          />
          <polygon points="385,88 378,73 392,73" fill={c.accent} />
          <Text x={690} y={36} color={c.accent} size={26}>
            训练反馈 → 更新生成器
          </Text>
          <Card x={40} y={95} width={180} height={80} palette={c}>
            <Text x={130} y={144} color={c.ink} size={29}>
              随机输入
            </Text>
          </Card>
          <Arrow
            from={{ x: 232, y: 135 }}
            to={{ x: 273, y: 135 }}
            color={c.secondary}
          />
          <Card x={285} y={95} width={200} height={80} palette={c} accent>
            <Text x={385} y={144} color={c.ink} size={32}>
              生成器
            </Text>
          </Card>
          <Arrow
            from={{ x: 497, y: 135 }}
            to={{ x: 548, y: 135 }}
            color={c.secondary}
          />
          <ExampleImage x={560} y={75} width={220} height={120} palette={c} />
          <Text x={670} y={232} color={c.ink} size={27}>
            生成样本
          </Text>
          <ExampleImage x={560} y={300} width={220} height={120} palette={c} />
          <Text x={670} y={281} color={c.ink} size={27}>
            真实样本
          </Text>
          <path
            d="M790 135 H850 V205 H878 M790 360 H850 V255 H878"
            fill="none"
            stroke={c.secondary}
            strokeWidth={3}
          />
          <polygon points="878,205 863,198 863,212" fill={c.secondary} />
          <polygon points="878,255 863,248 863,262" fill={c.secondary} />
          <Card x={890} y={180} width={200} height={100} palette={c} accent>
            <Text x={990} y={225} color={c.ink} size={32}>
              判别器
            </Text>
            <Text x={990} y={263} color={c.muted} size={26}>
              真 / 假评分
            </Text>
          </Card>
          <Text x={300} y={337} color={c.ink} size={29}>
            交替更新
          </Text>
          <Text x={300} y={384} color={c.muted} size={27}>
            生成器与判别器
          </Text>
          <Note palette={c}>
            对抗训练机制示意；样本图标为示意，不是扩散模型的逐步去噪
          </Note>
        </>
      );
      break;

    case "13-03":
      content = (
        <>
          <Text x={570} y={45} color={c.ink} size={32}>
            图像与文本，映射到共享表示
          </Text>
          <Card x={55} y={70} width={200} height={130} palette={c}>
            <path
              d="M114 118 L116 91 L141 104 M169 104 L194 91 L196 118"
              fill={c.secondary}
              stroke={c.secondary}
              strokeWidth={3}
            />
            <ellipse cx={155} cy={135} rx={45} ry={35} fill={c.secondary} />
            <circle cx={140} cy={130} r={4} fill={c.bg} />
            <circle cx={171} cy={130} r={4} fill={c.bg} />
            <path d="M149 145 L160 145 L155 152 Z" fill={c.bg} />
          </Card>
          <Text x={155} y={240} color={c.muted} size={26}>
            图像示意
          </Text>
          <Card x={55} y={310} width={200} height={80} palette={c}>
            <Text x={155} y={361} color={c.ink} size={30}>
              一只猫
            </Text>
          </Card>
          <Arrow
            from={{ x: 267, y: 135 }}
            to={{ x: 337, y: 135 }}
            color={c.secondary}
          />
          <Arrow
            from={{ x: 267, y: 350 }}
            to={{ x: 337, y: 350 }}
            color={c.accent}
          />
          <Card x={350} y={90} width={250} height={90} palette={c}>
            <Text x={475} y={146} color={c.ink} size={30}>
              图像编码器
            </Text>
          </Card>
          <Card x={350} y={305} width={250} height={90} palette={c}>
            <Text x={475} y={361} color={c.ink} size={30}>
              文本编码器
            </Text>
          </Card>
          <Arrow
            from={{ x: 612, y: 135 }}
            to={{ x: 735, y: 170 }}
            color={c.secondary}
          />
          <Arrow
            from={{ x: 612, y: 350 }}
            to={{ x: 735, y: 315 }}
            color={c.accent}
          />
          <ellipse
            cx={920}
            cy={245}
            rx={178}
            ry={170}
            fill={c.panel}
            stroke={c.line}
            strokeWidth={2}
          />
          <Text x={920} y={127} color={c.ink} size={30}>
            共享表示
          </Text>
          <line
            x1={860}
            y1={228}
            x2={955}
            y2={282}
            stroke={c.secondary}
            strokeWidth={2}
            strokeDasharray="7 6"
          />
          <circle cx={860} cy={228} r={15} fill={c.secondary} />
          <circle cx={955} cy={282} r={15} fill={c.accent} />
          <Text x={860} y={202} color={c.secondary} size={26}>
            图像
          </Text>
          <Text x={991} y={328} color={c.accent} size={26}>
            文本
          </Text>
          <Text x={920} y={377} color={c.muted} size={26}>
            匹配图文更接近
          </Text>
          <Note palette={c}>概念表示图；点的位置与距离不是CLIP实测结果</Note>
        </>
      );
      break;

    case "14-01": {
      const chain = [
        [810, 165],
        [850, 135],
        [905, 150],
        [930, 205],
        [895, 245],
        [845, 230],
        [830, 285],
        [875, 330],
        [930, 315],
        [970, 260],
        [1020, 280],
        [1065, 235],
        [1045, 175],
        [995, 150],
        [970, 100],
      ];
      content = (
        <>
          <Text x={570} y={45} color={c.ink} size={32}>
            从氨基酸序列预测结构
          </Text>
          <Text x={240} y={119} color={c.ink} size={30}>
            氨基酸序列
          </Text>
          <Card x={40} y={150} width={385} height={100} palette={c}>
            <Text x={232} y={212} color={c.secondary} size={32}>
              M A K L V G D E …
            </Text>
          </Card>
          <Text x={232} y={300} color={c.muted} size={26}>
            示意序列
          </Text>
          <Arrow
            from={{ x: 440, y: 200 }}
            to={{ x: 495, y: 200 }}
            color={c.secondary}
          />
          <Card x={510} y={150} width={225} height={100} palette={c} accent>
            <Text x={622} y={212} color={c.ink} size={32}>
              结构预测
            </Text>
          </Card>
          <Arrow
            from={{ x: 750, y: 200 }}
            to={{ x: 795, y: 200 }}
            color={c.secondary}
          />
          <polyline
            points={chain.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none"
            stroke={c.secondary}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {chain.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={9}
              fill={i % 3 === 0 ? c.accent : c.secondary}
              stroke={c.bg}
              strokeWidth={2}
            />
          ))}
          <Text x={940} y={385} color={c.muted} size={27}>
            结构示意 · 非实测
          </Text>
          <Text x={622} y={352} color={c.ink} size={28}>
            预测仍需验证
          </Text>
          <Note palette={c}>简化线链；非真实蛋白结构，不表示实际折叠路径</Note>
        </>
      );
      break;
    }

    default:
      return null;
  }

  return (
    <svg
      width={1140}
      height={490}
      viewBox="0 0 1140 490"
      role="img"
      aria-label={`${shot.title}：概念与数据图解`}
      style={{ fontFamily: '"Microsoft YaHei", "Segoe UI", sans-serif' }}
    >
      <g opacity={interpolate(frame, [0, 0.55 * fps], [0, 1], clamp)}>
        {content}
      </g>
    </svg>
  );
};
