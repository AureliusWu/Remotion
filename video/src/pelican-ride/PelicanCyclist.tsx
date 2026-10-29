import type { CSSProperties } from "react";
import { Interactive, useCurrentFrame, useVideoConfig } from "remotion";
import { kneePosition, pedalPosition, rideMotion } from "./motion";

type Props = { bikeColor: string; scarfColor: string; style?: CSSProperties };

const Wheel: React.FC<{ x: number; angle: number }> = ({ x, angle }) => (
  <g>
    <circle
      cx={x}
      cy="745"
      r="130"
      fill="#f6e9cc"
      stroke="#354b43"
      strokeWidth="17"
    />
    <circle
      cx={x}
      cy="745"
      r="115"
      fill="#b9d1c0"
      fillOpacity="0.14"
      stroke="#fff3d8"
      strokeWidth="6"
    />
    <g transform={`rotate(${angle} ${x} 745)`} stroke="#829389" strokeWidth="3">
      {Array.from({ length: 12 }, (_, i) => {
        const radians = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={x}
            y1="745"
            x2={x + Math.cos(radians) * 111}
            y2={745 + Math.sin(radians) * 111}
          />
        );
      })}
      <path
        d={`M${x - 76} 669 Q${x - 61} 650 ${x - 43} 643`}
        fill="none"
        stroke="#e9ab63"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </g>
    <circle
      cx={x}
      cy="745"
      r="12"
      fill="#e7b973"
      stroke="#354b43"
      strokeWidth="5"
    />
  </g>
);

export const PelicanCyclist: React.FC<Props> = ({
  bikeColor,
  scarfColor,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const motion = rideMotion(frame, fps);
  const nearFoot = pedalPosition(motion.phase);
  const farFoot = pedalPosition(motion.phase + Math.PI);
  const hip = { x: 859, y: 534 + motion.bob };
  const nearKnee = kneePosition(hip, nearFoot);
  const farKnee = kneePosition({ x: 844, y: 526 + motion.bob }, farFoot);

  return (
    <Interactive.Div
      name="鹈鹕与薄荷自行车"
      premountFor={fps}
      style={{ position: "absolute", inset: 0, ...style }}
    >
      <svg
        viewBox="0 0 1920 1080"
        width="100%"
        height="100%"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient
            id="pelican-feathers"
            x1="780"
            y1="320"
            x2="980"
            y2="570"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#fffcef" />
            <stop offset="1" stopColor="#e7e5cf" />
          </linearGradient>
          <linearGradient
            id="pelican-pouch"
            x1="1180"
            y1="260"
            x2="1240"
            y2="367"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#f8c364" />
            <stop offset="1" stopColor="#e59b53" />
          </linearGradient>
        </defs>

        <ellipse
          cx="977"
          cy="884"
          rx="335"
          ry="21"
          fill="#756d4b"
          opacity="0.13"
        />

        {/* The far leg stays behind the frame; both feet remain horizontal. */}
        <path
          d={`M844 ${526 + motion.bob} L${farKnee.x} ${farKnee.y} L${farFoot.x} ${farFoot.y}`}
          stroke="#bc8349"
          strokeWidth="17"
        />
        <path
          d={`M${farFoot.x - 15} ${farFoot.y - 19} q20 -13 46 4 l-4 10 h-48 Z`}
          fill="#c49252"
          stroke="#9c7143"
          strokeWidth="3"
        />
        <path
          d={`M950 735 L${farFoot.x} ${farFoot.y}`}
          stroke="#687d70"
          strokeWidth="10"
        />
        <path
          d={`M${farFoot.x - 25} ${farFoot.y} h50`}
          stroke="#354b43"
          strokeWidth="9"
        />

        <Wheel x={740} angle={motion.wheelAngle} />
        <Wheel x={1210} angle={motion.wheelAngle} />

        {/* A classic diamond frame, with the crank and hub positions shared by the leg rig. */}
        <path
          d="M740 745 L848 555 L950 735 L740 745 M848 555 L1106 566 L950 735 M1106 566 L1210 745"
          stroke="#354b43"
          strokeWidth="23"
        />
        <path
          d="M740 745 L848 555 L950 735 L740 745 M848 555 L1106 566 L950 735 M1106 566 L1210 745"
          stroke={bikeColor}
          strokeWidth="15"
        />
        <path
          d="M848 555 L831 515 M1106 566 L1088 490 Q1084 465 1114 458 L1160 458 Q1187 459 1184 486"
          stroke="#354b43"
          strokeWidth="12"
        />
        <path d="M812 518 Q843 510 881 522" stroke="#574d3b" strokeWidth="20" />
        <path d="M1164 458 L1180 459" stroke="#bd8154" strokeWidth="15" />
        <path
          d="M639 703 A112 112 0 0 1 834 686 M1111 694 A118 118 0 0 1 1305 683"
          stroke="#e5b66b"
          strokeWidth="10"
        />
        <path
          d="M742 743 L950 716 A20 20 0 0 1 950 755 L742 754 Z"
          fill="#88b6a1"
          stroke="#354b43"
          strokeWidth="3"
        />
        <circle
          cx="950"
          cy="735"
          r="28"
          fill="#e6d8b6"
          stroke="#354b43"
          strokeWidth="5"
        />
        <circle cx="950" cy="735" r="8" fill="#354b43" />
        <path
          d={`M950 735 L${nearFoot.x} ${nearFoot.y}`}
          stroke="#354b43"
          strokeWidth="10"
        />

        <g style={{ translate: `0px ${motion.bob}px` }}>
          {/* Tail, body and the long S-shaped neck retain a pelican silhouette. */}
          <path
            d="M741 439 Q679 403 650 421 L691 451 L647 445 Q665 482 754 492"
            fill="#e8e6d2"
            stroke="#586858"
            strokeWidth="5"
          />
          <path
            d="M746 399 C780 349 904 357 953 412 C986 451 954 529 900 550 C823 580 731 533 720 481 C711 447 725 421 746 399 Z"
            fill="url(#pelican-feathers)"
            stroke="#586858"
            strokeWidth="5"
          />
          <path
            d="M878 445 C927 418 944 381 954 328 C960 294 954 266 982 229 C1005 198 1060 194 1091 219 C1126 247 1113 294 1080 315 C1053 333 1044 365 1042 400 C1040 457 1019 506 950 526"
            fill="url(#pelican-feathers)"
            stroke="#586858"
            strokeWidth="5"
          />
          <path
            d="M1003 323 C985 373 995 439 962 472"
            stroke="#d7dbc6"
            strokeWidth="17"
          />
          <path
            d="M1010 213 L1019 192 L1033 210 L1047 190 L1054 212"
            fill="#fff9e3"
            stroke="#586858"
            strokeWidth="4"
          />

          {/* A long narrow upper bill over the unmistakable hanging throat pouch. */}
          <path
            d="M1107 258 L1433 270 C1396 321 1353 366 1276 357 C1208 349 1152 311 1104 285 Z"
            fill="url(#pelican-pouch)"
            stroke="#b1793f"
            strokeWidth="4"
          />
          <path
            d="M1105 248 Q1241 240 1440 264 Q1459 267 1442 279 L1110 278 Z"
            fill="#f5bc54"
            stroke="#b1793f"
            strokeWidth="4"
          />
          <path d="M1129 268 L1409 271" stroke="#e19542" strokeWidth="3" />
          <path
            d="M1164 295 Q1235 342 1301 340"
            stroke="#ffda8b"
            strokeWidth="5"
          />
          <ellipse cx="1080" cy="240" rx="19" ry="21" fill="#f0c174" />
          <g
            style={{
              scale: `1 ${Math.max(0.09, 1 - motion.blink)}`,
              transformOrigin: "1081px 240px",
            }}
          >
            <ellipse cx="1081" cy="240" rx="8" ry="12" fill="#354b43" />
            <circle cx="1084" cy="236" r="3" fill="#fffbed" />
          </g>
          <path
            d="M1063 216 Q1078 206 1092 216"
            stroke="#6e7962"
            strokeWidth="4"
          />
          <ellipse
            cx="1082"
            cy="275"
            rx="13"
            ry="7"
            fill="#e9b39a"
            opacity="0.65"
          />

          {/* The scarf streams backwards; the wing reaches the handlebar. */}
          <path
            d={`M979 358 C935 ${339 + motion.scarf * 10} 901 ${354 - motion.scarf * 8} 847 ${334 + motion.scarf * 12} L858 ${368 + motion.scarf * 7} C907 ${386 - motion.scarf * 8} 948 367 987 379 Z`}
            fill={scarfColor}
            stroke="#ae6149"
            strokeWidth="3"
          />
          <path
            d="M973 357 Q1000 365 1039 353 L1036 376 Q1000 388 970 376 Z"
            fill={scarfColor}
            stroke="#ae6149"
            strokeWidth="3"
          />
          <path
            d="M807 413 C872 381 936 428 976 441 C1035 453 1098 439 1157 452 C1188 458 1184 477 1159 479 C1091 478 1030 502 963 488 C912 519 846 514 812 474"
            fill="#d6ddcb"
            stroke="#647462"
            strokeWidth="5"
          />
          <path
            d="M836 443 Q907 465 953 461 M834 462 Q890 485 926 481"
            stroke="#b4c3b1"
            strokeWidth="6"
          />
        </g>

        <path
          d={`M${hip.x} ${hip.y} L${nearKnee.x} ${nearKnee.y} L${nearFoot.x} ${nearFoot.y}`}
          stroke="#d6a35c"
          strokeWidth="20"
        />
        <path
          d={`M${hip.x} ${hip.y} L${nearKnee.x} ${nearKnee.y} L${nearFoot.x} ${nearFoot.y}`}
          stroke="#edbd71"
          strokeWidth="12"
        />
        <path
          d={`M${nearFoot.x - 16} ${nearFoot.y - 19} Q${nearFoot.x + 5} ${nearFoot.y - 32} ${nearFoot.x + 33} ${nearFoot.y - 18} L${nearFoot.x + 44} ${nearFoot.y - 6} L${nearFoot.x - 19} ${nearFoot.y - 5} Z`}
          fill="#e6ad5f"
          stroke="#ad7b45"
          strokeWidth="3"
        />
        <path
          d={`M${nearFoot.x + 4} ${nearFoot.y - 17} l9 9 m4 -8 l10 8`}
          stroke="#c38e4e"
          strokeWidth="2"
        />
        <path
          d={`M${nearFoot.x - 35} ${nearFoot.y} h70`}
          stroke="#354b43"
          strokeWidth="9"
        />
      </svg>
    </Interactive.Div>
  );
};
