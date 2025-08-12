
import { useRef, useState, useLayoutEffect } from "react";
import { getVerseKeys } from "@/lib/verseKeysLoader";
import { ROW_HEIGHT } from "@/constants/layout";

// SMART MOBILE OPTIMIZATION: Dynamic buffer based on device capabilities - RESTORED PROPER BUFFER
function getOptimalBuffer(): number {
  // Detect mobile/low-memory devices
  const isMobile = window.innerWidth <= 768;
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  const isSlowConnection = (navigator as any).connection && (navigator as any).connection.effectiveType?.includes('2g');
  
  // Check memory pressure
  const memInfo = (performance as any).memory;
  const memoryPressure = memInfo ? memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit : 0;
  
  if (isMobile || isLowMemory || isSlowConnection || memoryPressure > 0.8) {
    return 40; // RESTORED: Reasonable buffer for mobile while preventing crashes
  }
  return 80; // RESTORED: Proper desktop buffer for smooth scrolling
}

// Simple loadChunk implementation to replace anchorLoader - MOBILE OPTIMIZED
function loadChunk(anchorIndex: number, verseKeys: string[], buffer?: number) {
  const optimalBuffer = buffer || getOptimalBuffer();
  const allVerseKeys = verseKeys.length > 0 ? verseKeys : getVerseKeys();
  const totalRows = allVerseKeys.length;
  
  // VERSE LOADING FIX: Ensure we have valid verse keys
  if (!allVerseKeys || totalRows === 0) {
    console.warn('No verse keys available for chunk loading');
    return { start: 0, end: 0, slice: [] };
  }
  
  const start = Math.max(0, anchorIndex - optimalBuffer);
  const end = Math.min(totalRows - 1, anchorIndex + optimalBuffer);
  const slice = allVerseKeys.slice(start, end + 1);
  
  // Memory monitoring for crash prevention
  const memInfo = (performance as any).memory;
  const memoryPressure = memInfo ? 
    `${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB/${Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)}MB` : 
    'unknown';
  
  console.log(`📖 PREEMPTIVE LOADING: anchor=${anchorIndex}, buffer=${optimalBuffer}, verses=${slice.length}, staying ahead of scroll`);
  
  return {
    start,
    end,
    slice
  };
}

// SMART THRESHOLD: Dynamic based on device capabilities - BALANCED PERFORMANCE
function getOptimalThreshold(): number {
  const isMobile = window.innerWidth <= 768;
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  const memInfo = (performance as any).memory;
  const memoryPressure = memInfo ? memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit : 0;
  
  if (isMobile || isLowMemory || memoryPressure > 0.7) {
    return 15; // BALANCED: Trigger loading when within 15 verses of buffer edge
  }
  return 20; // BALANCED: Desktop loads when within 20 verses of buffer edge
}

export function useAnchorSlice(
  containerRef: React.RefObject<HTMLDivElement>, 
  verseKeys: string[] = [], 
  options?: { disabled?: boolean }
) {
  const anchorIndexRef = useRef(0);
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [slice, setSlice] = useState(() => loadChunk(0, verseKeys));

  // Reload slice when verse keys change (canonical/chronological toggle)
  useLayoutEffect(() => {
    setSlice(loadChunk(anchorIndexRef.current, verseKeys));
  }, [verseKeys]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    let scrollTimeout: NodeJS.Timeout;
    
    const onScroll = () => {
      // PAUSE LOADING: Skip all processing during scrollbar dragging
      if (options?.disabled) {
        return;
      }
      
      // THROTTLE SCROLL EVENTS for mobile performance
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // FIXED: Instant loading with better position preservation
        const scrollCenter = el.scrollTop + el.clientHeight / 2;
        const anchor = Math.round(scrollCenter / ROW_HEIGHT);
        const lastAnchor = anchorIndexRef.current;
        
        // Ensure anchor is within valid bounds
        const clampedAnchor = Math.max(0, Math.min(anchor, verseKeys.length - 1));
        
        const optimalThresh = getOptimalThreshold();
        
        // BALANCED INSTANT LOADING: For near-edge cases maintaining smooth scrolling
        const isMobile = window.innerWidth <= 768;
        const isNearEdge = isMobile && Math.abs(clampedAnchor - lastAnchor) >= 10; // Balanced threshold
        
        if (Math.abs(clampedAnchor - lastAnchor) >= optimalThresh || isNearEdge) {
          // Store current scroll position before slice change
          const currentScrollTop = el.scrollTop;
          
          anchorIndexRef.current = clampedAnchor;
          setAnchorIndex(clampedAnchor);
          setSlice(loadChunk(clampedAnchor, verseKeys));
          
          // Restore exact scroll position after slice loads
          requestAnimationFrame(() => {
            if (el.scrollTop !== currentScrollTop) {
              el.scrollTop = currentScrollTop;
            }
          });
        }
      }, 16); // 60fps throttling
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(scrollTimeout);
      el.removeEventListener("scroll", onScroll);
    };
  }, [containerRef, verseKeys, options]);

  return {
    anchorIndex,
    slice: {
      start: slice.start,
      end: slice.end,
      verseIDs: slice.slice,   // The verse keys array (these ARE the verse IDs)
      data: new Map()          // Empty data map for now
    }
  };
}
