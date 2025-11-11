import { useEffect, useState, useRef } from 'react';
import { getScrollMetrics, getStickyOffsetsPx } from '@/utils/scrollMetrics';

/**
 * Detect if device is desktop vs mobile based on pointer capability
 * Desktop = fine pointer (mouse/trackpad) gets throttled scroll for smoothness
 * Mobile = coarse pointer (touch) gets instant scroll for responsiveness
 * This correctly handles touch-enabled laptops (Surface, etc.) as desktop
 */
function isDesktopDevice(): boolean {
  // SSR/test safety guard
  if (typeof window === 'undefined') return false;
  
  // Legacy browser fallback: assume desktop if viewport is wide
  if (typeof window.matchMedia !== 'function') {
    return window.innerWidth >= 1024;
  }
  
  // Use pointer media query - the most reliable desktop/mobile indicator
  // fine pointer = mouse/trackpad (desktop), coarse pointer = touch (mobile)
  // This correctly identifies touch-enabled laptops as desktop
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
  
  return hasFinePointer;
}

/**
 * Live anchor tracking with stepped index and velocity calculation
 * FIX #3: Dual tracking (RAF + scroll events) for reliable mobile velocity
 * MOBILE OPT #1: EMA + hold to prevent velocity collapse on fast flicks
 * FIX #4: Only update state when values actually change to prevent infinite re-renders
 * FIX #5: Use proper viewport height (visualViewport) and account for sticky headers
 * FIX #6: Clamp centerIdx to prevent exceeding total verses (prevents giant spacers)
 * DESKTOP OPT #1: Throttle scroll handler on desktop (150ms) for buttery smooth scrolling
 */
export function useLiveAnchor(
  scroller: HTMLElement | Window | null, 
  rowH: number,
  totalVerses: number = 31102 // Default to total Bible verses
) {
  const [centerIdx, setCenterIdx] = useState(0);
  const [velocity, setVelocity] = useState(0);
  
  const lastIdxRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const lastScrollYRef = useRef(0);
  const lastScrollTimeRef = useRef(performance.now());
  const lastVelocityRef = useRef(0);
  
  // MOBILE OPT #1: EMA + hold for stable velocity
  const emaRef = useRef(0);
  const lastAboveThresholdRef = useRef(0);
  const HOLD_MS = 200; // Keep fast state briefly after last hit
  const THRESH_RPS = 6; // Lower mobile trigger for fast flick
  const VELOCITY_CHANGE_THRESHOLD = 0.5; // Only update if velocity changes by this much
  
  // DESKTOP OPT #1: Throttle scroll handler for smoother desktop experience
  const lastScrollHandlerTimeRef = useRef(0);
  const DESKTOP_SCROLL_THROTTLE_MS = 150; // Desktop: process scroll events every 150ms
  const isDesktop = useRef(isDesktopDevice());
  
  // Update desktop detection on resize
  useEffect(() => {
    const updateDesktopDetection = () => {
      isDesktop.current = isDesktopDevice();
    };
    window.addEventListener('resize', updateDesktopDetection);
    return () => window.removeEventListener('resize', updateDesktopDetection);
  }, []);
  
  // FIX #6: Keep latest totalVerses in ref to prevent stale clamps during dependency transitions
  const totalVersesRef = useRef(totalVerses);
  totalVersesRef.current = totalVerses;

  useEffect(() => {
    if (!scroller || !rowH || totalVerses <= 0) return;
    
    // Reset lastIdxRef when totalVerses changes to prevent stale indices
    if (lastIdxRef.current >= totalVerses) {
      lastIdxRef.current = Math.max(0, totalVerses - 1);
      setCenterIdx(lastIdxRef.current);
    }
    
    let raf = 0;
    
    // FIX #5: Proper scroll/viewport reading - detect actual scrolling element
    const getST = () => {
      if (scroller instanceof Window) {
        return window.scrollY || 0;
      } else {
        // Container mode: Check if container is actually scrolling
        const container = scroller as HTMLElement;
        const containerScrollTop = container.scrollTop || 0;
        
        // PORTRAIT FIX: If container isn't scrolling, check if body/document is
        // This happens in portrait when headers are fixed and content has margin-top
        if (containerScrollTop === 0 && document.documentElement.scrollTop > 0) {
          // Body is scrolling instead of container
          return document.documentElement.scrollTop || document.body.scrollTop || 0;
        }
        
        return containerScrollTop;
      }
    };
    
    const getCH = () => {
      if (scroller instanceof Window) {
        return window.innerHeight;
      } else {
        // Use visualViewport height if available (iOS Safari dynamic toolbar)
        return (window.visualViewport?.height ?? scroller.clientHeight) || 600;
      }
    };

    // RAF tick for index updates (NO velocity setting - scroll handler owns velocity)
    const tick = () => {
      const scrollTop = getST();
      const viewportHeight = getCH();
      const mid = scrollTop + viewportHeight / 2;
      // Clamp index to valid range [0, totalVerses - 1]
      // Use ref to get latest totalVerses (prevents stale clamps during rapid verse-set swaps)
      const rawIdx = Math.floor(mid / rowH);
      const currentTotal = totalVersesRef.current;
      const idx = Math.max(0, Math.min(rawIdx, currentTotal - 1));
      
      // Only update state if index actually changed (prevents infinite re-renders)
      if (idx !== lastIdxRef.current) {
        setCenterIdx(idx);
        lastIdxRef.current = idx;
      }
      lastTimeRef.current = performance.now();
      
      raf = requestAnimationFrame(tick);
    };

    // MOBILE OPT #1: Scroll-driven EMA velocity with hold (SOLE velocity source)
    // DESKTOP OPT #1: Throttled on desktop for smoother scrolling
    const onScroll = () => {
      const now = performance.now();
      
      // DESKTOP THROTTLE: Skip processing if called too soon (150ms throttle on desktop only)
      if (isDesktop.current) {
        const timeSinceLastCall = now - lastScrollHandlerTimeRef.current;
        if (timeSinceLastCall < DESKTOP_SCROLL_THROTTLE_MS) {
          return; // Throttled - skip this scroll event
        }
        lastScrollHandlerTimeRef.current = now;
      }
      
      const y = getST();
      const dy = y - lastScrollYRef.current;
      const dt = Math.max(1, now - lastScrollTimeRef.current);
      
      // Calculate raw rows per second
      const rps = (dy / rowH) / (dt / 1000);
      
      // Apply EMA smoothing (50% weight on new value)
      emaRef.current = 0.5 * emaRef.current + 0.5 * rps;
      
      // Track when velocity is above threshold
      if (Math.abs(emaRef.current) >= THRESH_RPS) {
        lastAboveThresholdRef.current = now;
      }
      
      // Apply hold: keep velocity if recently above threshold
      const effective = (now - lastAboveThresholdRef.current <= HOLD_MS) 
        ? emaRef.current 
        : 0;
      
      // Only update velocity state if it changed significantly (prevents infinite re-renders)
      if (Math.abs(effective - lastVelocityRef.current) > VELOCITY_CHANGE_THRESHOLD) {
        setVelocity(effective);
        lastVelocityRef.current = effective;
      }
      
      lastScrollYRef.current = y;
      lastScrollTimeRef.current = now;
    };
    
    // Start RAF loop
    raf = requestAnimationFrame(tick);
    
    // Add scroll listener (passive for performance)
    scroller.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [scroller, rowH, totalVerses]);

  // Stepped index for planning (updates every 8 rows)
  const steppedIdx = Math.floor(centerIdx / 8) * 8;
  
  return { centerIdx, steppedIdx, velocity };
}
