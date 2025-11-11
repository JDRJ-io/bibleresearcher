import { useCallback } from 'react';

export function usePreserveAnchor() {
  const preserveAnchor = useCallback((containerRef: React.RefObject<HTMLElement>, anchorIndex: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    // DISABLED: This hook was causing snap-back behavior during user scrolling
    // Center anchor verse should be read-only telemetry, not force scroll position
    // const ROW_HEIGHT = 120;
    // const targetScrollTop = anchorIndex * ROW_HEIGHT;
    // container.scrollTop = targetScrollTop;
    
    // READ-ONLY: Only track center index for telemetry
    container.dataset.centerIndex = String(anchorIndex);
  }, []);
  
  return { preserveAnchor };
}