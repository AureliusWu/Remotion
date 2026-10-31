import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export type NewsArtKind =
  | "football"
  | "calendar"
  | "trade"
  | "robot"
  | "loans"
  | "rates"
  | "vote"
  | "mars"
  | "voyager"
  | "baseball";

type Props = { kind: NewsArtKind; accent: string; dark?: boolean };
type ArtProps = {
  t: number;
  reveal: number;
  ink: string;
  soft: string;
  paper: string;
  accent: string;
  id: string;
};

const Ball: React.FC<{
  x: number;
  y: number;
  r: number;
  rotate: number;
  ink: string;
  paper: string;
}> = ({ x, y, r, rotate, ink, paper }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <circle r={r} fill={paper} stroke={ink} strokeWidth={2.4} />
    <path
      d={`M0 ${-r * 0.45} L${r * 0.43} ${-r * 0.14} L${r * 0.27} ${r * 0.38} L${-r * 0.27} ${r * 0.38} L${-r * 0.43} ${-r * 0.14} Z`}
      fill={ink}
    />
    {[0, 72, 144, 216, 288].map((angle) => (
      <g key={angle} transform={`rotate(${angle})`}>
        <path
          d={`M0 ${-r * 0.45} L0 ${-r * 0.82} M0 ${-r * 0.82} L${r * 0.22} ${-r * 0.98} M0 ${-r * 0.82} L${-r * 0.22} ${-r * 0.98}`}
          fill="none"
          stroke={ink}
          strokeWidth={1.8}
        />
      </g>
    ))}
  </g>
);

const Football: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
}) => (
  <g>
    {[0, 1, 2, 3, 4].map((n) => (
      <path
        key={n}
        d={`M${90 + n * 13} ${370 - n * 30} Q400 ${40 - n * 12} ${717 - n * 8} ${303 - n * 23}`}
        fill="none"
        stroke={soft}
        opacity={0.18 + n * 0.07}
        strokeWidth={1.2}
      />
    ))}
    <path
      d="M82 413 425 273 737 397 392 565Z"
      fill={`url(#news-${"football"}-wash)`}
      stroke={ink}
      strokeWidth={2}
    />
    <path
      d="M109 415 425 287 708 397 393 550Z M265 351 565 465 M253 485 571 343"
      fill="none"
      stroke={ink}
      strokeWidth={1.5}
      opacity={0.55}
    />
    <ellipse
      cx="408"
      cy="416"
      rx="62"
      ry="25"
      transform="rotate(-22 408 416)"
      fill="none"
      stroke={ink}
      strokeWidth={1.5}
    />
    <g transform="translate(455 210)">
      <path
        d="M0 152 0 27 149 80 149 207 M0 27 45 0 194 53 194 180 149 207 M149 80 194 53"
        fill="none"
        stroke={ink}
        strokeWidth={3}
      />
      <path
        d="M45 0 45 125 194 180 M0 152 45 125"
        fill="none"
        stroke={soft}
        strokeWidth={1.4}
      />
      {Array.from({ length: 7 }, (_, n) => (
        <path
          key={n}
          d={`M${n * 24.8} ${27 + n * 8.83} v127 M45 ${n * 20.8} l149 53 M0 ${27 + n * 20.8} l149 53`}
          fill="none"
          stroke={soft}
          strokeWidth={0.8}
          opacity={0.55}
        />
      ))}
    </g>
    <path
      d="M150 468 Q170 190 497 272"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - reveal}
      fill="none"
      stroke={accent}
      strokeWidth={3}
    />
    {[0, 1, 2].map((n) => (
      <circle
        key={n}
        cx={250 + n * 67}
        cy={247 - n * 9}
        r={3}
        fill={accent}
        opacity={0.3 + n * 0.2}
      />
    ))}
    <ellipse cx="245" cy="522" rx="75" ry="12" fill={ink} opacity={0.07} />
    <Ball
      x={244 + Math.sin(t * 0.46) * 17}
      y={452 + Math.sin(t * 0.7) * 5}
      r={66}
      rotate={t * 7}
      ink={ink}
      paper={paper}
    />
    <path
      d="M117 474 h40 M111 487 h29 M104 500 h21"
      fill="none"
      stroke={accent}
      strokeWidth={2}
      opacity={0.7}
    />
  </g>
);

const Calendar: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    <ellipse cx="416" cy="534" rx="235" ry="29" fill={ink} opacity={0.055} />
    <g transform={`translate(0 ${Math.sin(t * 0.45) * 4}) rotate(-7 398 325)`}>
      <rect
        x="198"
        y="137"
        width="393"
        height="375"
        rx="14"
        fill={paper}
        stroke={soft}
        strokeWidth={1.4}
        transform="rotate(5 395 324)"
      />
      <rect
        x="195"
        y="126"
        width="393"
        height="375"
        rx="14"
        fill={paper}
        stroke={soft}
        strokeWidth={1.4}
        transform="rotate(2 395 324)"
      />
      <rect
        x="184"
        y="114"
        width="393"
        height="375"
        rx="14"
        fill={`url(#${id}-wash)`}
        stroke={ink}
        strokeWidth={2.4}
      />
      <path d="M184 201 H577" stroke={ink} strokeWidth={2} />
      {[246, 510].map((x) => (
        <g key={x}>
          <rect
            x={x}
            y="91"
            width="19"
            height="60"
            rx="9.5"
            fill={paper}
            stroke={ink}
            strokeWidth={2}
          />
          <path d={`M${x + 7} 103 v33`} stroke={accent} strokeWidth={3} />
        </g>
      ))}
      {Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 7 }, (_, col) => (
          <rect
            key={`${row}-${col}`}
            x={220 + col * 45}
            y={231 + row * 44}
            width="24"
            height="22"
            rx="3"
            fill={row === 3 && col === 4 ? accent : "none"}
            stroke={row === 3 && col === 4 ? accent : soft}
            strokeWidth={1.2}
            opacity={0.4 + reveal * 0.6}
          />
        )),
      )}
      <path
        d="M577 423 V475 Q577 489 562 489 H511Z"
        fill={paper}
        stroke={ink}
        strokeWidth={1.5}
      />
    </g>
    <g transform={`translate(606 421) rotate(${Math.sin(t * 0.4) * 4})`}>
      <circle r="82" fill={paper} stroke={ink} strokeWidth={2} />
      <circle r="69" fill="none" stroke={soft} strokeWidth={1} />
      {Array.from({ length: 12 }, (_, n) => (
        <path
          key={n}
          d="M0 -57 v6"
          stroke={soft}
          strokeWidth={2}
          transform={`rotate(${n * 30})`}
        />
      ))}
      <path
        d="M0 0 V-39 M0 0 30 17"
        fill="none"
        stroke={ink}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path
        d="M0 10 V-53"
        stroke={accent}
        strokeWidth={1.7}
        transform={`rotate(${t * 9})`}
      />
      <circle r="4" fill={accent} />
    </g>
    <path
      d="M106 264 C78 356 105 437 158 479 M94 271 106 250 123 268"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - reveal}
      fill="none"
      stroke={accent}
      strokeWidth={2}
    />
  </g>
);

const Trade: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    <path d="M82 433 H718" stroke={soft} strokeWidth={1} />
    <path
      d="M83 291 Q364 26 697 225"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - reveal}
      fill="none"
      stroke={accent}
      strokeWidth={2.6}
    />
    <path
      d="M678 216 699 225 681 238"
      fill="none"
      stroke={accent}
      strokeWidth={2.6}
    />
    {[0, 1, 2].map((n) => (
      <path
        key={n}
        d={`M${89 + Math.sin(t * 0.4 + n) * 10} ${475 + n * 32} Q193 ${456 + n * 32} 297 ${475 + n * 32} T505 ${475 + n * 32} T712 ${475 + n * 32}`}
        fill="none"
        stroke={soft}
        strokeWidth={1.2}
        opacity={0.65 - n * 0.18}
      />
    ))}
    <g
      transform={`translate(${Math.sin(t * 0.34) * 8} ${Math.sin(t * 0.6) * 3})`}
    >
      <path
        d="M151 381 H643 L604 434 H215Z"
        fill={`url(#${id}-wash)`}
        stroke={ink}
        strokeWidth={2.3}
      />
      <path d="M178 398 H620" stroke={accent} strokeWidth={4} />
      <path
        d="M548 299 H594 V381 H548Z M558 309 H583 V325 H558Z M558 337 H583 V353 H558Z M559 280 H572 V299"
        fill={paper}
        stroke={ink}
        strokeWidth={1.6}
      />
      {[0, 1, 2].map((n) => (
        <g key={n} transform={`translate(${215 + n * 103} 313)`}>
          <rect
            width="94"
            height="68"
            fill={n === 1 ? accent : paper}
            fillOpacity={n === 1 ? 0.8 : 1}
            stroke={ink}
            strokeWidth={1.7}
          />
          {[0, 1, 2, 3, 4, 5].map((j) => (
            <path
              key={j}
              d={`M${11 + j * 14} 8 v52`}
              stroke={ink}
              strokeWidth={1}
              opacity={0.35}
            />
          ))}
        </g>
      ))}
      <rect
        x="319"
        y="243"
        width="95"
        height="68"
        fill={paper}
        stroke={ink}
        strokeWidth={1.7}
      />
      {[0, 1, 2, 3, 4, 5].map((j) => (
        <path
          key={j}
          d={`M${330 + j * 14} 251 v52`}
          stroke={soft}
          strokeWidth={1}
        />
      ))}
    </g>
    <path
      d="M115 398 V198 H229 M115 216 229 198 M127 216 V398 M156 198 V171 H169 V198 M205 199 V273 M198 273 V285 H212"
      fill="none"
      stroke={ink}
      strokeWidth={2.4}
    />
    <path
      d="M649 379 V206 H720 M649 224 720 206 M661 224 V379"
      fill="none"
      stroke={soft}
      strokeWidth={1.8}
    />
    <circle
      cx="103"
      cy="291"
      r="8"
      fill={paper}
      stroke={accent}
      strokeWidth={2}
    />
    <circle cx="684" cy="220" r="5" fill={accent} />
  </g>
);

const Robot: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => {
  const elbow = Math.sin(t * 0.55) * 7;
  return (
    <g>
      <ellipse cx="405" cy="547" rx="215" ry="27" fill={ink} opacity={0.05} />
      {[0, 1, 2, 3].map((n) => (
        <path
          key={n}
          d={`M${150 + n * 28} ${478 - n * 66} h-43 v-28 M${637 - n * 17} ${234 + n * 70} h45 v29`}
          fill="none"
          stroke={soft}
          strokeWidth={1}
          opacity={0.45}
        />
      ))}
      <g transform={`translate(0 ${Math.sin(t * 0.6) * 3})`}>
        <path
          d="M308 526 322 342 Q325 316 350 316 H451 Q480 316 484 343 L506 526Z"
          fill={`url(#${id}-wash)`}
          stroke={ink}
          strokeWidth={2.4}
        />
        <path
          d="M342 349 H450 L465 486 H330Z"
          fill={paper}
          stroke={soft}
          strokeWidth={1.2}
        />
        <path
          d="M369 320 V282 H430 V320"
          fill={paper}
          stroke={ink}
          strokeWidth={2}
        />
        <path
          d="M302 171 Q302 139 333 133 L438 120 Q477 117 487 154 L500 230 Q503 260 474 273 L355 293 Q324 295 315 265Z"
          fill={paper}
          stroke={ink}
          strokeWidth={2.6}
        />
        <path d="M325 178 460 159 475 227 338 252Z" fill={ink} />
        <path
          d="M351 210 377 206 M416 201 444 197"
          stroke={accent}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path d="M359 268 453 252" stroke={soft} strokeWidth={1.4} />
        <circle
          cx="486"
          cy="200"
          r="15"
          fill={paper}
          stroke={ink}
          strokeWidth={2}
        />
        <path d="M394 121 V90 M384 89 H404" stroke={ink} strokeWidth={2} />
        <circle cx="394" cy="86" r="6" fill={accent} />
        <rect
          x="358"
          y="373"
          width="78"
          height="48"
          rx="9"
          fill="none"
          stroke={accent}
          strokeWidth={2}
        />
        <path
          d="M370 398 H384 L392 385 403 410 412 398 H424"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - reveal}
          fill="none"
          stroke={accent}
          strokeWidth={2}
        />
        {[0, 1, 2].map((n) => (
          <path
            key={n}
            d={`M357 ${446 + n * 10} h76`}
            stroke={soft}
            strokeWidth={1.2}
          />
        ))}
        <g transform={`rotate(${elbow} 310 354)`}>
          <path
            d="M310 350 242 410 215 344"
            fill="none"
            stroke={ink}
            strokeWidth={39}
            strokeLinejoin="round"
          />
          <path
            d="M310 350 242 410 215 344"
            fill="none"
            stroke={paper}
            strokeWidth={31}
            strokeLinejoin="round"
          />
          <circle
            cx="242"
            cy="410"
            r="20"
            fill={paper}
            stroke={ink}
            strokeWidth={2}
          />
          <circle cx="242" cy="410" r="7" fill={accent} />
          <path
            d="M218 344 205 318 M205 318 192 300 M205 318 208 293 M205 318 226 303"
            fill="none"
            stroke={ink}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </g>
        <g transform={`rotate(${-elbow * 0.7} 486 350)`}>
          <path
            d="M486 350 552 413 574 483"
            fill="none"
            stroke={ink}
            strokeWidth={39}
            strokeLinejoin="round"
          />
          <path
            d="M486 350 552 413 574 483"
            fill="none"
            stroke={paper}
            strokeWidth={31}
            strokeLinejoin="round"
          />
          <circle
            cx="552"
            cy="413"
            r="20"
            fill={paper}
            stroke={ink}
            strokeWidth={2}
          />
          <circle cx="552" cy="413" r="7" fill={accent} />
          <path
            d="M574 483 561 505 M574 483 580 509 M574 483 595 501"
            fill="none"
            stroke={ink}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  );
};

const Loans: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    <path
      d="M95 491 429 560 708 426 377 367Z"
      fill={`url(#${id}-wash)`}
      stroke={soft}
      strokeWidth={1.4}
    />
    <path
      d="M130 469 428 530 669 419 M428 530 V560"
      fill="none"
      stroke={soft}
      strokeWidth={1}
    />
    <g transform={`translate(0 ${Math.sin(t * 0.4) * 3})`}>
      <path
        d="M198 444 V327 L302 300 375 321 V467 L273 497Z"
        fill={paper}
        stroke={ink}
        strokeWidth={2}
      />
      <path
        d="M198 327 273 351 375 321 M273 351 V497"
        fill="none"
        stroke={ink}
        strokeWidth={1.8}
      />
      <path
        d="M215 365 251 376 M215 390 251 401 M215 415 251 426"
        stroke={soft}
        strokeWidth={3}
      />
      <path
        d="M291 366 354 347 M291 391 354 372 M291 416 354 397 M291 441 354 422"
        stroke={accent}
        strokeWidth={2}
      />
      <path
        d="M384 429 V232 L476 208 557 231 V454 L465 479Z"
        fill={paper}
        stroke={ink}
        strokeWidth={2}
      />
      <path
        d="M384 232 465 257 557 231 M465 257 V479"
        fill="none"
        stroke={ink}
        strokeWidth={1.8}
      />
      {Array.from({ length: 6 }, (_, n) => (
        <path
          key={n}
          d={`M401 ${269 + n * 24} 446 ${282 + n * 24} M481 ${284 + n * 24} 539 ${267 + n * 24}`}
          stroke={soft}
          strokeWidth={2}
        />
      ))}
      <path
        d="M419 222 V193 L474 179 523 193 V220"
        fill={paper}
        stroke={ink}
        strokeWidth={1.5}
      />
    </g>
    <path
      d="M160 240 C239 132 358 134 415 166 M402 153 419 168 398 171"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - reveal}
      fill="none"
      stroke={accent}
      strokeWidth={2.4}
    />
    <g transform={`translate(617 ${317 + Math.sin(t * 0.6) * 7})`}>
      <ellipse
        rx="56"
        ry="19"
        cy="82"
        fill={paper}
        stroke={ink}
        strokeWidth={1.5}
      />
      {[4, 3, 2, 1, 0].map((n) => (
        <g key={n} transform={`translate(0 ${n * 13})`}>
          <path
            d="M-56 0 V16 C-56 42 56 42 56 16 V0"
            fill={paper}
            stroke={ink}
            strokeWidth={1.5}
          />
          <ellipse
            rx="56"
            ry="19"
            fill={n === 0 ? accent : paper}
            stroke={ink}
            strokeWidth={1.5}
          />
        </g>
      ))}
      <ellipse rx="33" ry="10" fill="none" stroke={paper} strokeWidth={1.5} />
    </g>
    <circle
      cx="164"
      cy="238"
      r="8"
      fill={paper}
      stroke={accent}
      strokeWidth={2}
    />
  </g>
);

const Rates: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    {[0, 1, 2].map((n) => (
      <ellipse
        key={n}
        cx="403"
        cy="521"
        rx={242 - n * 55}
        ry={43 - n * 9}
        fill="none"
        stroke={soft}
        strokeWidth={1}
        opacity={0.28 + n * 0.1}
      />
    ))}
    <path
      d="M355 505 H453 L432 478 H377Z"
      fill={`url(#${id}-wash)`}
      stroke={ink}
      strokeWidth={2}
    />
    <path
      d="M396 478 V206 H414 V478"
      fill={paper}
      stroke={ink}
      strokeWidth={2}
    />
    <circle
      cx="405"
      cy="195"
      r="17"
      fill={paper}
      stroke={ink}
      strokeWidth={2}
    />
    <g transform={`rotate(${Math.sin(t * 0.45) * 1.5} 405 237)`}>
      <path
        d="M193 237 H616"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - reveal}
        stroke={accent}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <path
        d="M221 238 169 397 M221 238 273 397 M589 238 537 397 M589 238 641 397"
        fill="none"
        stroke={ink}
        strokeWidth={1.6}
      />
      <path
        d="M155 397 H287 Q278 439 221 439 Q164 439 155 397Z M523 397 H655 Q646 439 589 439 Q532 439 523 397Z"
        fill={paper}
        stroke={ink}
        strokeWidth={2}
      />
      <circle
        cx="221"
        cy="348"
        r="45"
        fill={`url(#${id}-wash)`}
        stroke={ink}
        strokeWidth={1.8}
      />
      <path d="M207 365 237 332" stroke={accent} strokeWidth={3} />
      <circle
        cx="207"
        cy="336"
        r="6"
        fill="none"
        stroke={accent}
        strokeWidth={2}
      />
      <circle
        cx="236"
        cy="363"
        r="6"
        fill="none"
        stroke={accent}
        strokeWidth={2}
      />
      <rect
        x="551"
        y="330"
        width="76"
        height="66"
        rx="5"
        fill={paper}
        stroke={ink}
        strokeWidth={1.8}
      />
      <path
        d="M564 350 H614 M564 363 H614 M564 376 H599"
        stroke={soft}
        strokeWidth={2}
      />
    </g>
    <path
      d="M315 139 H492 M329 119 H478 M343 99 H464"
      stroke={soft}
      strokeWidth={1}
      opacity={0.4}
    />
    <circle cx="405" cy="237" r="8" fill={accent} />
  </g>
);

const Vote: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => {
  const lift = Math.sin(t * 0.45) * 7;
  return (
    <g>
      <ellipse cx="408" cy="545" rx="221" ry="28" fill={ink} opacity={0.05} />
      <path
        d="M203 321 408 255 610 321 410 391Z"
        fill={`url(#${id}-wash)`}
        stroke={ink}
        strokeWidth={2.2}
      />
      <path
        d="M203 321 V485 L410 551 610 485 V321 L410 391Z"
        fill={paper}
        stroke={ink}
        strokeWidth={2.2}
      />
      <path d="M410 391 V551" stroke={soft} strokeWidth={1.4} />
      <path d="M331 328 427 297 471 311 375 343Z" fill={ink} />
      <g transform={`translate(0 ${lift}) rotate(-13 403 231)`}>
        <path
          d="M322 115 H481 V296 L405 322 322 289Z"
          fill={paper}
          stroke={ink}
          strokeWidth={2}
        />
        <path d="M343 147 H454 M343 160 H434" stroke={soft} strokeWidth={1.4} />
        <rect
          x="350"
          y="195"
          width="52"
          height="51"
          rx="2"
          fill="none"
          stroke={soft}
          strokeWidth={1.7}
        />
        <path
          d="M359 218 374 233 412 192"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - reveal}
          fill="none"
          stroke={accent}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M418 213 H454 M418 231 H447 M343 271 H453"
          stroke={soft}
          strokeWidth={1.4}
        />
      </g>
      <path
        d="M268 403 352 431 V483 L268 455Z"
        fill="none"
        stroke={accent}
        strokeWidth={1.5}
      />
      <path
        d="M285 434 303 453 338 431"
        fill="none"
        stroke={accent}
        strokeWidth={3}
      />
      <path
        d="M133 317 C110 224 152 161 219 150 M202 139 224 149 209 167"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - reveal}
        fill="none"
        stroke={accent}
        strokeWidth={2}
      />
      <path
        d="M650 410 C691 355 689 283 651 243"
        fill="none"
        stroke={soft}
        strokeWidth={1}
        strokeDasharray="4 10"
      />
    </g>
  );
};

const Mars: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => {
  const orbit = t * 0.1 - 1.15;
  const x = 402 + Math.cos(orbit) * 301;
  const y = 327 + Math.sin(orbit) * 174;
  return (
    <g>
      <ellipse
        cx="402"
        cy="327"
        rx="308"
        ry="183"
        transform="rotate(-21 402 327)"
        fill="none"
        stroke={soft}
        strokeWidth={1}
        strokeDasharray="3 8"
      />
      <circle
        cx="402"
        cy="327"
        r="182"
        fill={`url(#${id}-planet)`}
        stroke={ink}
        strokeWidth={1.8}
      />
      <g clipPath={`url(#${id}-planet-clip)`}>
        <path
          d="M223 280 C299 247 354 267 415 229 S523 205 576 242 M220 385 C307 335 361 418 452 361 S549 344 590 375 M243 434 C336 394 362 489 486 444"
          fill="none"
          stroke={ink}
          strokeWidth={14}
          opacity={0.07}
        />
        {[
          { x: 320, y: 272, r: 24 },
          { x: 441, y: 399, r: 32 },
          { x: 468, y: 270, r: 15 },
          { x: 330, y: 398, r: 14 },
          { x: 387, y: 202, r: 12 },
          { x: 532, y: 336, r: 18 },
        ].map((c) => (
          <g key={c.x}>
            <ellipse
              cx={c.x}
              cy={c.y}
              rx={c.r}
              ry={c.r * 0.64}
              fill={ink}
              opacity={0.08}
            />
            <path
              d={`M${c.x - c.r} ${c.y} a${c.r} ${c.r * 0.64} 0 0 1 ${c.r * 2} 0`}
              fill="none"
              stroke={ink}
              strokeWidth={1.5}
              opacity={0.17}
            />
          </g>
        ))}
        <path
          d="M380 149 C475 232 484 423 399 508"
          fill="none"
          stroke={paper}
          strokeWidth={1.2}
          opacity={0.3}
        />
      </g>
      <path
        d="M124 432 C213 581 602 529 698 278"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={1 - reveal}
        fill="none"
        stroke={accent}
        strokeWidth={2}
      />
      <g
        transform={`translate(${x} ${y}) rotate(${(orbit * 180) / Math.PI + 30})`}
      >
        <rect
          x="-18"
          y="-16"
          width="36"
          height="32"
          fill={paper}
          stroke={ink}
          strokeWidth={1.8}
        />
        <path
          d="M-22 -4 H-68 V20 H-22Z M22 -4 H68 V20 H22Z"
          fill={accent}
          fillOpacity={0.65}
          stroke={ink}
          strokeWidth={1.3}
        />
        {[-55, -41, 41, 55].map((n) => (
          <path key={n} d={`M${n} -4 V20`} stroke={paper} strokeWidth={0.9} />
        ))}
        <path
          d="M0 -16 V-31 M-12 -33 Q0 -17 12 -33Z"
          fill={paper}
          stroke={ink}
          strokeWidth={1.4}
        />
      </g>
      <path
        d="M151 182 h26 M164 169 v26 M650 475 h18 M659 466 v18"
        stroke={soft}
        strokeWidth={1.2}
      />
      <circle cx="589" cy="120" r="3" fill={accent} />
    </g>
  );
};

const Voyager: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    {[0, 1, 2, 3].map((n) => (
      <path
        key={n}
        d={`M${111 + n * 12} ${464 + n * 22} Q${411 + n * 60} ${497 + n * 25} ${672 + n * 10} ${188 - n * 12}`}
        fill="none"
        stroke={soft}
        strokeWidth={1}
        opacity={0.45 - n * 0.07}
      />
    ))}
    <path
      d="M127 458 Q429 482 677 174"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - reveal}
      fill="none"
      stroke={accent}
      strokeWidth={2}
    />
    <g
      transform={`translate(403 ${318 + Math.sin(t * 0.35) * 5}) rotate(${-24 + Math.sin(t * 0.26) * 2})`}
    >
      <path
        d="M-129 -62 Q-49 77 119 -62 Q-1 16 -129 -62Z"
        fill={`url(#${id}-wash)`}
        stroke={ink}
        strokeWidth={2.4}
      />
      <ellipse
        cy="-62"
        cx="-5"
        rx="124"
        ry="35"
        fill={paper}
        stroke={ink}
        strokeWidth={2}
      />
      <ellipse
        cy="-62"
        cx="-5"
        rx="96"
        ry="26"
        fill="none"
        stroke={soft}
        strokeWidth={1}
      />
      <ellipse
        cy="-62"
        cx="-5"
        rx="62"
        ry="17"
        fill="none"
        stroke={soft}
        strokeWidth={1}
      />
      <path
        d="M-128 -62 H119 M-88 -87 81 -37 M-88 -37 81 -87 M-5 -97 V-27"
        stroke={soft}
        strokeWidth={0.8}
      />
      <path
        d="M-89 -43 -5 -153 83 -43 M-5 -153 V-177"
        fill="none"
        stroke={ink}
        strokeWidth={1.6}
      />
      <circle cx="-5" cy="-153" r="7" fill={accent} />
      <path d="M-34 13 V81 H38 V13" fill={paper} stroke={ink} strokeWidth={2} />
      <path
        d="M-34 42 H38 M-18 81 V107 H22 V81"
        fill="none"
        stroke={soft}
        strokeWidth={1.2}
      />
      <path
        d="M-12 105 -57 154 M12 105 61 154 M0 105 V173"
        stroke={ink}
        strokeWidth={2}
      />
      <path
        d="M36 56 H182 M182 45 V68 M168 40 V73 M155 43 V70"
        stroke={ink}
        strokeWidth={2}
      />
      <path
        d="M-33 55 -157 112 M-139 84 -161 132 M-123 76 -145 124 M-108 70 -130 118"
        stroke={ink}
        strokeWidth={2}
      />
      <path
        d="M-2 -181 Q-29 -202 -2 -224 M13 -187 Q-9 -202 13 -218"
        fill="none"
        stroke={accent}
        strokeWidth={1.3}
        opacity={0.6}
      />
    </g>
    <circle
      cx="151"
      cy="466"
      r="21"
      fill={paper}
      stroke={ink}
      strokeWidth={1.3}
    />
    <path
      d="M137 463 145 450 156 455 161 468 152 481 143 476Z"
      fill={accent}
      opacity={0.45}
    />
    {[
      { x: 181, y: 170 },
      { x: 611, y: 101 },
      { x: 682, y: 449 },
      { x: 568, y: 526 },
      { x: 121, y: 315 },
    ].map((p) => (
      <g key={p.x}>
        <path
          d={`M${p.x - 5} ${p.y} h10 M${p.x} ${p.y - 5} v10`}
          stroke={soft}
          strokeWidth={1.1}
        />
      </g>
    ))}
    <circle cx="670" cy="184" r="5" fill={accent} />
  </g>
);

const Baseball: React.FC<ArtProps> = ({
  t,
  reveal,
  ink,
  soft,
  paper,
  accent,
  id,
}) => (
  <g>
    {[0, 1, 2, 3, 4].map((n) => (
      <path
        key={n}
        d={`M${94 + n * 20} ${383 - n * 13} Q399 ${65 + n * 7} ${708 - n * 20} ${383 - n * 13}`}
        fill="none"
        stroke={soft}
        strokeWidth={1.2}
        opacity={0.28 + n * 0.07}
      />
    ))}
    <path
      d="M136 385 400 535 664 385 Q402 136 136 385Z"
      fill={`url(#${id}-wash)`}
      stroke={ink}
      strokeWidth={1.7}
    />
    <path
      d="M400 487 274 374 400 274 526 374Z"
      fill={paper}
      stroke={ink}
      strokeWidth={1.7}
    />
    <path
      d="M400 487 171 359 M400 487 628 359"
      fill="none"
      stroke={soft}
      strokeWidth={1.2}
    />
    <ellipse
      cx="400"
      cy="377"
      rx="32"
      ry="22"
      fill={accent}
      fillOpacity={0.18}
      stroke={soft}
      strokeWidth={1}
    />
    {[
      [274, 374],
      [400, 274],
      [526, 374],
    ].map(([x, y]) => (
      <rect
        key={x + y}
        x={x - 6}
        y={y - 6}
        width="12"
        height="12"
        fill={paper}
        stroke={ink}
        strokeWidth={1.2}
        transform={`rotate(45 ${x} ${y})`}
      />
    ))}
    <path
      d="M391 482 H409 V494 L400 501 391 494Z"
      fill={paper}
      stroke={ink}
      strokeWidth={1.3}
    />
    <path
      d="M399 478 Q490 116 673 236"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - reveal}
      fill="none"
      stroke={accent}
      strokeWidth={2.8}
    />
    <g
      transform={`translate(${591 + Math.sin(t * 0.42) * 9} ${241 + Math.sin(t * 0.5) * 6}) rotate(${t * 7})`}
    >
      <circle r="65" fill={paper} stroke={ink} strokeWidth={2.3} />
      <path
        d="M-40 -51 Q7 -4 -40 51 M40 -51 Q-7 -4 40 51"
        fill="none"
        stroke={accent}
        strokeWidth={2}
      />
      {[-40, -27, -14, 0, 14, 27, 40].map((y) => {
        const x = 17 + (y * y) / 100;
        return (
          <path
            key={y}
            d={`M${-x - 5} ${y - 3} l10 6 M${x - 5} ${y + 3} l10 -6`}
            fill="none"
            stroke={accent}
            strokeWidth={1.6}
          />
        );
      })}
    </g>
    <g transform={`rotate(${-42 + Math.sin(t * 0.38) * 2} 222 450)`}>
      <path
        d="M209 536 V419 Q191 338 197 287 Q198 268 220 268 Q242 268 243 287 Q249 338 231 419 V536Z"
        fill={paper}
        stroke={ink}
        strokeWidth={2}
      />
      <path
        d="M210 457 H230 M210 468 H230 M210 479 H230 M210 490 H230 M210 501 H230 M210 512 H230"
        stroke={accent}
        strokeWidth={1.5}
      />
      <ellipse
        cx="220"
        cy="537"
        rx="17"
        ry="5"
        fill={paper}
        stroke={ink}
        strokeWidth={1.5}
      />
      <path
        d="M208 292 Q206 352 218 399"
        fill="none"
        stroke={soft}
        strokeWidth={1.3}
      />
    </g>
  </g>
);

const artwork: Record<NewsArtKind, React.FC<ArtProps>> = {
  football: Football,
  calendar: Calendar,
  trade: Trade,
  robot: Robot,
  loans: Loans,
  rates: Rates,
  vote: Vote,
  mars: Mars,
  voyager: Voyager,
  baseball: Baseball,
};

/** Original, asset-free editorial illustrations. Motion is deterministic at every frame. */
export const NewsArt: React.FC<Props> = ({ kind, accent, dark = false }) => {
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
  const id = `news-${kind}`;
  const Art = artwork[kind];
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
          <circle cx="402" cy="327" r="181" />
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
