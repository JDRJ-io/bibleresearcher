import { useEffect } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';

/**
 * useContainerMetrics - Centralized container size observation
 * 
 * PERF FIX: One ResizeObserver on the scroll container instead of per-row observers
 * - Before: 120 rows × 2 ResizeObservers = 240 observers
 * - After: 1 observer on the container
 */
export function useContainerMetrics(containerRef: React.RefObject<HTMLElement>) {
  const setContainer = useLayoutStore(s => s.setContainerMetrics);
  
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setContainer({ 
        width: Math.round(cr.width), 
        height: Math.round(cr.height) 
      });
    });
    
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, setContainer]);
}
