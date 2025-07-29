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
  duration = 1800,
  spread = 60,
  strands = 30,
}: Props) {
  const radius = size / 2;
  const startAngle = -spread;
  const step = (spread * 2) / (strands - 1);

  const lines = Array.from({ length: strands }, (_, i) => {
    const base = startAngle + i * step;      // ­‑60° … +60°
    const sway = 10;                         // ±5° each side for flowing motion
    
    // Create a wave that flows from left to right across all strands
    const waveDelay = (i / strands) * (duration * 0.3); // wave propagation delay
    const flowDelay = i * 30;                // tight sequential timing
    
    // Create flowing wave motion - strands lean all one way, then all the other way
    const leftLean = base - sway;
    const rightLean = base + sway;
    const waveValues = `${leftLean}; ${rightLean}; ${leftLean}`;

    return (
      <g key={i} transform={`rotate(${base})`}>
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={-radius}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        >
          {/* Flowing wave motion that sweeps across all strands */}
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur={`${duration}ms`}
            begin={`${flowDelay}ms`}
            repeatCount="indefinite"
            values={waveValues}
            calcMode="spline"
            keySplines="0.25 0.1 0.25 1; 0.25 0.1 0.25 1"
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