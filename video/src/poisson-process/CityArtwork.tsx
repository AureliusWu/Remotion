import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors, fonts } from "./shared";

const Reader: React.FC<{
  x: number;
  y: number;
  color: string;
  walking?: boolean;
}> = ({ x, y, color, walking = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stride = walking ? Math.sin((frame / fps) * Math.PI * 2.6) * 15 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx="0" cy="8" rx="31" ry="7" fill="#071e27" opacity="0.3" />
      <path
        d={`M-9-44L${-13 + stride} 0M9-44L${14 - stride} 0`}
        stroke="#183642"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path d="M-24-45L-20-99Q0-114 20-99L25-44Z" fill={color} />
      <circle cx="0" cy="-128" r="19" fill="#d7ad83" />
      <path d="M-19-131Q-17-156 3-150Q22-147 20-128L5-136Z" fill="#17353c" />
      <path
        d="M17-93L37-68L45-82"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M27-86l27 2-5 32-27-2Z"
        fill="#f0dfb3"
        stroke="#c99c61"
        strokeWidth="2"
      />
    </g>
  );
};

export const CityArtwork: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <svg viewBox="0 0 1920 1080" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="bookstore-window" x2="0" y2="1">
          <stop stopColor="#f6dba0" />
          <stop offset="1" stopColor="#dfae65" />
        </linearGradient>
        <linearGradient id="street-light" x2="0" y2="1">
          <stop stopColor="#e0bd77" stopOpacity="0.12" />
          <stop offset="1" stopColor="#e0bd77" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="1640" cy="206" r="61" fill="#e6c98c" opacity="0.7" />
      <g fill="#204650">
        <path d="M900 850V440l70-40v450ZM1000 850V215h130v635ZM1150 850V342h170v508ZM1350 850V170h170v680ZM1540 850V350h120v500ZM1680 850V240h110v610Z" />
      </g>
      <g fill="#aaba9f" opacity="0.3">
        {Array.from({ length: 20 }, (_, i) => (
          <rect
            key={i}
            x={1028 + (i % 4) * 210}
            y={280 + Math.floor(i / 4) * 78}
            width="16"
            height="29"
          />
        ))}
      </g>
      <ellipse cx="1320" cy="855" rx="740" ry="105" fill="#173f49" />
      <path d="M0 866Q650 810 1920 866V1080H0Z" fill="#15353f" />
      <path
        d="M0 914Q800 850 1920 920"
        fill="none"
        stroke="#c3b584"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path d="M700 1090L873 459l178 631" fill="url(#street-light)" />
      <path
        d="M872 825V446q0-53 48-53h17"
        fill="none"
        stroke="#526d68"
        strokeWidth="9"
      />
      <path d="M917 413h61l-13-25h-34Z" fill="#e0ba72" />
      <ellipse cx="947" cy="418" rx="24" ry="7" fill="#ffdf9b" />
      <g>
        <path
          d="M1035 810V378h650v432Z"
          fill="#37666a"
          stroke="#6f8b7d"
          strokeWidth="4"
        />
        <path d="M1018 381v-53h686v53Z" fill="#d5bb83" />
        <text
          x="1361"
          y="366"
          textAnchor="middle"
          fill="#254b4b"
          fontFamily={fonts.serif}
          fontSize="32"
          letterSpacing="15"
        >
          转角书店
        </text>
        <rect
          x="1068"
          y="416"
          width="336"
          height="339"
          fill="url(#bookstore-window)"
        />
        <rect x="1440" y="415" width="192" height="395" fill="#d2a769" />
        <path d="M1457 434h158v260h-158Z" fill="#e7cb91" />
        <path d="M1463 451h145v98h-145Z" fill="#b8c0a0" opacity="0.6" />
        <path d="M1463 569h145v113h-145Z" fill="#384c48" />
        <circle cx="1596" cy="723" r="7" fill="#655c45" />
        <path
          d="M1081 546h307M1081 655h307M1081 741h307"
          stroke="#745f45"
          strokeWidth="10"
        />
        <g>
          {Array.from({ length: 24 }, (_, i) => (
            <rect
              key={i}
              x={1090 + (i % 8) * 37}
              y={467 + Math.floor(i / 8) * 108}
              width={20 + (i % 3) * 3}
              height={66 - (i % 4) * 6}
              rx="2"
              fill={["#527d70", "#ba7559", "#9a986b", "#f2dea9"][i % 4]}
            />
          ))}
        </g>
        <path d="M1237 416v339" stroke="#7e684b" strokeWidth="8" />
        <path d="M1035 781h370v29h-370Z" fill="#2a5057" />
        <path d="M1418 812h230v20h-230Z" fill="#55766e" />
      </g>
      <g stroke="#648479" strokeWidth="9" strokeLinecap="round">
        <path d="M1705 792h150M1724 816v28m112-28v28M1713 774h133M1705 750h150" />
      </g>
      <Reader x={1740} y={811} color="#b98262" />
      <g
        opacity={interpolate(
          frame,
          [1 * fps, 2 * fps, 11 * fps, 12 * fps],
          [0, 1, 1, 0],
          clamp,
        )}
      >
        <Reader
          x={interpolate(frame, [1 * fps, 12 * fps], [720, 1510], clamp)}
          y={840}
          color={colors.coral}
          walking
        />
      </g>
      <g
        opacity={interpolate(
          frame,
          [9 * fps, 10 * fps, 18 * fps, 19 * fps],
          [0, 1, 1, 0],
          clamp,
        )}
      >
        <Reader
          x={interpolate(frame, [9 * fps, 19 * fps], [990, 1510], clamp)}
          y={840}
          color="#9ba99c"
          walking
        />
      </g>
      <g fill="#f1ca83" opacity={0.45 + Math.sin(frame / fps) * 0.08}>
        <ellipse cx="1235" cy="857" rx="162" ry="8" />
        <ellipse cx="1523" cy="855" rx="100" ry="5" />
      </g>
    </svg>
  );
};
