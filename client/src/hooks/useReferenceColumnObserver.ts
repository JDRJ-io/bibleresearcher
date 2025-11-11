import { useEffect } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';

/**
 * useReferenceColumnObserver - Centralized reference column width observation
 * 
 * PERF FIX: One ResizeObserver on the first reference column instead of per-row observers
 * - Before: 120 rows × 1 ResizeObserver × 2 elements = 240 element observations
 * - After: 1 observer on 1 reference column element
 * 
 * Each VirtualRow subscribes to the width from layoutStore instead of creating its own observer
 */
export function useReferenceColumnObserver(containerRef: React.RefObject<HTMLElement>) {
  const setReferenceColumnWidth = useLayoutStore(s => s.setReferenceColumnWidth);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    // Find the first reference column cell to observe
    const findReferenceCell = () => {
      return container.querySelector('.cell-ref') as HTMLElement | null;
    };
    
    let observedElement: HTMLElement | null = null;
    let checkInterval: number | null = null;
    
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.round(entry.contentRect.width);
        setReferenceColumnWidth(width);
      }
    });
    
    // Try to find and observe reference cell
    const attemptObserve = () => {
      const refCell = findReferenceCell();
      
      if (refCell && refCell !== observedElement) {
        // Disconnect previous observation if any
        if (observedElement) {
          ro.unobserve(observedElement);
        }
        
        // Observe the new reference cell
        ro.observe(refCell);
        observedElement = refCell;
        
        // Clear the interval once we've found and observed an element
        if (checkInterval !== null) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
      }
    };
    
    // Initial attempt
    attemptObserve();
    
    // If not found initially, keep checking (for virtual scrolling scenarios)
    // Reference cells mount/unmount as user scrolls
    if (!observedElement) {
      checkInterval = window.setInterval(attemptObserve, 500);
    }
    
    return () => {
      ro.disconnect();
      if (checkInterval !== null) {
        clearInterval(checkInterval);
      }
    };
  }, [containerRef, setReferenceColumnWidth]);
}
