import { useEffect, useState, RefObject } from 'react';

const ROWHEIGHT = 120; // Fixed row height for Bible verses

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

    let timeoutId: NodeJS.Timeout;

    const handle = () => {
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Debounce the scroll handler
      timeoutId = setTimeout(() => {
        const mid = el.scrollTop + el.clientHeight / 2;
        const index = Math.floor(mid / ROWHEIGHT);
        
        // Ensure index is within bounds
        const boundedIndex = Math.max(0, index);
        
        console.log(`📍 ANCHOR SCROLL: scrollTop=${el.scrollTop}, mid=${mid}, index=${boundedIndex}`);
        setAnchorIndex(boundedIndex);
      }, 40);
    };

    el.addEventListener("scroll", handle, { passive: true });
    handle(); // Initial calculation
    
    return () => {
      el.removeEventListener("scroll", handle);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [ref]);

  return { anchorIndex };
}