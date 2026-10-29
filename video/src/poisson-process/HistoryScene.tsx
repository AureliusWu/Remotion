import {
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { clamp, colors, fonts, Frame } from "./shared";

export const HistoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Frame
      number="07"
      chapter="数学与人的判断"
      title="概率论，也曾走进司法的讨论"
      note="书目：法国国家图书馆 BnF · S.-D. Poisson · Paris: Bachelier, 1837。"
    >
      <Interactive.Div
        name="1837年的书"
        premountFor={fps}
        style={{
          position: "absolute",
          left: 158,
          top: 300,
          width: 560,
          height: 540,
          rotate: interpolate(frame, [0, 5 * fps], ["-6deg", "-2deg"], clamp),
        }}
      >
        <svg width="560" height="540" viewBox="0 0 560 540" aria-hidden>
          <path d="M56 18H480V515H56Z" fill="#bda67b" />
          <path
            d="M76 0H490V497H76Z"
            fill="#e1d1aa"
            stroke="#b79f70"
            strokeWidth="3"
          />
          <path
            d="M90 14H476V483H90Z"
            fill="#efe4c8"
            stroke="#bca77e"
            strokeWidth="2"
          />
          <path
            d="M118 40H450V450H118Z"
            fill="none"
            stroke="#b7a279"
            strokeWidth="2"
          />
          <text
            x="284"
            y="105"
            textAnchor="middle"
            fill={colors.ink}
            fontFamily="Georgia, serif"
            fontSize="24"
          >
            RECHERCHES
          </text>
          <text
            x="284"
            y="156"
            textAnchor="middle"
            fill={colors.ink}
            fontFamily="Georgia, serif"
            fontSize="19"
          >
            SUR LA PROBABILITÉ
          </text>
          <text
            x="284"
            y="198"
            textAnchor="middle"
            fill={colors.ink}
            fontFamily="Georgia, serif"
            fontSize="19"
          >
            DES JUGEMENTS
          </text>
          <text
            x="284"
            y="243"
            textAnchor="middle"
            fill={colors.ink}
            fontFamily="Georgia, serif"
            fontSize="15"
          >
            EN MATIÈRE CRIMINELLE
          </text>
          <text
            x="284"
            y="271"
            textAnchor="middle"
            fill={colors.ink}
            fontFamily="Georgia, serif"
            fontSize="15"
          >
            ET EN MATIÈRE CIVILE
          </text>
          <path d="M215 312H353" stroke="#ac9669" strokeWidth="2" />
          <text
            x="284"
            y="356"
            textAnchor="middle"
            fill={colors.ink}
            fontFamily="Georgia, serif"
            fontSize="22"
          >
            S.-D. POISSON
          </text>
          <text
            x="284"
            y="409"
            textAnchor="middle"
            fill={colors.muted}
            fontFamily="Georgia, serif"
            fontSize="19"
          >
            PARIS · 1837
          </text>
        </svg>
      </Interactive.Div>
      <Interactive.Div
        name="历史事实与人文思考"
        premountFor={fps}
        style={{ position: "absolute", left: 850, top: 320, width: 900 }}
      >
        <div
          style={{
            fontFamily: fonts.number,
            fontSize: 112,
            color: colors.coral,
          }}
        >
          1837
        </div>
        <div style={{ fontSize: 41, lineHeight: 1.7, marginTop: 12 }}>
          泊松出版了关于
          <br />
          刑事与民事判决概率的著作。
        </div>
        <div
          style={{
            width: 90,
            height: 4,
            backgroundColor: colors.teal,
            marginTop: 32,
          }}
        />
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 48,
            lineHeight: 1.6,
            marginTop: 30,
          }}
        >
          数学描述不确定，
          <br />
          不替我们裁定人的价值。
        </div>
        <div style={{ fontSize: 25, color: colors.muted, marginTop: 24 }}>
          示意书封重绘；不表示现代泊松过程在当年已完整提出。
        </div>
      </Interactive.Div>
    </Frame>
  );
};
