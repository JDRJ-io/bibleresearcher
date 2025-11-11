/* ────────────────────────────────────────────────────────────────
   BibleHairFan.tsx  ▸  v1.2 – performance optimized smooth motion
   A halo of thin "page strands" that sway independently,
   like hair blowing in a semicircle.
   -------------------------------------------------------------
   • Pure inline SVG (≈1 kB gzip, 0 extra requests)
   • <animateTransform> on each strand → compositor‑only motion
   • Phase‑shifted begin times span the *entire* cycle
   • 5‑point spline path (L → C → R → C → L) ⇒ no hard stops
   • Props for size, color, speed, spread, strands
   ─────────────────────────────────────────────────────────────── */

import React from "react";

type Props = {
  /** diameter of the semicircle (px) */
  size?: number;
  /** strand color */
  color?: string;
  /** full sway cycle in ms */
  duration?: number;
  /** how wide the fan opens (deg each side) */
  spread?: number;
  /** how many strands (15‒30 looks best) */
  strands?: number;
};

export default function BibleHairFan({
  size = 140,
  color = "#2fc2ff",
  duration = 800, // Faster default for smoother feel
  spread = 35, // Slightly tighter spread for performance
  strands = 15, // Fewer strands for better performance
}: Props) {
  const radius = size / 2;
  const startAngle = -spread;
  const step = (spread * 2) / (strands - 1);

  /* sway amplitude (°); reduced for smoother motion */
  const sway = 6; // ±6° total → ±3° each side, gentler motion

  const lines = Array.from({ length: strands }, (_, i) => {
    /* base angle for this strand */
    const base = startAngle + i * step;

    /* phase‑shift so wave covers the whole cycle */
    const phase = duration / strands;
    const flowDelay = i * phase;

    /* five‑point waveform: L → C → R → C → L */
    const left = base - sway;
    const centre = base;
    const right = base + sway;
    const values = `${left};${centre};${right};${centre};${left}`;

    /* optimized keyTimes & smoother cubic‑bezier splines */
    const keyTimes = "0;0.25;0.5;0.75;1";
    const spline = "0.25 0.1 0.25 1"; // smoother ease with less acceleration
    const keySplines = `${spline};${spline};${spline};${spline}`;

    return (
      <g key={i} transform={`rotate(${base})`}>
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={-radius}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity="0.9"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur={`${duration}ms`}
            begin={`${flowDelay}ms`}
            repeatCount="indefinite"
            values={values}
            keyTimes={keyTimes}
            calcMode="spline"
            keySplines={keySplines}
          />
        </line>
      </g>
    );
  });

  return (
    <svg
      width={size}
      height={radius}
      viewBox={`-${radius} 0 ${size} ${radius}`}
      role="img"
      aria-label="Bible pages fanning"
      style={{ overflow: "visible" }}
    >
      {/* anchor the fan at bottom‑centre */}
      <g transform={`translate(0, ${radius})`}>{lines}</g>
    </svg>
  );
}
