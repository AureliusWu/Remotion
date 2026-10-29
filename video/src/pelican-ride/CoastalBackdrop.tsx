import type { FC } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { rideMotion } from "./motion";

const wrap = (distance: number, period: number) =>
  ((distance % period) + period) % period;

/** The repeating scenery closes after the same fifteen seconds as the rider. */
export const CoastalBackdrop: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { distance, phase } = rideMotion(frame, fps);
  const loopDistance = rideMotion(15 * fps, fps).distance;
  const groundPeriod = rideMotion(fps, fps).distance;
  const cloudPeriod = loopDistance * 0.015;
  const hillPeriod = loopDistance * 0.035;
  const seaPeriod = loopDistance * 0.06;
  const cloudOffset = wrap(distance * 0.015, cloudPeriod);
  const hillOffset = wrap(distance * 0.035, hillPeriod);
  const seaOffset = wrap(distance * 0.06, seaPeriod);
  const groundOffset = wrap(distance, groundPeriod);
  const pavingOffset = wrap(distance, groundPeriod / 2);
  const grassLean = Math.sin(phase) * 3;

  return (
    <svg
      viewBox="0 0 1920 1080"
      width="1920"
      height="1080"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "hidden",
      }}
    >
      <defs>
        <linearGradient id="pelican-coast-sky" x2="0" y2="1">
          <stop offset="0" stopColor="#f7ebcf" />
          <stop offset="1" stopColor="#f0dfbd" />
        </linearGradient>
        <linearGradient id="pelican-coast-water" x2="0" y2="1">
          <stop offset="0" stopColor="#9bc7c0" />
          <stop offset="1" stopColor="#b2d2c4" />
        </linearGradient>
        <linearGradient
          id="pelican-coast-edge-fade"
          x1="0"
          x2="1920"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="white" />
          <stop offset="0.24" stopColor="white" />
          <stop offset="0.34" stopColor="black" />
          <stop offset="0.74" stopColor="black" />
          <stop offset="0.84" stopColor="white" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <mask id="pelican-coast-side-details">
          <rect
            width="1920"
            height="1080"
            fill="url(#pelican-coast-edge-fade)"
          />
        </mask>
        <pattern
          id="pelican-coast-paper"
          width="54"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="9" cy="13" r="0.65" fill="#354b43" opacity="0.15" />
          <circle cx="36" cy="35" r="0.55" fill="#354b43" opacity="0.12" />
          <path
            d="M24 5h3M47 23h2M14 40h2"
            stroke="#fff9e8"
            strokeWidth="1"
            opacity="0.35"
          />
        </pattern>
      </defs>

      <rect width="1920" height="1080" fill="url(#pelican-coast-sky)" />
      <circle cx="1680" cy="272" r="126" fill="#edd0a4" opacity="0.5" />
      <circle cx="1680" cy="272" r="102" fill="#db916d" />

      <g fill="#fff7e2" opacity="0.72">
        {[-1, 0, 1, 2, 3, 4, 5, 6, 7].map((tile) => (
          <path
            key={tile}
            transform={`translate(${tile * cloudPeriod - cloudOffset} 0)`}
            d="M52 162c-12-1-14-16-3-22 6-4 12-3 18-1 1-20 26-27 38-10 14-9 34-1 35 14 17-2 30 6 26 15-3 7-16 8-30 8H69c-7 0-13-1-17-4Z"
          />
        ))}
      </g>

      <g fill="#b7c2aa" opacity="0.64">
        {[-1, 0, 1, 2, 3].map((tile) => (
          <path
            key={tile}
            transform={`translate(${tile * hillPeriod - hillOffset} 0) scale(${hillPeriod / 960} 1)`}
            d="M0 604c110 0 134-43 240-43s130 43 240 43 141-31 240-31 130 31 240 31v60H0Z"
          />
        ))}
      </g>

      <rect
        y="619"
        width="1920"
        height="196"
        fill="url(#pelican-coast-water)"
      />
      <path d="M0 620H1920" stroke="#dce3c8" strokeWidth="3" />

      <g
        mask="url(#pelican-coast-side-details)"
        fill="none"
        stroke="#e6efda"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.67"
      >
        {[-1, 0, 1, 2].map((tile) => (
          <g
            key={tile}
            transform={`translate(${tile * seaPeriod - seaOffset} 0)`}
          >
            <path d="M80 672c56 5 111 5 169 0m770 0c40 3 70 3 108 0" />
            <path d="M312 717c66 5 120 5 182 0m704 2c42 4 80 4 124 0" />
            <path d="M42 756c38 4 72 4 114 0m616-1c70 6 125 6 198 0" />
          </g>
        ))}
      </g>

      <path
        d="M0 773c310-16 474 17 769 3s569-20 1151 2v302H0Z"
        fill="#edceaa"
      />
      <path
        d="M0 774c310-16 474 17 769 3s569-20 1151 2"
        fill="none"
        stroke="#edf0d8"
        strokeWidth="9"
        opacity="0.87"
      />
      <path
        d="M0 814c334-7 603 13 939 0s651-9 981 1"
        fill="none"
        stroke="#d5b890"
        strokeWidth="2"
        opacity="0.3"
      />

      <rect y="875" width="1920" height="205" fill="#e7c49f" />
      <path d="M0 875H1920" stroke="#354b43" strokeWidth="2" opacity="0.27" />

      <g fill="none" stroke="#bd9e7a" strokeWidth="2" opacity="0.23">
        {[-1, 0, 1, 2, 3, 4].map((tile) => (
          <g
            key={tile}
            transform={`translate(${tile * (groundPeriod / 2) - pavingOffset} 0)`}
          >
            <path d="M96 928l106 0m177 104 70 0M546 984l41 0" />
            <path d="M620 891l-13 22m20 126-16 35" opacity="0.52" />
          </g>
        ))}
      </g>

      <g stroke="#354b43" strokeLinecap="round" strokeLinejoin="round">
        {[-1, 0, 1, 2].map((tile) => (
          <g
            key={tile}
            transform={`translate(${tile * groundPeriod - groundOffset} 0)`}
          >
            <ellipse
              cx="178"
              cy="1009"
              rx="64"
              ry="8"
              fill="#b29f76"
              stroke="none"
              opacity="0.15"
            />
            <g transform={`translate(${grassLean} 0)`}>
              <path
                d="M175 1007c-31-15-39-36-38-62 21 9 34 29 38 62Z"
                fill="#8ca58d"
                strokeWidth="1.6"
              />
              <path
                d="M175 1008c-6-38 4-65 25-82 7 32-3 59-25 82Z"
                fill="#718f79"
                strokeWidth="1.6"
              />
              <path
                d="M176 1008c15-29 36-39 59-35-9 20-29 32-59 35Z"
                fill="#a1ae86"
                strokeWidth="1.6"
              />
              <path
                d="M175 1007l17-58m-17 58-26-43m26 43 36-24"
                fill="none"
                strokeWidth="1.1"
                opacity="0.65"
              />
            </g>
            <path
              d="M1138 1058c7-10 20-11 29 0Z"
              fill="#d1af8c"
              stroke="none"
            />
          </g>
        ))}
      </g>

      <rect
        width="1920"
        height="1080"
        fill="url(#pelican-coast-paper)"
        opacity="0.28"
      />
    </svg>
  );
};
