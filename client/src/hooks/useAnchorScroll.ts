import { useEffect, useState, RefObject, useCallback } from 'react';

const ROWHEIGHT = 120; // Fixed row height for Bible verses

// 3-A. Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Custom hook that attaches a scroll listener to the table's container,
 * measures the element at the vertical centre of the viewport,
 * turns that into an index, debounces at 40ms, and calls setAnchorIndex.
 */
export function useAnchorScroll(ref: RefObject<HTMLElement>) {
  const [anchorIndex, setAnchorIndex] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // 3-A. Debounce anchor updates
    const debouncedSetAnchor = useCallback(
      debounce((i: number) => setAnchorIndex(i), 100),
      []
    );

    const handle = () => {
      const mid = el.scrollTop + el.clientHeight / 2;
      const index = Math.floor(mid / ROWHEIGHT);
      
      // Ensure index is within bounds
      const boundedIndex = Math.max(0, index);
      
      console.log(`📍 ANCHOR SCROLL: scrollTop=${el.scrollTop}, mid=${mid}, index=${boundedIndex}`);
      // Why: prevents 30+ state updates on a fast wheel spin, which in turn eliminates dropped frames.
      debouncedSetAnchor(boundedIndex);
    };

    el.addEventListener("scroll", handle, { passive: true });
    handle(); // Initial calculation
    
    return () => {
      el.removeEventListener("scroll", handle);
    };
  }, [ref]);

  return { anchorIndex };
}