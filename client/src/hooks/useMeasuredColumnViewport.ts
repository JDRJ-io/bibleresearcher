import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { logger } from '@/lib/logger';
import { useColumnChangeSignal } from './useColumnChangeSignal';

/**
 * Assumptions aligned to your codebase:
 * - Header cells have data attributes tying them to slot order and navigable status.
 * - Header scroll container is the horizontal "authority".
 * - Reference column (#) is sticky & excluded from "navigable count".
 */
type Measure = { slot: number; left: number; right: number; width: number; isNavigable: boolean };

function collectMeasures(headerEl: HTMLElement): Measure[] {
  const nodes = Array.from(
    headerEl.querySelectorAll<HTMLElement>('[data-col-slot]')
  );

  const list = nodes.map((el) => {
    const slot = Number(el.getAttribute('data-col-slot'));
    const nav = el.getAttribute('data-col-navigable') === 'true';
    const left = el.offsetLeft;             // includes sticky offset for non-sticky cols
    const width = el.offsetWidth;
    return { slot, left, right: left + width, width, isNavigable: nav };
  });

  // Sort by slot to match your fixed column order (0..19)
  list.sort((a, b) => a.slot - b.slot);
  return list;
}

export function useMeasuredColumnViewport(opts: {
  headerRef: React.RefObject<HTMLElement>;
  bodyRef?: React.RefObject<HTMLElement>;
  // bump this when visible set/order/widths change
  dependencyKey?: string | number;
}) {
  const { headerRef, bodyRef, dependencyKey } = opts;

  logger.debug("COL", '📐 MEASUREMENT HOOK INITIALIZED:', { 
    hasHeaderRef: !!headerRef?.current,
    hasBodyRef: !!bodyRef?.current,
    dependencyKey 
  });

  const [measures, setMeasures] = useState<Measure[]>([]);
  const [firstVisNavSlot, setFirstVisNavSlot] = useState<number | null>(null);
  const [visibleNavCount, setVisibleNavCount] = useState(1);

  // Sync body position using transform (since scrolling is disabled)
  const syncBody = useCallback((translateX: number) => {
    const bodyContainer = bodyRef?.current;
    if (bodyContainer) {
      const bodyInner = bodyContainer.querySelector('.tableInner') as HTMLElement;
      if (bodyInner) {
        bodyInner.style.transform = `translateX(${translateX}px)`;
      }
    }
  }, [bodyRef]);

  const recompute = useCallback(() => {
    const header = headerRef.current;
    logger.debug("COL", '🔄 RECOMPUTE CALLED:', { hasHeader: !!header });
    if (!header) {
      logger.debug("COL", '❌ RECOMPUTE EARLY RETURN: No header ref');
      // Structured logging for missing ref case
      logger.debug("COL", 'MEASURE', {
        containerWidth: 0,
        colWidth: 0,
        fullyVisible: 1, // fallback default
        refAttached: false,
        fallbackUsed: true,
        timestamp: new Date().toISOString().slice(11, 23)
      });
      return;
    }
    const m = collectMeasures(header);
    setMeasures(m);

    // Since we're using transform instead of scroll, calculate view based on transform
    const headerInner = header.querySelector('.column-headers-inner') as HTMLElement;
    const currentTransform = headerInner ? getComputedStyle(headerInner).transform : 'none';
    let viewLeft = 0;
    
    if (currentTransform && currentTransform !== 'none') {
      const matrix = currentTransform.match(/matrix3?d?\(([^)]+)\)/);
      if (matrix) {
        const values = matrix[1].split(',').map(v => v.trim());
        // For matrix(a, b, c, d, e, f) or matrix3d(...), translateX is values[4] (matrix) or values[12] (matrix3d)
        const translateIndex = values.length === 6 ? 4 : 12;
        viewLeft = -parseFloat(values[translateIndex] || '0');
      }
    }
    
    const viewRight = viewLeft + header.clientWidth;

    // Only navigable columns (exclude sticky ref col, etc.)
    const navigables = m.filter(x => x.isNavigable);
    
    // CRITICAL FIX: Account for non-navigable columns (like hybrid/master) taking up viewport space
    const nonNavigables = m.filter(x => !x.isNavigable);
    const nonNavigableWidth = nonNavigables.reduce((sum, col) => sum + col.width, 0);
    
    // Adjust viewport width to account for non-navigable columns
    // Clamp to 0 to prevent negative values in edge cases with very wide sticky columns
    const effectiveViewportWidth = Math.max(0, header.clientWidth - nonNavigableWidth);
    const effectiveViewRight = viewLeft + effectiveViewportWidth;

    if (navigables.length === 0) {
      setFirstVisNavSlot(null);
      setVisibleNavCount(1);
      return;
    }

    // ENHANCED VISIBILITY DETECTION: Separate fully visible from partial edge visibility
    // Use effectiveViewRight instead of viewRight for navigable column calculations
    const fullyVisible = navigables.filter(col => 
      col.left >= viewLeft && col.right <= effectiveViewRight
    );
    
    const partiallyVisible = navigables.filter(col => 
      col.right > viewLeft && col.left < effectiveViewRight && 
      !(col.left >= viewLeft && col.right <= effectiveViewRight)
    );
    
    // Detect partial visibility at edges for navigation enablement
    const partialLeftExists = navigables.some(col => col.left < viewLeft && col.right > viewLeft);
    const partialRightExists = navigables.some(col => col.left < effectiveViewRight && col.right > effectiveViewRight);
    
    // Any visible columns (fully or partially) for fallback logic
    const anyVisible = navigables.filter(col => col.right > viewLeft && col.left < effectiveViewRight);
    

    // Find first visible column for navigation (prefer fully visible, fallback to any visible)
    if (fullyVisible.length > 0) {
      setFirstVisNavSlot(Math.min(...fullyVisible.map(col => col.slot)));
    } else if (anyVisible.length > 0) {
      setFirstVisNavSlot(Math.min(...anyVisible.map(col => col.slot)));
    } else {
      // Fallback to nearest navigable column to the left edge
      const nearest = navigables.find(col => col.left >= viewLeft) ?? navigables[navigables.length - 1];
      setFirstVisNavSlot(nearest?.slot ?? null);
    }
    
    // CRITICAL FIX: Count only FULLY visible columns for navigation logic
    // Partially visible columns enable navigation but don't count as "fitting"
    const fullyVisibleCount = Math.max(1, fullyVisible.length);
    
    // Structured logging for diagnosis
    logger.debug("COL", 'MEASURE', {
      containerWidth: header.clientWidth,
      colWidth: navigables.length > 0 ? navigables[0].right - navigables[0].left : 0,
      fullyVisible: fullyVisible.length,
      refAttached: true, // header exists here
      fallbackUsed: false,
      timestamp: new Date().toISOString().slice(11, 23)
    });
    
    // Debug viewport measurement issue
    logger.debug("COL", '🔍 VIEWPORT MEASUREMENT DEBUG:', {
      viewLeft,
      viewRight,
      headerClientWidth: header.clientWidth,
      nonNavigableWidth,
      effectiveViewportWidth,
      effectiveViewRight,
      navigablesLength: navigables.length,
      fullyVisibleLength: fullyVisible.length,
      partiallyVisibleLength: partiallyVisible.length,
      nonNavigableColumns: nonNavigables.map(col => ({
        slot: col.slot,
        width: col.width
      })),
      navigablePositions: navigables.map(col => ({ 
        slot: col.slot, 
        left: col.left, 
        right: col.right, 
        width: col.right - col.left,
        isFullyVisible: col.left >= viewLeft && col.right <= effectiveViewRight
      })),
      finalCount: fullyVisibleCount
    });
    
    setVisibleNavCount(fullyVisibleCount);
  }, [headerRef]);

  // Since horizontal scrolling is disabled, we don't need scroll event listeners
  // Navigation is handled through transform positioning

  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const ro = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => recompute(), 50);
    });
    
    ro.observe(header);
    return () => {
      ro.disconnect();
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [headerRef, recompute]);

  useEffect(() => {
    logger.debug("COL", '🔄 FORCING VIEWPORT REMEASUREMENT...');
    requestAnimationFrame(() => requestAnimationFrame(recompute));
  }, [dependencyKey, recompute]);

  // Listen for column layout changes and trigger remeasurement
  // 🎯 FIX: Don't wrap in useCallback - useColumnChangeSignal now handles stability internally
  useColumnChangeSignal((detail: any) => {
    // EXPERT FIX: Double RAF trigger for aggressive remeasurement after layout changes
    if (['width', 'visibility', 'order', 'multiplier', 'layout-recalc'].includes(detail.changeType)) {
      // Double RAF ensures DOM changes are fully processed
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          recompute();
        });
      });
    }
  });

  // Find the x-offset for a given navigable slot
  const getLeftForSlot = useCallback((slot: number | null): number | null => {
    if (slot == null) return null;
    const m = measures.find(x => x.slot === slot);
    return m?.left ?? null;
  }, [measures]);

  const scrollToNavSlot = useCallback((slot: number, behavior: ScrollBehavior = 'smooth') => {
    const header = headerRef.current;
    if (!header) return;
    const left = getLeftForSlot(slot);
    if (left == null) return;
    
    // Since horizontal scrolling is disabled, use transform to position columns
    const headerInner = header.querySelector('.column-headers-inner') as HTMLElement;
    const bodyContainer = bodyRef?.current;
    
    if (headerInner) {
      // Move the header container to show the target column
      const translateX = -left;
      logger.debug("COL", '🎯 HEADER TRANSFORM DEBUG:', {
        slot,
        left,
        translateX,
        headerInner,
        currentTransform: headerInner.style.transform,
        willApplyTransform: `translateX(${translateX}px)`
      });
      headerInner.style.transform = `translateX(${translateX}px)`;
      headerInner.style.transition = behavior === 'smooth' ? 'transform 0.3s ease' : 'none';
      
      // Verify the transform was applied
      setTimeout(() => {
        logger.debug("COL", '🔍 HEADER TRANSFORM APPLIED:', {
          finalTransform: headerInner.style.transform,
          computedTransform: getComputedStyle(headerInner).transform
        });
      }, 50);
    } else {
      logger.warn("COL", '❌ HEADER INNER NOT FOUND:', { header, headerQuery: '.column-headers-inner' });
    }
    
    if (bodyContainer) {
      // Move the body container to match
      const bodyInner = bodyContainer.querySelector('.tableInner') as HTMLElement;
      if (bodyInner) {
        const translateX = -left;
        bodyInner.style.transform = `translateX(${translateX}px)`;
        bodyInner.style.transition = behavior === 'smooth' ? 'transform 0.3s ease' : 'none';
      }
    }
    
    requestAnimationFrame(() => requestAnimationFrame(recompute));
  }, [getLeftForSlot, headerRef, bodyRef, recompute]);

  const navigableSlots = useMemo(() => measures.filter(m => m.isNavigable).map(m => m.slot), [measures]);

  const canScrollLeft = useMemo(() => {
    if (firstVisNavSlot == null) return false;
    const idx = navigableSlots.indexOf(firstVisNavSlot);
    return idx > 0;
  }, [firstVisNavSlot, navigableSlots]);

  const canScrollRight = useMemo(() => {
    if (firstVisNavSlot == null) return false;
    const idx = navigableSlots.indexOf(firstVisNavSlot);
    
    // ENHANCED NAVIGATION: Enable right arrow if there are more columns OR partial columns at right edge
    const header = headerRef.current;
    if (!header) return false;
    
    // Calculate current view based on transform
    const headerInner = header.querySelector('.column-headers-inner') as HTMLElement;
    const currentTransform = headerInner ? getComputedStyle(headerInner).transform : 'none';
    let viewLeft = 0;
    
    if (currentTransform && currentTransform !== 'none') {
      const matrix = currentTransform.match(/matrix3?d?\(([^)]+)\)/);
      if (matrix) {
        const values = matrix[1].split(',').map(v => v.trim());
        // For matrix(a, b, c, d, e, f) or matrix3d(...), translateX is values[4] (matrix) or values[12] (matrix3d)
        const translateIndex = values.length === 6 ? 4 : 12;
        viewLeft = -parseFloat(values[translateIndex] || '0');
      }
    }
    
    // Account for non-navigable columns (like hybrid/master) taking up viewport space
    const nonNavigables = measures.filter(m => !m.isNavigable);
    const nonNavigableWidth = nonNavigables.reduce((sum, col) => sum + col.width, 0);
    const effectiveViewportWidth = header.clientWidth - nonNavigableWidth;
    const effectiveViewRight = viewLeft + effectiveViewportWidth;
    const navigables = measures.filter(m => m.isNavigable);
    
    // Check if any column is partially visible on the right (clipped)
    const partialRightExists = navigables.some(col => col.left < effectiveViewRight && col.right > effectiveViewRight);
    
    return idx > -1 && ((idx + visibleNavCount) < navigableSlots.length || partialRightExists);
  }, [firstVisNavSlot, visibleNavCount, navigableSlots, headerRef, measures]);

  const scrollLeftOne = useCallback(() => {
    if (!canScrollLeft || firstVisNavSlot == null) return;
    const idx = navigableSlots.indexOf(firstVisNavSlot);
    const target = navigableSlots[idx - 1];
    if (target != null) scrollToNavSlot(target);
  }, [canScrollLeft, firstVisNavSlot, navigableSlots, scrollToNavSlot]);

  const scrollRightOne = useCallback(() => {
    if (!canScrollRight || firstVisNavSlot == null) return;
    
    const header = headerRef.current;
    if (!header) return;
    
    // Calculate current view based on transform
    const headerInner = header.querySelector('.column-headers-inner') as HTMLElement;
    const currentTransform = headerInner ? getComputedStyle(headerInner).transform : 'none';
    let viewLeft = 0;
    
    if (currentTransform && currentTransform !== 'none') {
      const matrix = currentTransform.match(/matrix3?d?\(([^)]+)\)/);
      if (matrix) {
        const values = matrix[1].split(',').map(v => v.trim());
        // For matrix(a, b, c, d, e, f) or matrix3d(...), translateX is values[4] (matrix) or values[12] (matrix3d)
        const translateIndex = values.length === 6 ? 4 : 12;
        viewLeft = -parseFloat(values[translateIndex] || '0');
      }
    }
    
    // Account for non-navigable columns (like hybrid/master) taking up viewport space
    const nonNavigables = measures.filter(m => !m.isNavigable);
    const nonNavigableWidth = nonNavigables.reduce((sum, col) => sum + col.width, 0);
    const effectiveViewportWidth = header.clientWidth - nonNavigableWidth;
    const effectiveViewRight = viewLeft + effectiveViewportWidth;
    const navigables = measures.filter(m => m.isNavigable);
    
    // Check if there's a partially visible column on the right that we should scroll to
    const partialRightColumn = navigables.find(col => col.left < effectiveViewRight && col.right > effectiveViewRight);
    
    if (partialRightColumn) {
      // Scroll to show the partially visible column fully
      scrollToNavSlot(partialRightColumn.slot);
    } else {
      // Standard navigation - go to next column
      const idx = navigableSlots.indexOf(firstVisNavSlot);
      const target = navigableSlots[idx + 1];
      if (target != null) scrollToNavSlot(target);
    }
  }, [canScrollRight, firstVisNavSlot, navigableSlots, scrollToNavSlot, headerRef, measures]);

  return {
    firstVisNavSlot,
    visibleNavCount,        // ← this replaces "maxVisibleNavigableColumns"
    navigableSlots,
    canScrollLeft,
    canScrollRight,
    scrollLeftOne,
    scrollRightOne,
    scrollToNavSlot,
    recompute,
  };
}