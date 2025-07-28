
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

const THRESH = 10;  // rows to skip before fetching a new slice

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
      const anchor = Math.floor((el.scrollTop + el.clientHeight / 2) / ROW_HEIGHT);
      const lastAnchor = anchorIndexRef.current;
      
      if (Math.abs(anchor - lastAnchor) >= THRESH) {
        anchorIndexRef.current = anchor;
        setAnchorIndex(anchor);
        setSlice(loadChunk(anchor, verseKeys));
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
