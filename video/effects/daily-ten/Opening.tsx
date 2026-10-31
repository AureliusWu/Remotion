import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DISPLAY, Folio, FONT, Narration } from "./SceneFrame";

export const Opening = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  return (
    <AbsoluteFill
      style={{
        background: "#173844",
        color: "#EDF2EE",
        overflow: "hidden",
        fontFamily: FONT,
      }}
    >
      <Folio index={0} dark />
      <svg
        viewBox="0 0 900 900"
        style={{
          position: "absolute",
          width: 1040,
          height: 1040,
          right: -115,
          top: 54,
          opacity: 0.85,
          rotate: `${-19 + (frame / fps) * 0.5}deg`,
        }}
      >
        <defs>
          <radialGradient id="opening-globe">
            <stop offset="0" stopColor="#517D85" />
            <stop offset="1" stopColor="#214B59" />
          </radialGradient>
          <clipPath id="globe-mask">
            <circle cx="450" cy="450" r="304" />
          </clipPath>
        </defs>
        <circle cx="450" cy="450" r="304" fill="url(#opening-globe)" />
        <g
          stroke="#A1C3C9"
          strokeWidth="1.4"
          fill="none"
          opacity="0.45"
          clipPath="url(#globe-mask)"
        >
          {[-240, -160, -80, 0, 80, 160, 240].map((y) => (
            <ellipse
              key={y}
              cx="450"
              cy={450 + y}
              rx={Math.sqrt(304 ** 2 - y ** 2)}
              ry="38"
            />
          ))}
          {[64, 137, 218, 293].map((rx) => (
            <ellipse key={rx} cx="450" cy="450" rx={rx} ry="304" />
          ))}
          <path
            d="M180 330L290 236 365 266 391 337 345 402 379 489 320 589 295 527 252 479 268 421 205 407ZM459 226L537 187 626 246 704 292 683 369 590 372 559 413 516 394 493 319ZM527 417L605 438 630 516 578 627 538 594 515 511ZM629 594L700 580 739 627 700 667 648 651Z"
            fill="#87ADB1"
            stroke="none"
            opacity="0.34"
          />
        </g>
        <ellipse
          cx="450"
          cy="450"
          rx="402"
          ry="165"
          fill="none"
          stroke="#D5B575"
          strokeWidth="2"
          strokeDasharray="4 10"
          rotate="-19"
        />
        <g
          style={{
            rotate: `${(frame / fps) * 9}deg`,
            transformOrigin: "450px 450px",
          }}
        >
          <circle cx="820" cy="450" r="7" fill="#E8C482" />
          <circle
            cx="820"
            cy="450"
            r="17"
            fill="none"
            stroke="#E8C482"
            opacity="0.35"
          />
        </g>
      </svg>
      <Interactive.Div
        name="主标题"
        style={{
          position: "absolute",
          left: 101,
          top: 226,
          fontFamily: DISPLAY,
          fontSize: 119,
          lineHeight: 1.25,
          fontWeight: 600,
          letterSpacing: 6,
          whiteSpace: "pre-line",
          opacity: interpolate(frame, [0, 0.9 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0, 1.8 * fps],
            ["0px 45px", "0px 0px"],
            { ...clamp, easing: Easing.bezier(0.19, 1, 0.22, 1) },
          ),
        }}
      >
        此刻，世界{"\n"}在发生什么
      </Interactive.Div>
      <Interactive.Div
        name="影片导语"
        style={{
          position: "absolute",
          left: 107,
          top: 610,
          fontSize: 33,
          letterSpacing: 2,
          lineHeight: 1.8,
          opacity: interpolate(frame, [1.2 * fps, 2.2 * fps], [0, 1], clamp),
        }}
      >
        从身边的政策，到遥远的太空。
        <br />
        <span style={{ color: "#ABC5CA" }}>
          十件事，三分钟，给新闻多一点背景。
        </span>
      </Interactive.Div>
      <Interactive.Div
        name="本期日期"
        style={{
          position: "absolute",
          left: 107,
          top: 793,
          display: "flex",
          alignItems: "center",
          gap: 23,
          fontSize: 23,
          letterSpacing: 3,
          color: "#D5B575",
        }}
      >
        <span style={{ width: 40, height: 2, background: "#D5B575" }} />
        10月30日 · 新闻观察
      </Interactive.Div>
      <Narration id="intro" />
    </AbsoluteFill>
  );
};
