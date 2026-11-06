import { Audio } from "@remotion/media";
import { memo, type ReactNode } from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Sequence,
  Still,
  getStaticFiles,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  type CalculateMetadataFunction,
} from "remotion";
import script from "./script.json";

type Cue = { text: string; startFrame: number; endFrame: number };
type Chapter = {
  id: string;
  startFrame: number;
  endFrame: number;
  lines: Cue[];
};
type Timeline = { fps: number; durationInFrames: number; scenes: Chapter[] };
type FilmProps = { timeline: Timeline };
type SceneCopy = (typeof script.scenes)[number];

const FPS = 60;
const SERIF = '"Noto Serif CJK SC", "Songti SC", SimSun, serif';
const SANS = '"Noto Sans CJK SC", "Microsoft YaHei", sans-serif';
const LATIN = 'Georgia, "Times New Roman", serif';
const IVORY = "#f3e6c8";
const INK = "#162b30";
const RUST = "#a74f34";
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];
const CURVE = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.bezier(0.22, 1, 0.36, 1),
} as const;

const inkDots = Array.from({ length: 360 }, (_, i) => ({
  x: ((i * 491 + i * i * 17) % 1919) + 0.5,
  y: ((i * 307 + i * i * 53) % 1079) + 0.5,
  radius: i % 7 === 0 ? 1.4 : 0.55,
}));

const Paper = memo(({ dark }: { dark: boolean }) => (
  <AbsoluteFill
    style={{
      background: dark
        ? "radial-gradient(ellipse at 70% 43%, #314449, #18272d 73%)"
        : "radial-gradient(ellipse at 73% 35%, #f8ecd4, #e6d2ad 81%)",
      pointerEvents: "none",
    }}
  >
    <svg width="1920" height="1080" style={{ opacity: dark ? 0.16 : 0.25 }}>
      <g fill={dark ? "#dcbf83" : "#785734"}>
        {inkDots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={dot.radius} />
        ))}
      </g>
    </svg>
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 23,
        width: 22,
        background: "linear-gradient(90deg,#171e201d,transparent)",
      }}
    />
  </AbsoluteFill>
));

const Rules = ({
  n,
  start,
  gap,
  x1,
  x2,
  color,
}: {
  n: number;
  start: number;
  gap: number;
  x1: number;
  x2: number;
  color: string;
}) => (
  <g fill="none" stroke={color} strokeWidth="1">
    {Array.from({ length: n }, (_, i) => {
      const y = start + i * gap;
      return (
        <path
          key={i}
          d={`M${x1} ${y} Q${(x1 + x2) / 2} ${y - 12 + i * 0.6} ${x2} ${y + 2}`}
        />
      );
    })}
  </g>
);

const Apple = ({ progress }: { progress: number }) => {
  const glint = Math.sin(progress * Math.PI);
  return (
    <>
      <rect width="1000" height="700" fill="#273739" />
      <path d="M0 0H455L575 436 0 577Z" fill="#b98151" opacity=".56" />
      <path d="M0 620 1000 460V700H0Z" fill="#19282c" />
      <path d="M0 620 1000 460" stroke="#c5985b" strokeWidth="2" />
      <g transform="rotate(-12 465 357)">
        <path d="M245 133H707L722 573 255 568Z" fill="#dec399" />
        <path d="M258 145H694L710 559 269 555Z" fill="none" stroke="#866343" />
        <Rules
          n={16}
          start={171}
          gap={22}
          x1={283}
          x2={680}
          color="#8d6e4b66"
        />
      </g>
      <g
        transform={`translate(${-glint * 5} ${-glint * 13}) rotate(-14 521 354)`}
      >
        <ellipse
          cx="536"
          cy="476"
          rx="149"
          ry="36"
          fill="#59472f"
          opacity=".36"
        />
        <path
          d="M522 298C463 248 376 301 387 375C396 450 443 481 478 477C498 474 514 461 534 468C583 490 628 453 647 387C669 313 607 269 561 290C546 298 537 304 522 298Z"
          fill="#a94532"
          stroke="#713024"
          strokeWidth="4"
        />
        <path
          d="M522 298C516 277 520 257 527 237L545 235C531 259 529 279 534 299"
          fill="#503825"
        />
        <path
          d="M535 254C564 213 603 224 620 236C595 265 565 275 535 254Z"
          fill="#546447"
          stroke="#2d4233"
          strokeWidth="2"
        />
        <path
          d="M409 364C418 330 438 318 461 316"
          fill="none"
          stroke="#dc9262"
          strokeWidth="9"
          strokeLinecap="round"
          opacity=".64"
        />
        <path
          d="M439 443Q471 474 515 450T587 451Q618 426 632 381"
          fill="none"
          stroke="#692f29"
          strokeWidth="3"
        />
        <path
          d="M399 374Q439 430 454 453M407 339Q423 384 465 431M417 323Q434 353 455 371M613 322Q626 361 601 403"
          fill="none"
          stroke="#743828"
          strokeWidth="2"
          opacity=".54"
        />
      </g>
      <g fill="#b68c55" stroke="#604a37" strokeWidth="3">
        <ellipse cx="759" cy="517" rx="40" ry="20" />
        <ellipse cx="755" cy="510" rx="39" ry="19" />
        <ellipse cx="808" cy="479" rx="32" ry="17" />
        <ellipse cx="806" cy="472" rx="31" ry="16" />
      </g>
      <path d="M739 510h28m28-37h22" stroke="#e5c181" strokeWidth="2" />
      <path
        d="M133 63C140 163 216 243 273 331"
        stroke="#e1bf82"
        strokeWidth="2"
        fill="none"
        opacity=".45"
      />
      <path
        d="M133 63C143 161 218 239 276 330"
        stroke="#281d15"
        strokeWidth="2"
        fill="none"
        opacity=".56"
      />
    </>
  );
};

const Threshold = ({
  progress,
  closing,
}: {
  progress: number;
  closing: boolean;
}) => {
  const glow = 0.78 + Math.sin(progress * Math.PI) * 0.2;
  return (
    <>
      <rect width="1000" height="700" fill={closing ? "#294043" : "#223238"} />
      <path d="M0 0 435 96V566L0 700Z" fill={closing ? "#364e4b" : "#a47b53"} />
      <path d="M1000 0 633 96V566L1000 700Z" fill="#14252c" />
      <path d="M0 700 435 566H633L1000 700Z" fill="#4f5146" />
      <path
        d="M438 559 638 559 810 700 296 700Z"
        fill="#d6a66a"
        opacity={glow * 0.67}
      />
      <path
        d="M435 96H633V566H435Z"
        fill="#b98650"
        stroke="#253132"
        strokeWidth="9"
      />
      <path d="M466 129H606V555H466Z" fill={closing ? "#edca85" : "#f0d299"} />
      <path
        d="M478 141H592V547H478Z"
        fill="none"
        stroke="#f4dca4"
        strokeWidth="5"
      />
      <path
        d="M532 139V543M469 249H601M469 410H601"
        stroke="#8f6b48"
        strokeWidth="3"
      />
      <path
        d="M18 29 412 128M18 43 414 142M18 530l391-21M696 129 991 70M683 538l307 22M661 594l234 106M402 596 173 700M461 566 427 700M602 567 630 700"
        fill="none"
        stroke="#c9a979"
        strokeWidth="1.7"
        opacity=".43"
      />
      <path
        d="M0 0 432 90H633L1000 0"
        stroke="#171e20"
        strokeWidth="28"
        fill="none"
      />
      {closing ? (
        <g transform={`translate(${progress * 22} ${-progress * 9})`}>
          <path
            d="M516 289C536 282 546 279 558 267C555 278 560 283 571 285C565 289 551 293 548 299L539 311L539 299Z"
            fill="#78522d"
            opacity=".89"
          />
          <path
            d="M461 593H634"
            fill="none"
            stroke="#f5d28f"
            strokeWidth="2"
            opacity=".74"
          />
        </g>
      ) : (
        <g fill="#1e2c2f" transform={`translate(${progress * 16} 0)`}>
          <path d="M647 358C625 360 610 378 610 399C610 417 621 432 633 439C615 451 603 472 596 501L587 554H695L680 490C674 465 660 450 649 442C666 434 674 422 674 401C674 380 664 361 647 358Z" />
          <path d="M607 546 566 640 749 670 686 547Z" opacity=".55" />
        </g>
      )}
    </>
  );
};

const Mark = ({ progress }: { progress: number }) => (
  <>
    <rect width="1000" height="700" fill="#bc9a72" />
    <path d="M0 0H1000V169L712 278 854 700H0Z" fill="#253a3b" />
    <path
      d="M-50 615C172 577 298 440 453 423C585 409 734 481 968 321"
      fill="none"
      stroke="#e8cba0"
      strokeWidth="2"
      opacity=".78"
    />
    <path
      d="M-55 639C199 601 325 477 460 457C619 433 757 511 997 347"
      fill="none"
      stroke="#d5b185"
      strokeWidth="1.2"
      opacity=".52"
    />
    <g transform={`translate(${progress * 12} 0)`}>
      <path
        d="M400 584C355 552 336 503 355 455C373 413 413 401 438 370C449 354 447 342 455 321L469 283C485 237 538 215 579 231C621 247 646 291 651 337L670 359L656 373L654 406L623 435C615 466 640 489 679 512L701 584Z"
        fill="#d7ad7d"
        stroke="#e7c393"
        strokeWidth="2"
      />
      <path
        d="M404 583C429 515 475 481 517 452C550 429 560 393 568 347C573 318 593 282 618 263C577 212 520 223 484 251C455 274 450 310 441 356C428 397 379 412 359 451C336 499 355 551 404 583Z"
        fill="#93674e"
      />
      <path
        d="M526 280c-44 23-38 96-64 122s-69 34-82 83m177-208c-44 38-28 91-68 131s-70 44-92 93m154-148c-11 35-21 64-44 82s-64 33-82 64"
        fill="none"
        stroke="#edd4a4"
        strokeWidth="2"
        opacity=".61"
      />
      <path
        d="M629 325 637 309 649 322"
        fill="none"
        stroke="#933c30"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M631 349Q639 343 647 346"
        fill="none"
        stroke="#352c28"
        strokeWidth="2"
      />
    </g>
    <circle
      cx="646"
      cy="318"
      r={70 + 16 * progress}
      fill="none"
      stroke="#f5d5a1"
      opacity=".48"
      strokeDasharray="2 7"
    />
    <path d="M640 218V113H812" fill="none" stroke="#e4c69f" strokeWidth="1.4" />
    <circle cx="812" cy="113" r="4" fill="#a34b35" />
  </>
);

const BirdSilhouette = ({ color }: { color: string }) => (
  <g fill={color}>
    <path d="M408 342C449 286 500 273 544 258C590 241 654 193 740 125C704 190 685 225 651 252L708 235C687 262 659 275 624 286L670 287C646 310 608 324 571 322L616 334C589 352 545 352 515 348C498 352 486 362 467 384L454 403L440 392L418 424L407 410L418 386C392 374 361 372 337 369L367 359C382 344 393 342 408 342Z" />
    <path d="M481 349C436 333 381 277 343 230C304 182 242 143 189 128C237 172 268 220 284 257L243 232C256 272 287 296 319 314L275 302C298 337 336 353 373 360L343 364C375 385 412 382 441 376Z" />
    <path d="M365 358C354 348 349 347 335 348L311 352 338 364 360 365Z" />
    <circle cx="352" cy="355" r="2.6" fill="#f7d798" />
  </g>
);

const Bird = ({ progress }: { progress: number }) => {
  const spread = interpolate(progress, [0, 0.75], [0, 1], CURVE);
  return (
    <>
      <rect width="1000" height="700" fill="#243c40" />
      <circle
        cx="506"
        cy="337"
        r="268"
        fill="#1d3036"
        stroke="#9e815b"
        strokeWidth="1.2"
      />
      <circle
        cx="506"
        cy="337"
        r="247"
        fill="none"
        stroke="#9e815b"
        strokeDasharray="2 5"
      />
      <path
        d="M506 76V597M238 337H775M317 145 696 527M315 526 695 145"
        stroke="#7d806b"
        strokeWidth="1"
        opacity=".43"
      />
      <path
        d="M251 325Q505 206 757 324M251 359Q505 492 757 359M505 88C677 224 677 458 505 586M505 88C333 224 333 458 505 586"
        fill="none"
        stroke="#7d806b"
        opacity=".43"
      />
      <g
        transform={`translate(${-spread * 12} ${spread * 8}) rotate(${-spread * 3} 505 446)`}
      >
        <path
          d="M316 399 362 417 383 390 415 426 454 419 490 452 514 449 551 482 581 471 644 507C608 585 549 620 488 618C408 612 342 545 316 399Z"
          fill="#d5a871"
          stroke="#e9c99c"
          strokeWidth="3"
        />
        <path
          d="M335 420Q405 552 493 578Q557 591 619 522M350 452Q403 554 476 584M377 503Q412 569 479 599M509 593Q566 580 600 550"
          fill="none"
          stroke="#8e613e"
          strokeWidth="2"
          opacity=".58"
        />
      </g>
      <g
        transform={`translate(${spread * 16} ${-spread * 30}) rotate(${spread * 3} 466 347)`}
      >
        <BirdSilhouette color="#ead0a0" />
        <path
          d="M423 356C372 337 337 297 302 257M466 355C538 305 613 266 682 193M481 355C561 311 604 293 650 264"
          fill="none"
          stroke="#71543c"
          strokeWidth="2.5"
        />
      </g>
      <path
        d="M553 435 569 412 606 420 591 438Z M657 452 670 433 691 448 681 467Z M748 405 769 392 775 416Z"
        fill="#d5a871"
      />
    </>
  );
};

const Mirror = ({ progress }: { progress: number }) => (
  <>
    <rect width="1000" height="700" fill="#26393f" />
    <path d="M0 99 403 225V516L0 687Z" fill="#526365" />
    <path d="M1000 99 609 225V516L1000 687Z" fill="#2d4347" />
    <path d="M0 99 403 225H609L1000 99V0H0Z" fill="#304549" />
    <path d="M0 687 403 516H609L1000 687V700H0Z" fill="#303d3b" />
    <path
      d="M0 459 403 394m-403 91 403-72m597 46-391-65m391 91-391-72M0 630l397-130m603 130-391-130"
      fill="none"
      stroke="#a8a17e"
      strokeWidth="2"
      opacity=".54"
    />
    <rect
      x="364"
      y="118"
      width="278"
      height="462"
      rx="138"
      fill="#17252a"
      stroke="#d3ae71"
      strokeWidth="9"
    />
    <rect
      x="382"
      y="136"
      width="242"
      height="425"
      rx="119"
      fill="#142329"
      stroke="#806b4a"
      strokeWidth="2"
    />
    <g opacity={0.43 + progress * 0.38}>
      <path
        d="M518 284C476 284 453 318 458 355L445 369L460 377C459 397 466 410 490 423C470 434 457 456 448 490H582C575 459 557 434 540 422C563 404 569 382 565 351C562 311 543 284 518 284Z"
        fill="#68746e"
      />
      <path
        d="M402 251C412 201 446 172 475 161L405 491C394 468 392 437 393 412Z"
        fill="#ccd2b9"
        opacity=".16"
      />
      <path
        d="M491 327Q505 317 518 326M484 390Q505 399 523 385"
        stroke="#9a9c80"
        strokeWidth="2"
        fill="none"
      />
    </g>
    <g fill="none" stroke="#b3aa87" strokeWidth="1.4" opacity=".68">
      <path d="M101 306v204m-4-141h202v151m-204-91h216m-213 8h217m-17-68v50" />
      <path d="M706 398v122m2-110h216v100m-218-54h223m-223 9h224m-192-64v46" />
    </g>
  </>
);

const art: Record<string, (progress: number) => ReactNode> = {
  apple: (progress) => <Apple progress={progress} />,
  worlds: (progress) => <Threshold progress={progress} closing={false} />,
  mark: (progress) => <Mark progress={progress} />,
  bird: (progress) => <Bird progress={progress} />,
  mirror: (progress) => <Mirror progress={progress} />,
  closing: (progress) => <Threshold progress={progress} closing />,
};

const captions = ({ chapter, frame }: { chapter: Chapter; frame: number }) =>
  chapter.lines.find(
    (line) => line.startFrame <= frame && frame < line.endFrame,
  );

const ChapterFrame = ({
  chapter,
  copy,
  index,
}: {
  chapter: Chapter;
  copy: SceneCopy;
  index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const duration = chapter.endFrame - chapter.startFrame;
  const progress = Math.min(Math.max(frame / duration, 0), 1);
  const cue = captions({ chapter, frame: frame + chapter.startFrame });
  const entrance = interpolate(frame, [0, 0.8 * fps], [0, 1], CURVE);
  const dark = ["worlds", "bird", "mirror", "closing"].includes(chapter.id);
  const foreground = dark ? IVORY : INK;
  const muted = dark ? "#e1c28e" : "#75513b";
  const accent = dark ? "#f0ce8c" : RUST;
  const closing = chapter.id === "closing";
  const chapterNumber = ROMAN[index] ?? String(index + 1);
  return (
    <AbsoluteFill style={{ color: foreground, fontFamily: SANS }}>
      <Paper dark={dark} />
      <header
        style={{
          position: "absolute",
          left: 79,
          right: 78,
          top: 44,
          height: 53,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: `1px solid ${muted}70`,
          fontSize: 22,
          letterSpacing: 4,
        }}
      >
        <div>
          阅读手记 <span style={{ color: muted, margin: "0 15px" }}>／</span>
          {script.title}
        </div>
        <span style={{ fontFamily: LATIN, color: muted }}>
          HERMANN HESSE · 1919
        </span>
      </header>
      <div
        style={{
          position: "absolute",
          left: 763,
          right: 78,
          top: 132,
          height: 746,
          overflow: "hidden",
          border: `1px solid ${muted}a0`,
          background: "#243638",
          boxShadow: "0 15px 33px #101a232e",
          clipPath: `inset(0 0 0 ${(1 - entrance) * (index === 0 ? 11 : 6)}%)`,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1000 700"
          preserveAspectRatio="xMidYMid slice"
          style={{
            display: "block",
            scale: 1.025 + 0.038 * progress,
            translate: `${8 - progress * 16}px ${progress * 8 - 4}px`,
          }}
        >
          {(art[chapter.id] ?? art.closing)(progress)}
          <rect
            x="30"
            y="29"
            width="940"
            height="642"
            rx="1"
            fill="none"
            stroke="#f4d5a3"
            strokeWidth="1"
            opacity=".34"
          />
          <rect
            x="36"
            y="35"
            width="928"
            height="630"
            fill="none"
            stroke="#f4d5a3"
            strokeWidth="1"
            opacity=".23"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            right: 31,
            bottom: 22,
            color: "#efddbc",
            fontFamily: LATIN,
            fontSize: 21,
            letterSpacing: 5,
          }}
        >
          TAB. {chapterNumber}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 81,
          top: 157,
          width: 618,
          bottom: 197,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            color: accent,
            fontSize: 23,
            fontWeight: 650,
            letterSpacing: 5,
          }}
        >
          <span style={{ fontFamily: LATIN, fontSize: 34 }}>
            {chapterNumber}.
          </span>
          <span
            style={{ width: 54, height: 1, background: accent, opacity: 0.7 }}
          />
          {copy.kicker}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            opacity: 0.25 + 0.75 * entrance,
            translate: `0 ${(1 - entrance) * 19}px`,
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: 88,
              letterSpacing: -1,
              lineHeight: 1.16,
              textWrap: "balance",
              whiteSpace: "pre-line",
              paddingBottom: 41,
              textShadow: dark ? "0 2px 0 #17292c" : "0 1px 0 #fff8e7",
            }}
          >
            {copy.heading}
          </div>
          <div
            style={{
              width: 120,
              height: 2,
              background: accent,
              marginBottom: 27,
              opacity: 0.78,
            }}
          />
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 32,
              fontWeight: 600,
              color: muted,
              lineHeight: 1.55,
              maxWidth: 544,
            }}
          >
            {copy.subheading}
          </div>
        </div>
        <div
          style={{
            color: muted,
            fontSize: 20,
            letterSpacing: 3,
            display: "flex",
            alignItems: "center",
            gap: 19,
          }}
        >
          <span
            style={{ width: 9, height: 9, background: accent, rotate: "45deg" }}
          />
          {closing ? script.author : "DEMIAN · 阅读赫尔曼·黑塞"}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 79,
          right: 78,
          bottom: 128,
          display: "flex",
          gap: 7,
          height: 2,
        }}
      >
        {script.scenes.map((scene, i) => (
          <div
            key={scene.id}
            style={{ flex: 1, background: `${muted}55`, overflow: "hidden" }}
          >
            <div
              style={{
                width: `${(i < index ? 1 : i === index ? progress : 0) * 100}%`,
                height: "100%",
                background: accent,
              }}
            />
          </div>
        ))}
      </div>
      {cue ? (
        <div
          style={{
            position: "absolute",
            left: 130,
            right: 130,
            bottom: 33,
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "#15282ded",
              color: "#fff2d8",
              border: "1px solid #b29d724a",
              borderRadius: 4,
              padding: "11px 28px 13px",
              fontSize: 39,
              fontWeight: 650,
              lineHeight: 1.22,
              letterSpacing: 1.1,
            }}
          >
            {cue.text}
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const DemianFilm = ({ timeline }: FilmProps) => {
  const { fps } = useVideoConfig();
  if (timeline.scenes.length === 0) {
    return (
      <AbsoluteFill
        style={{
          background: INK,
          color: IVORY,
          fontFamily: SANS,
          justifyContent: "center",
          alignItems: "center",
          fontSize: 46,
        }}
      >
        生成旁白与时间轴后预览《德米安》
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Audio src={staticFile("demian/narration.wav")} />
      {timeline.scenes.map((chapter, index) => (
        <Sequence
          key={chapter.id}
          name={script.scenes[index].heading}
          from={chapter.startFrame}
          durationInFrames={chapter.endFrame - chapter.startFrame}
          premountFor={fps}
        >
          <ChapterFrame
            chapter={chapter}
            copy={script.scenes[index]}
            index={index}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const DemianCover = () => (
  <AbsoluteFill style={{ color: IVORY }}>
    <Paper dark />
    <div
      style={{ position: "absolute", inset: 44, border: "2px solid #d2ad6f77" }}
    />
    <div
      style={{ position: "absolute", inset: 57, border: "1px solid #d2ad6f55" }}
    />
    <div
      style={{
        position: "absolute",
        top: 73,
        right: 79,
        fontFamily: LATIN,
        fontSize: 24,
        letterSpacing: 5,
        color: "#ddc398",
      }}
    >
      HERMANN HESSE &nbsp;·&nbsp; 1919
    </div>
    <div
      style={{
        position: "absolute",
        left: 703,
        top: 151,
        width: 1098,
        height: 772,
        overflow: "hidden",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1000 700">
        <Bird progress={0.84} />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg,#1b2b31 0%,transparent 33%,transparent 90%,#25373b 100%),linear-gradient(180deg,#233439 0%,transparent 20%,transparent 83%,#223338 100%)",
        }}
      />
    </div>
    <div style={{ position: "absolute", left: 273, top: 266, width: 750 }}>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 40,
          letterSpacing: 13,
          color: "#edca88",
          fontWeight: 650,
        }}
      >
        读书手记
      </div>
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 166,
          lineHeight: 1.27,
          fontWeight: 750,
          letterSpacing: 8,
          marginTop: 20,
          textShadow: "0 7px 25px #13252b",
        }}
      >
        德米安
      </div>
      <div
        style={{
          width: 128,
          height: 3,
          background: "#edca88",
          margin: "35px 0 27px",
        }}
      />
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 59,
          fontWeight: 650,
          letterSpacing: 4,
          color: "#e6ca99",
          textShadow: "0 5px 15px #162930",
        }}
      >
        从一颗苹果开始
      </div>
    </div>
  </AbsoluteFill>
);

const calculateMetadata: CalculateMetadataFunction<FilmProps> = async ({
  abortSignal,
}) => {
  const files = getStaticFiles();
  if (
    !files.some((file) => file.name === "demian/timeline.json") ||
    !files.some((file) => file.name === "demian/narration.wav")
  ) {
    return {};
  }
  const response = await globalThis.fetch(staticFile("demian/timeline.json"), {
    signal: abortSignal,
  });
  if (!response.ok) return {};
  const timeline = (await response.json().catch(() => null)) as Timeline | null;
  if (!timeline || !Array.isArray(timeline.scenes)) return {};
  const correctScenes =
    timeline.scenes.length === script.scenes.length &&
    timeline.scenes.every(
      (chapter, i) =>
        chapter.id === script.scenes[i].id &&
        chapter.startFrame === (timeline.scenes[i - 1]?.endFrame ?? 0) &&
        chapter.endFrame > chapter.startFrame &&
        chapter.lines.length === script.scenes[i].lines.length &&
        chapter.lines.every(
          (line, j) =>
            line.text === script.scenes[i].lines[j] &&
            line.startFrame >= chapter.startFrame &&
            line.startFrame >=
              (chapter.lines[j - 1]?.endFrame ?? chapter.startFrame) &&
            line.endFrame > line.startFrame &&
            line.endFrame <= chapter.endFrame,
        ),
    );
  if (
    timeline.fps !== FPS ||
    !correctScenes ||
    timeline.scenes[timeline.scenes.length - 1]?.endFrame !==
      timeline.durationInFrames
  )
    return {};
  return { durationInFrames: timeline.durationInFrames, props: { timeline } };
};

export const DemianCompositions = () => (
  <>
    <Composition
      id="Demian-Bilibili"
      component={DemianFilm}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={FPS}
      defaultProps={{
        timeline: { fps: FPS, durationInFrames: FPS, scenes: [] },
      }}
      calculateMetadata={calculateMetadata}
    />
    <Still
      id="Demian-Cover"
      component={DemianCover}
      width={1920}
      height={1080}
    />
  </>
);
