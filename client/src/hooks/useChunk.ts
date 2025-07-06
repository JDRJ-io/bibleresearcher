import { useMemo } from 'react';

interface ChunkResult {
  start: number;
  end: number;
  verseIDs: string[];
}

/**
 * Given anchorIndex and buffer, returns start, end, and verseIDs (verseKeys.slice(start,end)).
 * Memoized so scrolling without index change costs zero.
 */
export function useChunk(verseKeys: string[], anchorIndex: number, buffer: number = 250): ChunkResult {
  return useMemo(() => {
    if (!verseKeys.length) {
      return { start: 0, end: 0, verseIDs: [] };
    }

    // Calculate start and end around the anchor
    const halfBuffer = Math.floor(buffer / 2);
    const start = Math.max(0, anchorIndex - halfBuffer);
    const end = Math.min(verseKeys.length, anchorIndex + halfBuffer);
    
    // Ensure we maintain the buffer size if possible
    const actualBuffer = end - start;
    if (actualBuffer < buffer && start > 0) {
      // Expand backwards if we have room
      const expandStart = Math.max(0, start - (buffer - actualBuffer));
      return {
        start: expandStart,
        end,
        verseIDs: verseKeys.slice(expandStart, end)
      };
    } else if (actualBuffer < buffer && end < verseKeys.length) {
      // Expand forwards if we have room
      const expandEnd = Math.min(verseKeys.length, end + (buffer - actualBuffer));
      return {
        start,
        end: expandEnd,
        verseIDs: verseKeys.slice(start, expandEnd)
      };
    }
    
    const verseIDs = verseKeys.slice(start, end);
    
    console.log(`🏆 ANCHOR LOAD [${verseIDs.length}]: anchor=${anchorIndex}, start=${start}, end=${end}`);
    
    return { start, end, verseIDs };
  }, [verseKeys, anchorIndex, buffer]);
}