
import { useRef, useState, useLayoutEffect } from "react";
import { getVerseKeys } from "@/lib/verseKeysLoader";
import { ROW_HEIGHT } from "@/constants/layout";

// Simple loadChunk implementation to replace anchorLoader
function loadChunk(anchorIndex: number, verseKeys: string[], buffer: number = 100) {
  const allVerseKeys = verseKeys.length > 0 ? verseKeys : getVerseKeys();
  const totalRows = allVerseKeys.length;
  
  // VERSE LOADING FIX: Ensure we have valid verse keys
  if (!allVerseKeys || totalRows === 0) {
    console.warn('No verse keys available for chunk loading');
    return { start: 0, end: 0, slice: [] };
  }
  
  const start = Math.max(0, anchorIndex - buffer);
  const end = Math.min(totalRows - 1, anchorIndex + buffer);
  const slice = allVerseKeys.slice(start, end + 1);
  
  console.log(`📖 loadChunk: anchor=${anchorIndex}, buffer=${buffer}, start=${start}, end=${end}, sliceLength=${slice.length}`);
  
  return {
    start,
    end,
    slice
  };
}

const THRESH = 5;  // FIXED: Reduced threshold for smoother scrolling - prevent large jumps

export function useAnchorSlice(containerRef: React.RefObject<HTMLDivElement>) {
  const anchorIndexRef = useRef(0);
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [slice, setSlice] = useState(() => loadChunk(0, []));

  // Get verse keys once and use consistently
  const verseKeys = getVerseKeys();

  // Initialize slice with verse keys when available
  useLayoutEffect(() => {
    if (verseKeys.length > 0) {
      setSlice(loadChunk(anchorIndexRef.current, verseKeys));
    }
  }, [verseKeys.length]); // Only depend on length to prevent infinite loops

  useLayoutEffect(() => {
    if (!containerRef.current || verseKeys.length === 0) return;

    const el = containerRef.current;
    const onScroll = () => {
      // FIXED: More precise anchor calculation to prevent drift
      const scrollCenter = el.scrollTop + el.clientHeight / 2;
      const anchor = Math.round(scrollCenter / ROW_HEIGHT); // Use round instead of floor for better precision
      const lastAnchor = anchorIndexRef.current;
      
      // Ensure anchor is within valid bounds
      const clampedAnchor = Math.max(0, Math.min(anchor, verseKeys.length - 1));
      
      if (Math.abs(clampedAnchor - lastAnchor) >= THRESH) {
        anchorIndexRef.current = clampedAnchor;
        setAnchorIndex(clampedAnchor);
        setSlice(loadChunk(clampedAnchor, verseKeys));
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [verseKeys.length]); // Stable dependency

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
