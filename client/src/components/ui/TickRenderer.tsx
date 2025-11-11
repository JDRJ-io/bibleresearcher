import { useEffect, useRef } from 'react';
import type { Scale } from '@/lib/smartScrollbar';
import { bookTickIndices } from '@/lib/bookBands';

type TickRendererProps = {
  scale: Scale;
  width: number;
  height: number;
  dpr?: number;
  version?: number; // Force re-render when version changes
};

export function TickRenderer({ 
  scale, 
  width, 
  height, 
  dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1),
  version
}: TickRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas resolution
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Style for book ticks
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';

    // Get all book start indices
    const bookStarts = bookTickIndices();

    // Draw tick for each book
    for (const idx of bookStarts) {
      const y01 = scale.toY01(idx);
      const y = y01 * height;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width * 0.5, y); // 50% of track width
      ctx.stroke();
    }
  }, [scale, width, height, dpr, version]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.6,
        transition: 'opacity 180ms ease-out'
      }}
    />
  );
}
