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
  duration = 1200,
  spread = 60,
  strands = 25,
}: Props) {
  const radius = size / 2;
  const startAngle = -spread;
  const step = (spread * 2) / (strands - 1);

  const lines = Array.from({ length: strands }, (_, i) => {
    const base = startAngle + i * step;      // ­‑60° … +60°
    const sway = 8;                          // ±4° each side for more dramatic flow
    
    // Create a flowing wave effect - each strand follows the wave with a phase offset
    const wavePhase = (i / strands) * 360;  // distribute phase across 360°
    const delay = (i * 50);                 // tight stagger for wave effect
    
    // Wave flows from left to right, then back
    const waveValues = `${base - sway}; ${base + sway}; ${base - sway}`;

    return (
      <g key={i} transform={`rotate(${base})`}>
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={-radius}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          opacity={0.9}
        >
          {/* Wave-like flowing motion from side to side */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur={`${duration}ms`}
            begin={`${delay}ms`}
            repeatCount="indefinite"
            values={waveValues}
            calcMode="spline"
            keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"
            keyTimes="0; 0.5; 1"
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