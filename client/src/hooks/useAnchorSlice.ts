
import { useRef, useState, useLayoutEffect } from "react";
import { getVerseKeys } from "@/lib/verseKeysLoader";
import { ROW_HEIGHT } from "@/constants/layout";

// SMART MOBILE OPTIMIZATION: Dynamic buffer based on device capabilities
function getOptimalBuffer(): number {
  // Detect mobile/low-memory devices
  const isMobile = window.innerWidth <= 768;
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  const isSlowConnection = (navigator as any).connection && (navigator as any).connection.effectiveType?.includes('2g');
  
  if (isMobile || isLowMemory || isSlowConnection) {
    return 40; // Increased mobile buffer for smoother scrolling
  }
  return 100; // Larger desktop buffer for seamless experience
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
  
  
  return {
    start,
    end,
    slice
  };
}

// SMART THRESHOLD: Dynamic based on device capabilities
function getOptimalThreshold(): number {
  const isMobile = window.innerWidth <= 768;
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  
  if (isMobile || isLowMemory) {
    return 5; // Very frequent loads to stay ahead of scrolling
  }
  return 8; // More frequent loads for desktop too
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
    // DISABLED: Single Anchor Authority system now handles all anchor tracking
    // This scroll listener is replaced by VirtualBibleTable's centralized system
    if (!containerRef.current || options?.disabled) return;

    // Subscribe to anchor events from the Single Anchor Authority
    const handleAnchorChange = (event: CustomEvent) => {
      const { liveIndex } = event.detail;
      const clampedAnchor = Math.max(0, Math.min(liveIndex, verseKeys.length - 1));
      
      // Only update if anchor significantly changed (reduce churn)
      if (Math.abs(clampedAnchor - anchorIndexRef.current) >= 3) {
        anchorIndexRef.current = clampedAnchor;
        setAnchorIndex(clampedAnchor);
        setSlice(loadChunk(clampedAnchor, verseKeys));
      }
    };

    const handlePrefetch = (event: CustomEvent) => {
      // Handle intelligent prefetching based on velocity
      const { anchor, leadRows } = event.detail;
      // Prefetch logic can be implemented here if needed
    };

    // Listen to anchor events instead of direct scroll
    window.addEventListener('anchor:change', handleAnchorChange as EventListener);
    window.addEventListener('anchor:prefetch', handlePrefetch as EventListener);

    return () => {
      window.removeEventListener('anchor:change', handleAnchorChange as EventListener);
      window.removeEventListener('anchor:prefetch', handlePrefetch as EventListener);
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
