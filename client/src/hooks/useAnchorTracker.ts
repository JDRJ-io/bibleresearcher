import { useEffect, useRef, useState } from "react";
import { centerIndexFrom } from "@/utils/geometry";

type Anchors = {
  liveCenterIndex: number;        // UI-only
  prefetchAnchor: number;         // triggers fetch
  stableBookmarkAnchor: number;   // on idle
  direction: 1 | -1;
  velocityRps: number;            // rows per second
};

export function useAnchorTracker(
  getScrollTop: () => number, 
  getContainerHeight: () => number,
  rowHeight: number, 
  hysteresisRows: number, 
  stickyHeaderOffset: number = 0,
  idleMs = 300
): Anchors {
  const [liveCenterIndex, setLiveCenterIndex] = useState(0);
  const [prefetchAnchor, setPrefetchAnchor] = useState(0);
  const [stableBookmarkAnchor, setStableBookmarkAnchor] = useState(0);

  const lastIdxRef = useRef(0);
  const lastTsRef = useRef(performance.now());
  const velRef = useRef(0);
  const dirRef = useRef<1 | -1>(1);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const top = getScrollTop();
      const containerHeight = getContainerHeight();
      
      // Use geometry helper for consistent calculation (row-middle anchor mode)
      let idx = centerIndexFrom(top, containerHeight, rowHeight, stickyHeaderOffset);
      if (idx < 0) idx = 0;
      
      // DEBUG: Log anchor detection occasionally
      if (Math.abs(idx - lastIdxRef.current) >= 5) {
        console.log('🎯 ANCHOR TRACKER:', {
          idx,
          top,
          containerHeight,
          stickyHeaderOffset,
          rowHeight,
          rowHeightMultiplier: rowHeight / 120
        });
      }

      // velocity (rows/sec)
      const now = performance.now();
      const dt = (now - lastTsRef.current) / 1000;
      if (dt > 0) {
        velRef.current = (idx - lastIdxRef.current) / dt;
        dirRef.current = velRef.current >= 0 ? 1 : -1;
      }
      lastIdxRef.current = idx;
      lastTsRef.current = now;

      setLiveCenterIndex(idx);

      // Hysteresis for prefetchAnchor
      if (Math.abs(idx - prefetchAnchor) >= hysteresisRows) {
        setPrefetchAnchor(idx);
      }

      // Idle-based stable anchor
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setStableBookmarkAnchor(idx), idleMs);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [getScrollTop, getContainerHeight, rowHeight, hysteresisRows, stickyHeaderOffset, idleMs, prefetchAnchor]);

  return {
    liveCenterIndex,
    prefetchAnchor,
    stableBookmarkAnchor,
    direction: dirRef.current,
    velocityRps: Math.abs(velRef.current),
  };
}