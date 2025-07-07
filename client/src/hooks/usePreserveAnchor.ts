import { useCallback } from 'react';

export function usePreserveAnchor() {
  const preserveAnchor = useCallback((containerRef: React.RefObject<HTMLElement>, anchorIndex: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const ROW_HEIGHT = 120;
    const targetScrollTop = anchorIndex * ROW_HEIGHT;
    
    container.scrollTop = targetScrollTop;
  }, []);
  
  return { preserveAnchor };
}