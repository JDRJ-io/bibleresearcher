/**
 * Rolling windows virtualization system
 * 3-tier window architecture with intelligent prefetching
 */

import { useMemo, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLiveAnchor } from './useLiveAnchor';
import { useRollingWindows } from './useRollingWindows';
import { prefetch } from './prefetch/PrefetchManager';
import { scheduleEviction } from './data/verseCache';
import { logger } from '@/lib/logger';
import type { ScrollRoot } from './useScrollRoot';
import { mobileDiagnostics } from '@/utils/mobilePrefetchDiagnostics';
import { measureEffectiveRowHeight, resetRowHeightCache } from '@/utils/measureRowHeight';
import { useViewportStore } from '@/stores/viewportStore';

interface RollingVirtualizationResult {
  anchorIndex: number;
  stableAnchor: number;
  slice: {
    start: number;
    end: number;
    verseIDs: string[];
  };
  metrics: {
    direction: 'up' | 'down';
    velocity: number;
    isFastScroll: boolean;
  };
}

export function useRollingVirtualization(
  scrollRoot: ScrollRoot,
  verseKeys: string[],
  mainTranslation: string,
  rowHeight: number = 120,
  options?: { disabled?: boolean; columnCount?: number }
): RollingVirtualizationResult {
  // PERF FIX: Use viewport store instead of window event listeners
  const viewportW = useViewportStore(s => s.viewportW);
  const viewportH = useViewportStore(s => s.viewportH);
  
  // Use responsive mobile detection (reacts to resize/rotation)
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;
  
  // FIX #1: Measure effective row height on mobile (fixes 120px bug)
  const [effectiveRowHeight, setEffectiveRowHeight] = useState(rowHeight);
  
  useEffect(() => {
    if (!isMobile) {
      setEffectiveRowHeight(rowHeight);
      return;
    }
    
    // Measure after DOM is ready
    const timer = setTimeout(() => {
      const measured = measureEffectiveRowHeight(rowHeight);
      setEffectiveRowHeight(measured);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [isMobile, rowHeight]);
  
  // Reset measurement cache on resize/orientation change
  useEffect(() => {
    resetRowHeightCache();
    if (isMobile) {
      const measured = measureEffectiveRowHeight(rowHeight);
      setEffectiveRowHeight(measured);
    }
  }, [viewportW, viewportH, isMobile, rowHeight]);
  
  const total = verseKeys.length;
  
  // Live anchor tracking with velocity (60 FPS + scroll events)
  const scroller = scrollRoot.node();
  const { centerIdx, steppedIdx, velocity } = useLiveAnchor(scroller, effectiveRowHeight, total);
  
  // Track velocity for diagnostics
  useEffect(() => {
    mobileDiagnostics.recordVelocity(velocity);
  }, [velocity]);
  
  // Rolling windows (render/safety/background) with column-aware row capping
  const columnCount = options?.columnCount ?? 3;
  const windows = useRollingWindows(steppedIdx, total, isDesktop, velocity, columnCount);
  
  // Set translation and total verses for prefetch manager
  useEffect(() => {
    prefetch.setTranslation(mainTranslation);
    prefetch.setTotalVerses(total);
  }, [mainTranslation, total]);
  
  // Prefetch rolling windows - disabled flag only gates during scrollbar drag
  useEffect(() => {
    // Guard against running when disabled (e.g., during scrollbar drag)
    if (options?.disabled) return;
    
    // Enqueue safety buffer (high priority)
    prefetch.enqueue(windows.safety, 'high');
    mobileDiagnostics.recordDelta('safety', windows.safety);
    
    // Enqueue background (low priority)
    prefetch.enqueue(windows.background, 'low');
    mobileDiagnostics.recordDelta('background', windows.background);
    
    logger.debug('ROLLING', 'windows:update', {
      center: steppedIdx,
      render: windows.render,
      safety: windows.safety,
      background: windows.background
    });
  }, [windows.render[0], windows.render[1], windows.safety[0], windows.safety[1], windows.background[0], windows.background[1], options?.disabled]);
  
  // DESKTOP PERF FIX: Match mobile's efficient 1000-verse runway (was 1500 for desktop)
  useEffect(() => {
    const velocityThreshold = isDesktop ? 20 : 6;
    
    if (options?.disabled || Math.abs(velocity) < velocityThreshold) return;
    
    // Lay down a long forward runway in scroll direction (not ±200 around landing)
    const dir = Math.sign(velocity || 1);
    const runway = 1000; // Both desktop and mobile use same efficient runway size
    const rawStart = dir > 0 ? centerIdx + 1 : centerIdx - runway;
    const rawEnd = dir > 0 ? centerIdx + runway : centerIdx - 1;
    
    // Clamp to valid range and only enqueue if valid
    const start = Math.max(0, rawStart);
    const end = Math.min(total - 1, rawEnd);
    if (start > end) return; // Invalid range at boundaries
    
    prefetch.enqueue([start, end], 'high');
    
    logger.info('ROLLING', 'runway:prefetch', {
      center: centerIdx,
      velocity,
      direction: dir > 0 ? 'down' : 'up',
      runway: [start, end],
      verses: end - start + 1,
      threshold: velocityThreshold,
      device: isDesktop ? 'desktop' : 'mobile'
    });
  }, [centerIdx, velocity, total, options?.disabled, isDesktop]);
  
  // OPTIMIZED: Proximity refill - keep ahead buffer full during steady scrolling
  useEffect(() => {
    if (options?.disabled) return;
    
    const renderSize = 120; // Match the unified render size from useRollingWindows
    const aheadBuffer = windows.safety[1] - centerIdx;
    const refillThreshold = Math.round(1.2 * renderSize); // 144 verses
    
    // If ahead runway is thin, proactively enqueue a new slab
    if (aheadBuffer < refillThreshold) {
      const slab = isDesktop ? 600 : 500;
      const rawStart = centerIdx + 1;
      const rawEnd = centerIdx + slab;
      
      // Clamp to valid range and only enqueue if valid
      const start = Math.max(0, rawStart);
      const end = Math.min(total - 1, rawEnd);
      if (start > end) return; // Invalid range at document end
      
      prefetch.enqueue([start, end], 'high');
      
      logger.debug('ROLLING', 'proximity:refill', {
        center: centerIdx,
        aheadBuffer,
        threshold: refillThreshold,
        refillRange: [start, end],
        device: isDesktop ? 'desktop' : 'mobile'
      });
    }
  }, [centerIdx, windows.safety, total, options?.disabled, isDesktop]);
  
  // MOBILE OPT #6: Eviction tuned for mobile (higher caps, longer TTL)
  // Extract disabled state to stable boolean for dependency tracking
  const isDisabled = !!options?.disabled;
  
  useEffect(() => {
    // Guard: Don't evict during scrollbar drag (disabled state)
    if (isDisabled) return;
    
    const direction = velocity >= 0 ? 1 : -1;
    const forwardBg: [number, number] = direction > 0 ? windows.background : windows.safety;
    const backwardBg: [number, number] = direction < 0 ? windows.background : windows.safety;
    
    scheduleEviction({
      translationCode: mainTranslation,
      forwardBackground: forwardBg,
      backwardBackground: backwardBg,
      highWater: isDesktop ? 3000 : 3000,  // Mobile gets same high cap
      target: isDesktop ? 2500 : 2200,     // Mobile keeps more verses
      ttlMs: isDesktop ? 60000 : 180000    // Mobile: 3 min TTL (don't trim fresh rows)
    });
  }, [windows.background[0], windows.background[1], velocity, isDesktop, mainTranslation, isDisabled]);
  
  // Build slice from render window
  const slice = useMemo(() => {
    const [start, end] = windows.render;
    const verseIDs = verseKeys.slice(start, end + 1);
    
    logger.info('ROLLING', 'render-slice', {
      device: isDesktop ? 'desktop' : 'mobile',
      start,
      end,
      count: verseIDs.length,
      windowWidth: viewportW
    });
    
    return {
      start,
      end,
      verseIDs
    };
  }, [windows.render[0], windows.render[1], verseKeys, isDesktop, viewportW]);

  // Expose current state globally for diagnostics (browser console access)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__VIRTUALIZATION_STATE__ = {
        centerIdx,
        steppedIdx,
        velocity,
        windows,
        totalRows: total,
        rowHeight,
        isDesktop,
      };
    }
  }, [centerIdx, steppedIdx, velocity, windows, total, rowHeight, isDesktop]);
  
  return {
    anchorIndex: centerIdx,
    stableAnchor: steppedIdx,
    slice,
    metrics: {
      direction: velocity >= 0 ? 'down' : 'up',
      velocity,
      isFastScroll: Math.abs(velocity) > 20
    }
  };
}

/**
 * Main virtualization hook - uses rolling windows system exclusively
 * The disabled flag controls side effects (prefetch), not the core virtualization
 */
export function useVirtualization(
  scrollRoot: ScrollRoot,
  verseKeys: string[],
  mainTranslation: string,
  rowHeight: number,
  options?: { disabled?: boolean; columnCount?: number }
) {
  // Always use rolling windows - it's the only system now
  return useRollingVirtualization(scrollRoot, verseKeys, mainTranslation, rowHeight, options);
}
