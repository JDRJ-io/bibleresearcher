
import { useRef, useState, useLayoutEffect } from "react";
import { getVerseKeys } from "@/lib/verseKeysLoader";
import { ROW_HEIGHT } from "@/constants/layout";

// Simple loadChunk implementation to replace anchorLoader
function loadChunk(anchorIndex: number, buffer: number = 100) {
  const allVerseKeys = getVerseKeys();
  const totalRows = allVerseKeys.length;
  
  const start = Math.max(0, anchorIndex - buffer);
  const end = Math.min(totalRows - 1, anchorIndex + buffer);
  const slice = allVerseKeys.slice(start, end + 1);
  
  return {
    start,
    end,
    slice
  };
}

const THRESH = 10;  // rows to skip before fetching a new slice

export function useAnchorSlice(containerRef: React.RefObject<HTMLDivElement>) {
  const anchorIndexRef = useRef(0);
  const [anchorIndex, setAnchorIndex] = useState(0);
  const [slice, setSlice] = useState(() => loadChunk(0));

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const onScroll = () => {
      const anchor = Math.floor((el.scrollTop + el.clientHeight / 2) / ROW_HEIGHT);
      const lastAnchor = anchorIndexRef.current;
      
      if (Math.abs(anchor - lastAnchor) >= THRESH) {
        anchorIndexRef.current = anchor;
        setAnchorIndex(anchor);
        setSlice(loadChunk(anchor));
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  return {
    anchorIndex,
    slice: {
      start: slice.start,
      end: slice.end,
      verseIDs: slice.slice,   // The verse keys array
      data: new Map()          // Empty data map for now
    }
  };
}
