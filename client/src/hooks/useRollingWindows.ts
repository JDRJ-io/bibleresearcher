import { useMemo } from 'react';
import { logger } from '@/lib/logger';
import { computeOptimalRowCount, perfGuard } from '@/utils/perfGovernor';

export type Range = [number, number];

/**
 * Three-tier rolling windows for seamless scrolling
 * FIX #4: Optimized mobile windows to prevent jank (120 render, conservative buffers)
 * FIX #6: Early-edge asymmetry - bias forward only near index 0
 * PERF GOVERNOR: Column-aware row clamp keeps cells ≤ 360
 */
export function useRollingWindows(
  centerIdx: number, 
  total: number, 
  isDesktop: boolean, 
  velocityRps: number,
  columnCount: number = 3
) {
  const dir = Math.sign(velocityRps || 0) || 1; // 1 = forward, -1 = backward
  
  // PERF GOVERNOR: Compute optimal row count based on column count
  // 5 columns: 70 rows = 350 cells
  // 4 columns: 90 rows = 360 cells
  // ≤3 columns: 120 rows = max 360 cells
  const renderSize = computeOptimalRowCount(columnCount);
  const half = Math.floor(renderSize / 2);
  
  // Performance guard: warn if cells exceed safe threshold (development only)
  if (process.env.NODE_ENV === 'development') {
    perfGuard(renderSize, columnCount);
  }

  // Render window: bias in scroll direction
  const render: Range = [
    clamp(centerIdx - (dir > 0 ? half - 20 : half + 20), 0, total - 1),
    clamp(centerIdx + (dir > 0 ? half + 20 : half - 20), 0, total - 1),
  ];

  // MOBILE OPT #2: Expanded mobile windows for better prefetch coverage
  const safetyPadTop = isDesktop ? (dir < 0 ? 300 : 150) : (dir < 0 ? 400 : 200);
  const safetyPadBot = isDesktop ? (dir > 0 ? 400 : 250) : (dir > 0 ? 400 : 250);
  
  let safety: Range = [
    clamp(render[0] - safetyPadTop, 0, total - 1),
    clamp(render[1] + safetyPadBot, 0, total - 1),
  ];

  // FIX #6: Early-edge asymmetry - no backward prefetch near top
  if (centerIdx < 200) {
    safety[0] = render[0]; // Prevent re-enqueuing [0..N]
  }

  // MOBILE OPT #2: Wider background windows (300/700) for ~1k+ verses warmed ahead
  const bgPadTop = isDesktop ? (dir < 0 ? 500 : 250) : (dir < 0 ? 300 : 150);
  const bgPadBot = isDesktop ? (dir > 0 ? 900 : 450) : (dir > 0 ? 700 : 400);
  
  let background: Range = [
    clamp(safety[0] - bgPadTop, 0, total - 1),
    clamp(safety[1] + bgPadBot, 0, total - 1),
  ];
  
  // FIX #6: Early-edge asymmetry - no backward prefetch near top
  if (centerIdx < 200) {
    background[0] = safety[0];
  }

  const windows = useMemo(
    () => ({ render, safety, background }),
    [render[0], render[1], safety[0], safety[1], background[0], background[1]]
  );
  
  // Debug logging (throttled by logger)
  if (centerIdx >= 0) {
    logger.debug('WINDOWS', `${isDesktop ? 'desktop' : 'mobile'}`, {
      render: `[${windows.render[0]}, ${windows.render[1]}] (${windows.render[1] - windows.render[0] + 1} verses)`,
      renderSize,
      columnCount,
      cells: renderSize * columnCount,
      centerIdx,
      windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0
    }, { throttleMs: 500 });
  }
  
  return windows;
}

function clamp(n: number, a: number, b: number) { 
  return Math.max(a, Math.min(b, n)); 
}
