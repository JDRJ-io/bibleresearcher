
import { useRef, useState, useLayoutEffect } from "react";
import { getVerseKeys } from "@/lib/verseKeysLoader";
import { ROW_HEIGHT } from "@/constants/layout";

// SMART MOBILE OPTIMIZATION: Dynamic buffer based on device capabilities AND memory usage
function getOptimalBuffer(): number {
  // Detect mobile/low-memory devices
  const isMobile = window.innerWidth <= 768;
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4;
  const isSlowConnection = (navigator as any).connection && (navigator as any).connection.effectiveType?.includes('2g');
  
  // Check current memory usage
  const memInfo = (performance as any).memory;
  let memoryPressure = 0;
  if (memInfo) {
    memoryPressure = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
  }
  
  // Base buffer size
  let buffer = 100; // Desktop default
  
  // Device-based adjustments
  if (isMobile) buffer = 50;
  if (isLowMemory) buffer = Math.min(buffer, 30);
  if (isSlowConnection) buffer = Math.min(buffer, 40);
  
  // Memory pressure adjustments
  if (memoryPressure > 0.85) buffer = Math.min(buffer, 20); // Critical memory
  else if (memoryPressure > 0.70) buffer = Math.min(buffer, 30); // High memory
  else if (memoryPressure > 0.50) buffer = Math.min(buffer, 50); // Medium memory
  
  // Minimum viable buffer
  return Math.max(10, buffer);
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
  options?: { disabled?: boolean; bufferOverride?: number }
) {
  const anchorIndexRef = useRef(0);
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [slice, setSlice] = useState(() => loadChunk(0, verseKeys, options?.bufferOverride));

  // Reload slice when verse keys change (canonical/chronological toggle)
  useLayoutEffect(() => {
    setSlice(loadChunk(anchorIndexRef.current, verseKeys, options?.bufferOverride));
  }, [verseKeys, options?.bufferOverride]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    
    const onScroll = () => {
      // PAUSE LOADING: Skip all processing during scrollbar dragging
      if (options?.disabled) {
        return;
      }
      
      // FIXED: Instant loading with better position preservation
      const scrollCenter = el.scrollTop + el.clientHeight / 2;
      const anchor = Math.round(scrollCenter / ROW_HEIGHT);
      const lastAnchor = anchorIndexRef.current;
      
      // Ensure anchor is within valid bounds
      const clampedAnchor = Math.max(0, Math.min(anchor, verseKeys.length - 1));
      
      const optimalThresh = getOptimalThreshold();
      
      // INSTANT LOADING: For mobile, always load if we're within 3 verses of viewport edge
      const isMobile = window.innerWidth <= 768;
      const isNearEdge = isMobile && Math.abs(clampedAnchor - lastAnchor) >= 3;
      
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
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
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
