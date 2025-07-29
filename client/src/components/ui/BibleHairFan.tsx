/* ────────────────────────────────────────────────────────────────
   BibleHairFan.tsx
   A halo of 15 thin "page strands" that sway independently,
   like hair blowing in a semicircle.
   -------------------------------------------------------------
   • Pure inline SVG (≈1 kB gzip, 0 extra requests)
   • <animateTransform> on each strand → real, fluid motion
   • No external CSS or JS loops – compositor‑only workload
   • Props for size, color, speed, spread
   ─────────────────────────────────────────────────────────────── */

import React from 'react';

type Props = {
  /** diameter of the semicircle (px) */
  size?: number;
  /** strand color */
  color?: string;
  /** full sway cycle in ms */
  duration?: number;
  /** how wide the fan opens (deg each side) */
  spread?: number;
  /** how many strands (15 is sweet‑spot) */
  strands?: number;
};

export default function BibleHairFan({
  size = 120,
  color = '#2fc2ff',
  duration = 1600,
  spread = 60,
  strands = 15,
}: Props) {
  const radius = size / 2;
  const startAngle = -spread;
  const step = (spread * 2) / (strands - 1);

  const lines = Array.from({ length: strands }, (_, i) => {
    const base = startAngle + i * step;      // ­‑60° … +60°
    const sway = 6;                          // ±3° each side
    const delay = (i * duration) / strands / 3; // gentle cascade

    /* Two‑step rotation values for animateTransform */
    const values = `${base - sway}; ${base + sway}; ${base - sway}`;

    return (
      <g key={i} transform={`rotate(${base})`}>
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={-radius}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur={`${duration}ms`}
            begin={`${delay}ms`}
            repeatCount="indefinite"
            values={values}
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
      style={{ overflow: 'visible' }}
    >
      {/* anchor the fan at bottom‑centre */}
      <g transform={`translate(0, ${radius})`}>{lines}</g>
    </svg>
  );
}