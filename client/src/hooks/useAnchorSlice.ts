
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

const THRESH = 15;  // FIXED: Balanced threshold - instant loading with position preservation

export function useAnchorSlice(containerRef: React.RefObject<HTMLDivElement>, verseKeys: string[] = []) {
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
    
    const onScroll = () => {
      // FIXED: Instant loading with better position preservation
      const scrollCenter = el.scrollTop + el.clientHeight / 2;
      const anchor = Math.round(scrollCenter / ROW_HEIGHT);
      const lastAnchor = anchorIndexRef.current;
      
      // Ensure anchor is within valid bounds
      const clampedAnchor = Math.max(0, Math.min(anchor, verseKeys.length - 1));
      
      if (Math.abs(clampedAnchor - lastAnchor) >= THRESH) {
        const oldStart = slice.start;            // keep current slice start
        anchorIndexRef.current = clampedAnchor;
        setAnchorIndex(clampedAnchor);
        
        const nextSlice = loadChunk(clampedAnchor, verseKeys);
        setSlice(nextSlice);
        
        // adjust by the number of rows we inserted/removed
        requestAnimationFrame(() => {
          el.scrollTop += (nextSlice.start - oldStart) * ROW_HEIGHT;
        });
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef, verseKeys]);

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
