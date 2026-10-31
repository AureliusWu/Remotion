import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DISPLAY, FONT, Narration } from "./SceneFrame";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.19, 1, 0.22, 1);

export const PortraitOpening = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: "#173844",
        color: "#EDF2EE",
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <Interactive.Div
        name="竖版刊头"
        style={{
          position: "absolute",
          left: 70,
          top: 116,
          width: 830,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 25,
          letterSpacing: 3,
        }}
      >
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: 7 }}>
          此 刻
        </span>
        <span style={{ fontFamily: "Bahnschrift", color: "#ABC5CA" }}>
          2026.10.30
        </span>
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          top: 183,
          left: 70,
          width: 830,
          height: 1,
          background: "#ABC5CA",
          opacity: 0.25,
        }}
      />
      <Interactive.Div
        name="竖版主标题"
        style={{
          position: "absolute",
          left: 68,
          top: 241,
          width: 832,
          whiteSpace: "pre-line",
          fontFamily: DISPLAY,
          fontSize: 100,
          fontWeight: 600,
          lineHeight: 1.3,
          letterSpacing: 4,
          opacity: interpolate(frame, [0, 0.9 * fps], [0, 1], clamp),
          translate: interpolate(
            frame,
            [0, 1.8 * fps],
            ["0px 38px", "0px 0px"],
            { ...clamp, easing: ease },
          ),
        }}
      >
        此刻，世界{"\n"}在发生什么
      </Interactive.Div>
      <Interactive.Div
        name="竖版地球与讯号轨迹"
        style={{
          position: "absolute",
          left: 70,
          top: 519,
          width: 830,
          height: 730,
          opacity: interpolate(frame, [0.3 * fps, 1.7 * fps], [0, 1], clamp),
          scale: interpolate(frame, [0, 10 * fps], [0.96, 1.015], clamp),
        }}
      >
        <svg viewBox="0 0 900 790" width="100%" height="100%">
          <defs>
            <radialGradient id="portrait-opening-globe">
              <stop offset="0" stopColor="#517D85" />
              <stop offset="1" stopColor="#214B59" />
            </radialGradient>
            <clipPath id="portrait-opening-mask">
              <circle cx="450" cy="395" r="289" />
            </clipPath>
          </defs>
          <g
            style={{
              rotate: `${-17 + (frame / fps) * 0.6}deg`,
              transformOrigin: "450px 395px",
            }}
          >
            <circle
              cx="450"
              cy="395"
              r="289"
              fill="url(#portrait-opening-globe)"
            />
            <g
              stroke="#A1C3C9"
              strokeWidth="1.5"
              fill="none"
              opacity="0.48"
              clipPath="url(#portrait-opening-mask)"
            >
              {[-231, -154, -77, 0, 77, 154, 231].map((y) => (
                <ellipse
                  key={y}
                  cx="450"
                  cy={395 + y}
                  rx={Math.sqrt(289 ** 2 - y ** 2)}
                  ry="35"
                />
              ))}
              {[59, 131, 207, 278].map((rx) => (
                <ellipse key={rx} cx="450" cy="395" rx={rx} ry="289" />
              ))}
              <path
                d="M198 289L298 194 368 223 391 292 347 355 378 438 325 535 297 476 256 430 271 374 213 362ZM459 185L532 153 618 208 691 251 673 326 586 328 557 366 518 349 496 276ZM529 372L602 391 624 465 576 569 540 538 518 461ZM626 539L694 526 729 572 692 609 642 594Z"
                fill="#87ADB1"
                stroke="none"
                opacity="0.4"
              />
            </g>
          </g>
          <ellipse
            cx="450"
            cy="395"
            rx="399"
            ry="145"
            fill="none"
            stroke="#D5B575"
            strokeWidth="2"
            strokeDasharray="4 10"
            transform="rotate(-19 450 395)"
          />
          <g
            style={{
              rotate: `${(frame / fps) * 6}deg`,
              transformOrigin: "450px 395px",
            }}
          >
            <circle cx="790" cy="245" r="6" fill="#E8C482" />
            <circle
              cx="790"
              cy="245"
              r="17"
              fill="none"
              stroke="#E8C482"
              opacity="0.35"
            />
          </g>
        </svg>
      </Interactive.Div>
      <Interactive.Div
        name="竖版影片导语"
        style={{
          position: "absolute",
          left: 74,
          top: 1244,
          width: 820,
          fontSize: 44,
          lineHeight: 1.6,
          letterSpacing: 1,
          opacity: interpolate(frame, [1.2 * fps, 2.2 * fps], [0, 1], clamp),
        }}
      >
        从身边的政策，到遥远的太空。
        <br />
        <span style={{ color: "#ABC5CA" }}>十件事，三分钟，多一点背景。</span>
      </Interactive.Div>
      <Narration id="intro" />
    </AbsoluteFill>
  );
};
