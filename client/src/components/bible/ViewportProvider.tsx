import { useEffect, useRef } from 'react';
import { useViewportStore } from '@/stores/viewportStore';

/**
 * ViewportProvider - Centralized window event listener management
 * 
 * PERF FIX: Replaces 120+ per-row event listeners with a single global listener
 * - Before: 120 rows × (scroll + resize + orientationchange) = 360+ listeners
 * - After: 1 of each event listener globally
 * 
 * Rows simply read from the viewport store instead of attaching their own listeners.
 */
export function ViewportProvider() {
  const setMetrics = useViewportStore(s => s.setMetrics);
  const rafRef = useRef(0);

  const read = () => {
    const docY = window.pageYOffset || document.documentElement.scrollTop || 0;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const vw = window.visualViewport?.width ?? window.innerWidth;
    const orientation = (vw < vh) ? 'portrait' : 'landscape';
    setMetrics({ scrollTop: docY, viewportH: vh, viewportW: vw, orientation });
  };

  const schedule = () => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => { 
      rafRef.current = 0; 
      read(); 
    });
  };

  useEffect(() => {
    read();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [setMetrics]);

  return null;
}
