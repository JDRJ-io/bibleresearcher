/* ────────────────────────────────────────────────────────────────
   BiblePageFan.tsx
   Lightweight SVG loader that looks like Bible pages fanning
   -------------------------------------------------------------
   • 3 stroked paths      → suggest three "stacks" of pages
   • SMIL <animate> tags  → morph the path's d‑attribute
   • Staggered begin times→ gentle ripple effect
   • Props for size, color, speed
   • Footprint ≈ 1 kB gzip, 0 extra requests
   ─────────────────────────────────────────────────────────────── */

import React from 'react';

type Props = {
  /** overall width in pixels */
  size?: number;
  /** stroke (page) color */
  color?: string;
  /** full loop time in milliseconds */
  duration?: number;
};

export default function BiblePageFan({
  size = 120,
  color = '#2fc2ff',
  duration = 1400,
}: Props) {
  // keep height proportional to width (roughly 0.45×)
  const h = size * 0.45;

  /* ───── two key shapes for each arc ─────
     Path A = tighter curve (rest)
     Path B = looser curve (wind‑open)
     Each pair must have identical command counts
  */
  const p1A = `M 10 ${h - 10} Q ${size / 2}   5 ${size - 10} ${h - 10}`;
  const p1B = `M  6 ${h - 18} Q ${size / 2}  -2 ${size -  6} ${h - 18}`;

  const p2A = `M 10 ${h -  2} Q ${size / 2}  13 ${size - 10} ${h -  2}`;
  const p2B = `M  6 ${h -  6} Q ${size / 2}   9 ${size -  6} ${h -  6}`;

  const p3A = `M 10 ${h +  6} Q ${size / 2}  21 ${size - 10} ${h +  6}`;
  const p3B = `M  6 ${h + 10} Q ${size / 2}  25 ${size -  6} ${h + 10}`;

  /* small helper to reduce repetition */
  const Arc = ({
    dA,
    dB,
    begin = '0s',
  }: {
    dA: string;
    dB: string;
    begin?: string;
  }) => (
    <path
      d={dA}
      fill="none"
      stroke={color}
      strokeWidth={6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <animate
        attributeName="d"
        dur={`${duration}ms`}
        begin={begin}
        repeatCount="indefinite"
        values={`${dA};${dB};${dA}`}
      />
    </path>
  );

  return (
    <svg
      width={size}
      height={h + 20}
      viewBox={`0 0 ${size} ${h + 20}`}
      role="img"
      aria-label="Fanning Bible pages"
    >
      {/* top → bottom arcs, 0.08 s stagger between each */}
      <Arc dA={p1A} dB={p1B} begin="0s" />
      <Arc dA={p2A} dB={p2B} begin="0.08s" />
      <Arc dA={p3A} dB={p3B} begin="0.16s" />
    </svg>
  );
}