import { useEffect, useState, RefObject, useCallback, useRef } from 'react';
import { ROW_HEIGHT } from '@/constants/layout';

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

  // 3-A. Debounced anchor update using useRef to prevent stale closure
  const setAnchorIndexRef = useRef(setAnchorIndex);
  setAnchorIndexRef.current = setAnchorIndex;

  const debouncedSetAnchor = useCallback(
    debounce((i: number) => setAnchorIndexRef.current(i), 100),
    []
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handle = () => {
      const mid = el.scrollTop + el.clientHeight / 2;
      const index = Math.floor(mid / ROW_HEIGHT);
      
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