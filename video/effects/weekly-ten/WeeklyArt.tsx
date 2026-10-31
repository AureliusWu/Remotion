import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { NewsArt, type NewsArtKind } from "../daily-ten/NewsArt";

type Props = { kind: string; accent: string; dark?: boolean };
type ArtProps = {
  t: number;
  reveal: number;
  ink: string;
  soft: string;
  paper: string;
  accent: string;
  id: string;
};

const Travel: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    <circle cx="570" cy="190" r="67" fill={accent} opacity="0.18" />
    <circle cx="570" cy="190" r="83" fill="none" stroke={soft} opacity="0.24" />
    <path
      d="M93 363 240 169 353 315 453 222 686 398"
      fill={`url(#${id}-wash)`}
      stroke={soft}
      strokeWidth="1.6"
    />
    <path
      d="M193 232 240 169 290 233 256 220 237 234 217 221Z"
      fill={paper}
      stroke={soft}
      strokeWidth="1"
    />
    <path
      d="M88 413 Q209 270 355 377 Q473 274 714 411 V483 H88Z"
      fill={paper}
      stroke={ink}
      strokeWidth="1.9"
    />
    <path
      d="M92 460 Q253 400 410 448 T715 451 M111 489 Q268 432 417 478 T694 482 M144 514 Q302 468 443 511 T666 511"
      fill="none"
      stroke={soft}
      strokeWidth="1.2"
      opacity="0.55"
    />
    <path
      d="M117 384 Q223 326 346 386 T635 356"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - reveal}
      fill="none"
      stroke={accent}
      strokeWidth="2.6"
    />
    <g transform={`translate(${Math.sin(t * 0.4) * 8} 0)`}>
      <path
        d="M453 338 H576 Q598 338 601 356 L608 380 H441 V353 Q441 338 453 338Z"
        fill={paper}
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M454 349 H572 Q585 349 588 365 H454Z"
        fill={accent}
        fillOpacity="0.3"
        stroke={soft}
        strokeWidth="1"
      />
      <path
        d="M480 349 V366 M511 349 V366 M542 349 V366"
        stroke={soft}
        strokeWidth="1"
      />
      <circle cx="466" cy="381" r="8" fill={ink} />
      <circle cx="582" cy="381" r="8" fill={ink} />
      <path d="M445 373 H603" stroke={accent} strokeWidth="2" />
    </g>
    <g transform={`rotate(${-12 + Math.sin(t * 0.3) * 1.4} 310 417)`}>
      <path
        d="M173 353 H450 V398 Q427 411 450 424 V481 H173 V424 Q196 411 173 398Z"
        fill={paper}
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M368 354 V480"
        stroke={soft}
        strokeWidth="1.2"
        strokeDasharray="3 7"
      />
      <path
        d="M203 380 H334 M203 390 H284 M203 446 H306 M203 457 H274"
        stroke={soft}
        strokeWidth="1.4"
      />
      <path
        d="M217 414 H334 M324 405 336 414 324 423"
        fill="none"
        stroke={accent}
        strokeWidth="2.3"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <path
          key={i}
          d={`M${389 + i * 4} 382 V452`}
          stroke={ink}
          strokeWidth={i % 3 === 0 ? 2 : 1}
          opacity="0.6"
        />
      ))}
    </g>
    <path d="M663 273 H696 M680 257 V289" stroke={soft} strokeWidth="1" />
  </g>
);

const Shopping: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    <ellipse cx="392" cy="540" rx="244" ry="27" fill={ink} opacity="0.05" />
    <g transform={`rotate(${Math.sin(t * 0.35) * 1.8} 341 446)`}>
      <path
        d="M218 278 H440 L461 515 H195Z"
        fill={`url(#${id}-wash)`}
        stroke={ink}
        strokeWidth="2.2"
      />
      <path
        d="M266 307 V246 Q266 179 329 179 Q392 179 392 246 V307"
        fill="none"
        stroke={ink}
        strokeWidth="3"
      />
      <path
        d="M206 498 H451 M218 278 242 515"
        fill="none"
        stroke={soft}
        strokeWidth="1.1"
      />
      <circle cx="266" cy="307" r="5" fill={accent} />
      <circle cx="392" cy="307" r="5" fill={accent} />
      <path d="M290 369 H368 M290 389 H350" stroke={soft} strokeWidth="1.5" />
      <path
        d="M306 428 324 447 359 412"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - reveal}
        fill="none"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <g transform={`translate(0 ${Math.sin(t * 0.5) * 5}) rotate(12 543 245)`}>
      <path
        d="M474 153 H616 V210 Q594 226 616 242 V299 H474 V242 Q496 226 474 210Z"
        fill={paper}
        stroke={ink}
        strokeWidth="1.8"
      />
      <path
        d="M496 181 H594 M496 192 H568 M496 269 H591"
        stroke={soft}
        strokeWidth="1.3"
      />
      <path d="M526 244 564 207" stroke={accent} strokeWidth="3" />
      <circle
        cx="525"
        cy="213"
        r="7"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
      <circle
        cx="566"
        cy="242"
        r="7"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
    </g>
    <g transform="translate(529 414) rotate(-16)">
      <circle r="73" fill={paper} stroke={ink} strokeWidth="2" />
      <circle r="61" fill="none" stroke={soft} strokeWidth="1.2" />
      <path
        d="M49 55 98 111"
        stroke={ink}
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M49 55 98 111"
        stroke={paper}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M-35 -18 H-8 M10 -18 H38 M-35 17 H-8 M10 17 H38 M-1 -32 V32"
        stroke={soft}
        strokeWidth="2"
      />
      <path d="M-20 -3 H-8 M10 -3 H23" stroke={accent} strokeWidth="3" />
    </g>
    <path
      d="M128 328 C96 258 117 187 181 163 M162 159 184 162 175 182"
      fill="none"
      stroke={accent}
      strokeWidth="1.7"
      opacity="0.6"
    />
    <path d="M659 345 h25 M671 333 v25" stroke={soft} strokeWidth="1.2" />
  </g>
);

const Swimming: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => {
  const stroke = Math.sin(t * 0.7) * 5;
  return (
    <g>
      <path
        d="M90 285 452 157 714 311 352 501Z"
        fill={`url(#${id}-wash)`}
        stroke={soft}
        strokeWidth="1.4"
      />
      {[0, 1, 2, 3, 4].map((n) => (
        <g key={n}>
          <path
            d={`M${122 + n * 49} ${300 + n * 29} ${484 + n * 49} ${172 + n * 29}`}
            stroke={soft}
            strokeWidth="1.3"
            strokeDasharray="3 6"
            opacity="0.65"
          />
          {Array.from({ length: 16 }, (_, j) => (
            <circle
              key={j}
              cx={131 + n * 49 + j * 22}
              cy={297 + n * 29 - j * 7.78}
              r="2.8"
              fill={j % 4 === 0 ? accent : soft}
              opacity="0.7"
            />
          ))}
        </g>
      ))}
      <path d="M90 285 352 501 M452 157 714 311" stroke={ink} strokeWidth="5" />
      <path
        d="M91 294 352 510 713 320"
        fill="none"
        stroke={soft}
        strokeWidth="1.1"
      />
      <g
        transform={`translate(${Math.sin(t * 0.35) * 12} ${Math.sin(t * 0.35) * -4})`}
      >
        <path
          d="M264 350 Q347 311 408 301"
          fill="none"
          stroke={ink}
          strokeWidth="30"
          strokeLinecap="round"
        />
        <path
          d="M264 350 Q347 311 408 301"
          fill="none"
          stroke={paper}
          strokeWidth="24"
          strokeLinecap="round"
        />
        <g transform={`rotate(${stroke} 354 321)`}>
          <path
            d="M354 321 384 276 438 275"
            fill="none"
            stroke={ink}
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M354 321 384 276 438 275"
            fill="none"
            stroke={paper}
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <path
          d="M333 333 347 374 402 354"
          fill="none"
          stroke={ink}
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M333 333 347 374 402 354"
          fill="none"
          stroke={paper}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="419"
          cy="301"
          r="22"
          fill={paper}
          stroke={ink}
          strokeWidth="1.6"
        />
        <path
          d="M400 289 Q421 271 438 294"
          fill={accent}
          stroke={ink}
          strokeWidth="1.3"
        />
        <path d="M426 301 440 297" stroke={accent} strokeWidth="3" />
        <path
          d="M267 350 225 349 202 368 M270 350 237 377 206 383"
          fill="none"
          stroke={ink}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M267 350 225 349 202 368 M270 350 237 377 206 383"
          fill="none"
          stroke={paper}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {[0, 1, 2].map((n) => (
        <path
          key={n}
          d={`M${139 - n * 9} ${357 + n * 13} q24 -15 49 -13`}
          fill="none"
          stroke={accent}
          strokeWidth="1.6"
          opacity={0.7 - n * 0.2}
        />
      ))}
      <g transform={`translate(589 ${445 + Math.sin(t * 0.4) * 4})`}>
        <path
          d="M-12 -94 V-112 H12 V-94 M55 -74 70 -90"
          fill="none"
          stroke={ink}
          strokeWidth="4"
        />
        <circle r="92" fill={paper} stroke={ink} strokeWidth="2" />
        <circle r="79" fill="none" stroke={soft} strokeWidth="1.2" />
        {Array.from({ length: 20 }, (_, n) => (
          <path
            key={n}
            d={`M0 -66 v${n % 5 === 0 ? 10 : 5}`}
            stroke={soft}
            strokeWidth="1.5"
            transform={`rotate(${n * 18})`}
          />
        ))}
        <path
          d="M0 13 V-57"
          stroke={accent}
          strokeWidth="2.5"
          transform={`rotate(${reveal * 40 + t * 4})`}
        />
        <circle r="5" fill={accent} />
        <path d="M-22 35 H22 M-13 46 H13" stroke={soft} strokeWidth="1.2" />
      </g>
    </g>
  );
};

const Reel: React.FC<{
  x: number;
  y: number;
  angle: number;
  ink: string;
  soft: string;
  paper: string;
  accent: string;
}> = ({ x, y, angle, ink, soft, paper, accent }) => (
  <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <circle r="106" fill={paper} stroke={ink} strokeWidth="2" />
    <circle r="96" fill="none" stroke={soft} strokeWidth="1" />
    {[0, 1, 2, 3, 4].map((n) => (
      <g key={n} transform={`rotate(${n * 72})`}>
        <path
          d="M-13 -36 Q-35 -67 -16 -81 Q17 -95 29 -68 L20 -38Z"
          fill={accent}
          fillOpacity="0.16"
          stroke={soft}
          strokeWidth="1.3"
        />
      </g>
    ))}
    <circle r="24" fill={paper} stroke={ink} strokeWidth="1.5" />
    <circle r="8" fill={accent} />
    <path d="M-12 0 H12 M0 -12 V12" stroke={soft} strokeWidth="1" />
  </g>
);

const Archive: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    <ellipse cx="400" cy="549" rx="247" ry="23" fill={ink} opacity="0.05" />
    <path
      d="M164 202 H638 V506 H164Z"
      fill={`url(#${id}-wash)`}
      stroke={ink}
      strokeWidth="2"
    />
    <path
      d="M178 216 H624 V490 H178Z"
      fill={paper}
      stroke={soft}
      strokeWidth="1"
    />
    <path d="M195 435 H608 M195 448 H608" stroke={soft} strokeWidth="1.1" />
    <path
      d="M225 342 264 409 H533 L575 341"
      fill="none"
      stroke={ink}
      strokeWidth="3"
    />
    <circle
      cx="264"
      cy="405"
      r="13"
      fill={paper}
      stroke={ink}
      strokeWidth="1.6"
    />
    <circle
      cx="533"
      cy="405"
      r="13"
      fill={paper}
      stroke={ink}
      strokeWidth="1.6"
    />
    <Reel
      x={272}
      y={264}
      angle={t * 4}
      ink={ink}
      soft={soft}
      paper={paper}
      accent={accent}
    />
    <Reel
      x={529}
      y={264}
      angle={t * 4 + 31}
      ink={ink}
      soft={soft}
      paper={paper}
      accent={accent}
    />
    <rect
      x="344"
      y="388"
      width="112"
      height="37"
      rx="3"
      fill={paper}
      stroke={ink}
      strokeWidth="1.5"
    />
    <path d="M357 402 H444 M357 412 H426" stroke={soft} strokeWidth="1.1" />
    {[0, 1, 2].map((n) => (
      <circle
        key={n}
        cx={221 + n * 28}
        cy="466"
        r="7"
        fill={n === 0 ? accent : paper}
        stroke={ink}
        strokeWidth="1.1"
      />
    ))}
    <rect
      x="526"
      y="455"
      width="76"
      height="23"
      fill="none"
      stroke={soft}
      strokeWidth="1"
    />
    <path
      d="M536 469 H542 L548 460 554 473 560 464 H589"
      stroke={accent}
      strokeWidth="1.4"
      fill="none"
    />
    {[0, 1, 2].map((n) => (
      <path
        key={n}
        d={`M${667 + n * 19} ${245 - n * 29} Q${705 + n * 19} 290 ${667 + n * 19} ${335 + n * 29}`}
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        opacity={reveal * (0.7 - n * 0.2)}
      />
    ))}
    <path
      d="M119 415 Q81 463 118 499 M102 410 Q50 461 102 508"
      fill="none"
      stroke={soft}
      strokeWidth="1"
      opacity="0.5"
    />
  </g>
);

const MarsDust: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    <circle
      cx="298"
      cy="267"
      r="159"
      fill={`url(#${id}-planet)`}
      stroke={ink}
      strokeWidth="1.5"
    />
    <g clipPath={`url(#${id}-planet-clip)`}>
      <path
        d="M119 236 Q211 180 298 245 T480 227 M123 311 Q199 267 275 323 T465 324 M192 380 Q249 348 335 393"
        fill="none"
        stroke={ink}
        strokeWidth="12"
        opacity="0.08"
      />
      {[
        { x: 234, y: 215, r: 23 },
        { x: 331, y: 309, r: 29 },
        { x: 355, y: 194, r: 15 },
        { x: 220, y: 330, r: 12 },
      ].map((p) => (
        <g key={p.x}>
          <ellipse
            cx={p.x}
            cy={p.y}
            rx={p.r}
            ry={p.r * 0.65}
            fill={ink}
            opacity="0.08"
          />
          <path
            d={`M${p.x - p.r} ${p.y} a${p.r} ${p.r * 0.65} 0 0 1 ${p.r * 2} 0`}
            fill="none"
            stroke={ink}
            strokeWidth="1.2"
            opacity="0.2"
          />
        </g>
      ))}
    </g>
    <path
      d="M170 452 408 388 675 452 441 527Z"
      fill={`url(#${id}-wash)`}
      stroke={soft}
      strokeWidth="1.2"
    />
    <path
      d="M171 452 V477 L441 554 675 477 V452 M441 527 V554"
      fill={paper}
      stroke={soft}
      strokeWidth="1.2"
    />
    <g transform={`translate(0 ${Math.sin(t * 0.32) * 3})`}>
      <path
        d="M375 285 530 248 647 293 491 335Z"
        fill={paper}
        stroke={ink}
        strokeWidth="1.8"
      />
      <path
        d="M375 285 V423 L491 471 647 426 V293 L491 335Z"
        fill={paper}
        stroke={ink}
        strokeWidth="1.8"
      />
      <path d="M491 335 V471" stroke={soft} strokeWidth="1.2" />
      {Array.from({ length: 9 }, (_, n) => (
        <path
          key={n}
          d={`M${389 + n * 10} ${304 + n * 4} V${419 + n * 4} M${509 + n * 14} ${342 - n * 4} V${455 - n * 4}`}
          stroke={soft}
          strokeWidth="0.8"
          opacity="0.5"
        />
      ))}
      {Array.from({ length: 8 }, (_, n) => (
        <path
          key={n}
          d={`M388 ${316 + n * 13} 477 ${351 + n * 13} M505 ${352 + n * 13} 632 ${315 + n * 13}`}
          stroke={soft}
          strokeWidth="0.8"
          opacity="0.45"
        />
      ))}
      <path
        d="M432 287 529 265 589 289 492 314Z"
        fill={accent}
        fillOpacity="0.17"
        stroke={accent}
        strokeWidth="1.2"
      />
    </g>
    {Array.from({ length: 26 }, (_, n) => {
      const x = 522 + Math.sin(t * 0.15 + n * 1.6) * (65 + (n % 4) * 13);
      const y = 226 + Math.cos(t * 0.18 + n * 1.12) * (47 + (n % 5) * 7);
      const r = 1.5 + (n % 4);
      return (
        <circle
          key={n}
          cx={x}
          cy={y}
          r={r}
          fill={n % 3 === 0 ? accent : ink}
          opacity={reveal * (0.12 + (n % 4) * 0.08)}
        />
      );
    })}
    <path
      d="M562 177 626 140 H693 M624 133 626 140 623 148"
      fill="none"
      stroke={accent}
      strokeWidth="1.3"
    />
    <path d="M137 497 H161 M149 485 V509" stroke={soft} strokeWidth="1.2" />
  </g>
);

const newArtwork: Record<string, React.FC<ArtProps>> = {
  travel: Travel,
  shopping: Shopping,
  swimming: Swimming,
  archive: Archive,
  "mars-dust": MarsDust,
};

const dailyKinds: NewsArtKind[] = [
  "football",
  "calendar",
  "trade",
  "robot",
  "loans",
  "rates",
  "vote",
  "mars",
  "voyager",
  "baseball",
];

/** Editorial diagrams are illustrative rather than measured data or mission imagery. */
export const WeeklyArt: React.FC<Props> = ({ kind, accent, dark = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const reveal = interpolate(frame, [0, 2.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const ink = dark ? "#ecf0e9" : "#18333b";
  const soft = dark ? "#72939b" : "#819396";
  const paper = dark ? "#12343e" : "#f3f1e8";
  const id = `weekly-${kind}`;
  const Art = newArtwork[kind];
  if (!Art) {
    const fallback = dailyKinds.includes(kind as NewsArtKind)
      ? (kind as NewsArtKind)
      : "calendar";
    return <NewsArt kind={fallback} accent={accent} dark={dark} />;
  }
  return (
    <svg
      viewBox="0 0 800 650"
      width="100%"
      height="100%"
      fill="none"
      role="img"
      aria-label={`${kind} editorial illustration`}
      style={{
        overflow: "visible",
        fontFamily: "'Bahnschrift', 'Microsoft YaHei', sans-serif",
      }}
    >
      <defs>
        <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={paper} stopOpacity="0.65" />
        </linearGradient>
        <radialGradient id={`${id}-planet`} cx="32%" cy="25%" r="80%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
          <stop offset="70%" stopColor={accent} stopOpacity="0.48" />
          <stop offset="100%" stopColor={ink} stopOpacity="0.5" />
        </radialGradient>
        <clipPath id={`${id}-planet-clip`}>
          <circle cx="298" cy="267" r="158" />
        </clipPath>
      </defs>
      <Art
        t={t}
        reveal={reveal}
        ink={ink}
        soft={soft}
        paper={paper}
        accent={accent}
        id={id}
      />
    </svg>
  );
};
