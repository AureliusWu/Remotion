import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { NewsArt } from "../daily-ten/NewsArt";

type Props = { kind: string; accent: string; dark?: boolean };
type DrawingProps = { t: number; reveal: number; ink: string; soft: string; paper: string; accent: string; id: string };

const DocumentSheet: React.FC<{ x: number; y: number; w?: number; h?: number; ink: string; soft: string; paper: string; accent?: string }> = ({ x, y, w = 162, h = 207, ink, soft, paper, accent }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M0 0 H${w - 28} L${w} 28 V${h} H0Z`} fill={paper} stroke={ink} strokeWidth="1.8" />
    <path d={`M${w - 28} 0 V28 H${w}`} fill="none" stroke={soft} strokeWidth="1.1" />
    <path d={`M22 44 H${w - 45} M22 57 H${w - 28}`} stroke={accent || soft} strokeWidth="2" />
    {[0, 1, 2, 3, 4, 5].map((n) => <path key={n} d={`M22 ${88 + n * 15} H${w - (n % 3 === 2 ? 55 : 24)}`} stroke={soft} strokeWidth="1.1" opacity="0.6" />)}
  </g>
);

const Computer: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent, id }) => (
  <g>
    <ellipse cx="434" cy="548" rx="254" ry="21" fill={ink} opacity="0.045" />
    <path d="M250 170 H675 V455 H250Z" fill={`url(#${id}-wash)`} stroke={ink} strokeWidth="2" />
    <path d="M263 184 H662 V424 H263Z" fill={paper} stroke={soft} strokeWidth="1" />
    <path d="M250 438 H675 M442 455 V502 H491 V455 M391 518 H540 L516 502 H415Z" fill={paper} stroke={ink} strokeWidth="1.7" />
    <path d="M280 202 H644 M405 214 V409" stroke={soft} strokeWidth="1" opacity="0.6" />
    {[0, 1, 2].map((n) => <circle key={n} cx={283 + n * 12} cy="193" r="2.3" fill={soft} />)}
    <rect x="421" y="230" width="208" height="58" rx="3" fill={accent} fillOpacity="0.08" stroke={accent} strokeWidth="1.3" />
    <path d="M437 247 H606 M437 260 H580 M437 273 H594 M422 313 H629 M422 331 H601 M422 349 H615 M422 367 H572" stroke={soft} strokeWidth="1.4" />
    <rect x="282" y="228" width="105" height="104" rx="2" fill={`url(#${id}-wash)`} stroke={soft} strokeWidth="1.2" />
    <path d="M283 313 312 279 339 302 363 267 387 300" fill="none" stroke={ink} strokeWidth="1.4" /><circle cx="311" cy="253" r="9" fill="none" stroke={accent} strokeWidth="1.4" />
    <g transform={`translate(${Math.sin(t * 0.45) * 12} ${Math.cos(t * 0.4) * 5})`}>
      <path d="M543 284 549 337 564 322 578 345 588 338 574 316 595 311Z" fill={paper} stroke={ink} strokeWidth="1.7" />
      <circle cx="543" cy="284" r="22" fill="none" stroke={accent} strokeWidth="1" opacity="0.5" />
    </g>
    <g transform={`translate(0 ${Math.sin(t * 0.4) * 3}) rotate(-8 183 350)`}>
      <rect x="94" y="241" width="172" height="217" fill={paper} stroke={ink} strokeWidth="1.8" />
      <rect x="110" y="259" width="140" height="126" fill={`url(#${id}-wash)`} stroke={soft} strokeWidth="1" />
      <path d="M111 363 145 316 177 346 211 298 249 348" fill="none" stroke={ink} strokeWidth="1.5" /><circle cx="142" cy="286" r="11" fill="none" stroke={accent} strokeWidth="1.4" />
      <path d="M112 406 H241 M112 421 H211 M112 436 H226" stroke={soft} strokeWidth="1.2" />
    </g>
    <path d="M187 213 C171 141 271 104 331 148 M314 134 335 149 312 154" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="2" />
  </g>
);

const Infrastructure: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent, id }) => (
  <g>
    <path d="M94 451 390 529 714 421 418 348Z" fill={`url(#${id}-wash)`} stroke={soft} strokeWidth="1.2" />
    <path d="M94 451 V473 L390 551 714 443 V421 M390 529 V551" fill={paper} stroke={soft} strokeWidth="1.1" />
    {[0, 1, 2].map((n) => <g key={n} transform={`translate(${371 + n * 98} ${224 - n * 20})`}>
      <path d="M0 0 62 -19 113 0 52 21Z" fill={paper} stroke={ink} strokeWidth="1.5" />
      <path d="M0 0 V225 L52 247 113 225 V0 L52 21Z" fill={paper} stroke={ink} strokeWidth="1.7" />
      <path d="M52 21 V247" stroke={soft} strokeWidth="1.1" />
      {[0, 1, 2, 3, 4, 5, 6].map((j) => <g key={j}><path d={`M9 ${29 + j * 26} 42 ${42 + j * 26} M63 ${44 + j * 26} 100 ${31 + j * 26}`} stroke={soft} strokeWidth="1.1" /><circle cx="92" cy={45 + j * 26} r="2.5" fill={accent} opacity={0.5 + Math.sin(t * 0.6 + j + n) * 0.2} /></g>)}
    </g>)}
    <g transform={`translate(0 ${Math.sin(t * 0.35) * 3})`}>
      <path d="M140 334 268 300 373 339 247 379Z" fill={paper} stroke={ink} strokeWidth="1.8" />
      <path d="M140 334 V370 L247 412 373 371 V339 L247 379Z" fill={`url(#${id}-wash)`} stroke={ink} strokeWidth="1.8" />
      <path d="M181 332 266 310 330 336 246 361Z" fill={accent} fillOpacity="0.16" stroke={accent} strokeWidth="1.4" />
      {[0, 1, 2, 3, 4, 5].map((n) => <path key={n} d={`M${158 + n * 15} ${377 + n * 6} V${390 + n * 6} M${270 + n * 17} ${405 - n * 6} V${418 - n * 6}`} stroke={ink} strokeWidth="2" />)}
    </g>
    <path d="M248 425 V449 L375 483 469 451 M290 425 379 450 390 446 M248 300 V268 L349 239 M299 303 336 292 V256" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="1.7" />
    <path d="M119 281 V240 H161 M178 222 H213 M196 205 V240" stroke={soft} strokeWidth="1.1" opacity="0.65" />
    <circle cx="349" cy="239" r="5" fill={paper} stroke={accent} strokeWidth="1.4" />
    <circle cx="469" cy="451" r="5" fill={paper} stroke={accent} strokeWidth="1.4" />
  </g>
);

const Document: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent }) => (
  <g>
    <ellipse cx="404" cy="539" rx="247" ry="25" fill={ink} opacity="0.045" />
    <g transform="rotate(-12 294 339)"><DocumentSheet x={130} y={190} w={221} h={282} ink={ink} soft={soft} paper={paper} accent={accent} /></g>
    <g transform="rotate(7 440 339)"><DocumentSheet x={317} y={160} w={221} h={282} ink={ink} soft={soft} paper={paper} accent={accent} /></g>
    <g transform="rotate(18 557 358)"><DocumentSheet x={452} y={206} w={203} h={267} ink={ink} soft={soft} paper={paper} accent={accent} /></g>
    <path d="M128 105 V127 H107 M665 105 V127 H686 M128 510 V488 H107 M665 510 V488 H686" fill="none" stroke={soft} strokeWidth="1.4" />
    <g transform={`translate(0 ${Math.sin(t * 0.38) * 91})`}>
      <path d="M105 317 H689" stroke={accent} strokeWidth="2" />
      <path d="M105 307 V327 M689 307 V327" stroke={accent} strokeWidth="3" />
      <rect x="105" y="309" width="584" height="16" fill={accent} opacity="0.05" />
    </g>
    <path d="M157 508 C223 568 306 569 359 518 M338 524 362 515 360 539 M381 517 C439 563 522 559 592 510 M572 514 595 507 588 531" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="1.7" />
    <path d="M189 113 H211 M200 102 V124 M584 100 h16 M592 92 v16" stroke={soft} strokeWidth="1.1" />
  </g>
);

const Research: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent, id }) => (
  <g>
    <g transform="rotate(-8 301 338)"><DocumentSheet x={153} y={165} w={245} h={330} ink={ink} soft={soft} paper={paper} accent={accent} /></g>
    <path d="M218 395 H323 M218 409 H306 M218 423 H319" stroke={soft} strokeWidth="1.1" opacity="0.5" />
    <g transform={`translate(531 ${249 + Math.sin(t * 0.35) * 6}) rotate(${Math.sin(t * 0.27) * 3})`}>
      <path d="M0 -87 76 -44 V44 L0 87 -76 44 V-44Z M-60 -35 V35 M60 -35 V35 M-48 -60 0 -32 48 -60" fill="none" stroke={ink} strokeWidth="2.1" />
      <path d="M76 -44 123 -69 M76 44 116 68 M-76 44 -119 69 M0 -87 V-124 M0 87 V122" stroke={ink} strokeWidth="1.6" />
      {[{x:0,y:-87},{x:76,y:-44},{x:76,y:44},{x:0,y:87},{x:-76,y:44},{x:-76,y:-44}].map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={i % 2 === 0 ? 9 : 6} fill={paper} stroke={i % 2 === 0 ? accent : ink} strokeWidth="1.6" />)}
      <circle cx="123" cy="-69" r="11" fill={accent} fillOpacity="0.2" stroke={accent} strokeWidth="1.5" /><circle cx="116" cy="68" r="8" fill={paper} stroke={soft} strokeWidth="1.4" />
    </g>
    <g transform="translate(449 405)">
      <path d="M42 0 H86 M50 0 V48 L8 113 Q2 127 19 127 H109 Q126 127 120 113 L78 48 V0" fill={paper} stroke={ink} strokeWidth="1.9" />
      <path d="M32 78 H96 L116 115 Q119 122 107 122 H21 Q11 122 14 115Z" fill={`url(#${id}-wash)`} />
      <path d="M27 88 Q64 80 102 89 M92 69 H99 M95 82 H106 M102 97 H114" fill="none" stroke={accent} strokeWidth="1.3" />
      <circle cx="53" cy="105" r="3" fill={accent} opacity="0.5" /><circle cx="78" cy="96" r="2" fill={accent} opacity="0.5" />
    </g>
    <path d="M342 150 C370 105 425 99 467 124 M450 111 471 126 449 133" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="1.7" />
    <path d="M635 434 H672 M654 416 V452" stroke={soft} strokeWidth="1.1" />
  </g>
);

const Literacy: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent }) => (
  <g>
    <g transform="rotate(-5 325 340)"><DocumentSheet x={191} y={136} w={270} h={377} ink={ink} soft={soft} paper={paper} accent={accent} /></g>
    <path d="M238 276 H364 M238 291 H350 M238 306 H379" stroke={accent} strokeWidth="1.4" opacity="0.6" />
    <path d="M249 431 H397 M249 444 H378" stroke={soft} strokeWidth="1.1" />
    <g transform={`translate(${530 + Math.sin(t * 0.4) * 7} ${342 + Math.sin(t * 0.3) * 5}) rotate(-12)`}>
      <path d="M62 70 130 144" stroke={ink} strokeWidth="20" strokeLinecap="round" /><path d="M62 70 130 144" stroke={paper} strokeWidth="13" strokeLinecap="round" />
      <circle r="112" fill={paper} stroke={ink} strokeWidth="2" /><circle r="98" fill="none" stroke={soft} strokeWidth="1.1" />
      <path d="M-58 -38 H60 M-58 -20 H42 M-58 -2 H55" stroke={soft} strokeWidth="1.6" />
      <path d="M-50 40 -27 63 24 13" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M33 37 H66 M33 52 H58" stroke={soft} strokeWidth="1.2" />
    </g>
    <path d="M144 243 H105 V385 H139 M105 315 H78 M105 385 V445 H139" fill="none" stroke={accent} strokeWidth="1.3" />
    {[243, 385, 445].map((y) => <circle key={y} cx="145" cy={y} r="6" fill={paper} stroke={accent} strokeWidth="1.4" />)}
    <path d="M555 145 H620 M588 113 V177" stroke={soft} strokeWidth="1" opacity="0.4" />
  </g>
);

const Diffusion: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent, id }) => (
  <g>
    <path d="M104 480 400 550 702 453" fill="none" stroke={soft} strokeWidth="1" opacity="0.5" />
    {[0, 1, 2].map((stage) => <g key={stage} transform={`translate(${104 + stage * 216} ${198 + (stage === 1 ? -19 : 0) + Math.sin(t * 0.32 + stage) * 4})`}>
      <path d="M0 0 171 -27 171 241 0 268Z" fill={paper} stroke={ink} strokeWidth="1.6" />
      <path d="M9 269 181 241 V-20" fill="none" stroke={soft} strokeWidth="1" />
      {Array.from({length: 6}, (_, row) => Array.from({length: 4}, (_, col) => {
        const resolution = stage === 0 ? 0.15 : stage === 1 ? 0.52 : 0.94;
        const density = (Math.sin(row * 2.4 + col * 1.7 + 4) + 1) / 2;
        const fill = Math.min(1, Math.max(0, (resolution - density + reveal * 0.15) * 6));
        return <g key={`${row}-${col}`} transform={`translate(${14 + col * 37} ${20 + row * 37 - col * 5.8})`}>
          <path d="M0 0 27 -4.2 V21 L0 25.2Z" fill={`url(#${id}-wash)`} stroke={soft} strokeWidth="0.8" />
          <path d="M1 1 26 -3.2 V20 L1 24.2Z" fill={accent} opacity={fill * 0.6} />
          <path d="M6 12 12 10 17 13 22 9" stroke={ink} strokeWidth="1" opacity={fill * 0.7} />
        </g>;
      }))}
      <path d="M16 246 69 238" stroke={accent} strokeWidth="1.3" />
    </g>)}
    <path d="M287 310 H308 M301 304 309 310 301 316 M501 310 H524 M516 304 524 310 516 316" fill="none" stroke={accent} strokeWidth="1.8" />
    <path d="M220 132 Q403 65 594 123 M578 111 599 124 576 130" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="1.5" />
    <circle cx="216" cy="133" r="5" fill={paper} stroke={accent} strokeWidth="1.3" />
  </g>
);

const Training: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent, id }) => (
  <g>
    <ellipse cx="402" cy="323" rx="239" ry="207" fill="none" stroke={soft} strokeWidth="1" strokeDasharray="3 10" opacity="0.6" />
    <path d="M280 136 Q424 61 556 178 M546 155 560 182 533 174 M643 290 Q680 445 520 512 M536 493 516 514 543 516 M293 508 Q119 447 168 276 M151 294 170 271 177 298" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="2" />
    <g transform="translate(218 257)">
      <path d="M-67 -52 V68 C-67 101 67 101 67 68 V-52" fill={paper} stroke={ink} strokeWidth="1.9" />
      <ellipse cy="-52" rx="67" ry="25" fill={`url(#${id}-wash)`} stroke={ink} strokeWidth="1.7" />
      <path d="M-67 -11 C-67 22 67 22 67 -11 M-67 28 C-67 61 67 61 67 28" fill="none" stroke={soft} strokeWidth="1.2" />
      <circle cx="40" cy="69" r="3" fill={accent} />
    </g>
    <g transform="translate(527 233)">
      <path d="M-83 -59 H84 V75 H-83Z" fill={paper} stroke={ink} strokeWidth="1.9" />
      <path d="M-83 -37 H84 M-71 -48 H-48" stroke={soft} strokeWidth="1" />
      <path d="M-44 4 -57 17 -44 30 M45 4 58 17 45 30 M14 -1 -10 35" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M-61 53 H58 M-61 61 H32" stroke={soft} strokeWidth="1.1" />
      <circle cx="65" cy="-48" r="3" fill={accent} />
    </g>
    <g transform="translate(402 465)">
      <rect x="-95" y="-69" width="190" height="133" rx="3" fill={paper} stroke={ink} strokeWidth="1.8" />
      <path d="M-70 -42 H70 M-70 -30 H40" stroke={soft} strokeWidth="1.2" />
      <rect x="-65" y="-5" width="33" height="32" rx="2" fill="none" stroke={soft} strokeWidth="1" />
      <path d="M-59 8 -49 18 -29 -5 M-11 4 H62 M-11 18 H46 M-65 45 H61" fill="none" stroke={accent} strokeWidth="1.7" />
    </g>
    <circle cx={402 + Math.cos(t * 0.21 - 1.57) * 239} cy={323 + Math.sin(t * 0.21 - 1.57) * 207} r="5" fill={paper} stroke={accent} strokeWidth="1.5" />
    <circle cx="395" cy="312" r="31" fill={`url(#${id}-wash)`} stroke={soft} strokeWidth="1" />
    <path d="M382 312 H408 M395 299 V325" stroke={accent} strokeWidth="1.3" />
  </g>
);

const Security: React.FC<DrawingProps> = ({ t, reveal, ink, soft, paper, accent, id }) => (
  <g>
    <path d="M141 211 H341 V420 H141Z" fill={paper} stroke={soft} strokeWidth="1.5" />
    <path d="M141 236 H341" stroke={soft} strokeWidth="1" /><path d="M158 223 H187" stroke={accent} strokeWidth="1.4" />
    {[0, 1, 2, 3, 4, 5, 6].map((n) => <path key={n} d={`M${160 + (n % 3) * 13} ${258 + n * 19} H${n % 2 === 0 ? 285 : 317}`} stroke={soft} strokeWidth="1.2" opacity="0.6" />)}
    <path d="M616 154 V190 H667 V281 H690 M609 480 H656 V389 H693 M151 468 H191 V514 H292" fill="none" stroke={soft} strokeWidth="1.1" />
    {[{x:616,y:154},{x:690,y:281},{x:693,y:389},{x:609,y:480},{x:151,y:468}].map((p) => <g key={p.x}><circle cx={p.x} cy={p.y} r="9" fill={paper} stroke={soft} strokeWidth="1.4" /><circle cx={p.x} cy={p.y} r="2.5" fill={accent} /></g>)}
    <g transform={`translate(0 ${Math.sin(t * 0.32) * 4})`}>
      <path d="M462 133 Q528 179 605 190 V334 Q604 445 462 523 Q320 445 319 334 V190 Q396 179 462 133Z" fill={paper} stroke={ink} strokeWidth="2.2" />
      <path d="M462 157 Q518 193 585 207 V331 Q584 429 462 499 Q340 429 339 331 V207 Q405 193 462 157Z" fill={`url(#${id}-wash)`} stroke={soft} strokeWidth="1" />
      <path d="M423 299 V269 Q423 226 462 226 Q501 226 501 269 V299" fill="none" stroke={ink} strokeWidth="3" />
      <rect x="404" y="296" width="116" height="99" rx="9" fill={paper} stroke={ink} strokeWidth="1.8" />
      <circle cx="462" cy="336" r="9" fill={accent} /><path d="M462 344 V362" stroke={accent} strokeWidth="3" />
      <path d="M427 432 448 452 492 410" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - reveal} fill="none" stroke={accent} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <path d="M232 131 h28 M246 117 v28 M702 466 h18 M711 457 v18" stroke={soft} strokeWidth="1.1" />
  </g>
);

const drawings: Record<string, React.FC<DrawingProps>> = { computer: Computer, infrastructure: Infrastructure, document: Document, research: Research, literacy: Literacy, diffusion: Diffusion, training: Training, security: Security };

/** Schematic artwork only: no implied product UI, experiment result or measured benchmark. */
export const AiArt: React.FC<Props> = ({ kind, accent, dark = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const reveal = interpolate(frame, [0, 2.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.22, 1, 0.36, 1) });
  const ink = dark ? "#ecf0e9" : "#18333b";
  const soft = dark ? "#72939b" : "#819396";
  const paper = dark ? "#12343e" : "#f3f1e8";
  const id = `ai-${kind}`;
  const Drawing = drawings[kind];
  if (kind === "robotics" || !Drawing) return <NewsArt kind="robot" accent={accent} dark={dark} />;
  return <svg viewBox="0 0 800 650" width="100%" height="100%" fill="none" role="img" aria-label={`${kind} editorial illustration`} style={{ overflow: "visible", fontFamily: "'Bahnschrift', 'Microsoft YaHei', sans-serif" }}>
    <defs><linearGradient id={`${id}-wash`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={accent} stopOpacity="0.2" /><stop offset="100%" stopColor={paper} stopOpacity="0.65" /></linearGradient></defs>
    <Drawing t={t} reveal={reveal} ink={ink} soft={soft} paper={paper} accent={accent} id={id} />
  </svg>;
};
