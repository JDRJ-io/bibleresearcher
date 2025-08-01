import { useCallback } from 'react';
import { ROW_HEIGHT } from '@/constants/layout';

export function usePreserveAnchor() {
  const preserveAnchor = useCallback((containerRef: React.RefObject<HTMLElement>, anchorIndex: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    const targetScrollTop = anchorIndex * ROW_HEIGHT;
    
    container.scrollTop = targetScrollTop;
  }, []);
  
  return { preserveAnchor };
}