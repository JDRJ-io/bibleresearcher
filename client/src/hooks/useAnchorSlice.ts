
import { useRef, RefObject } from 'react';
import { useAnchorScroll } from './useAnchorScroll';
import { useChunk } from './useChunk';
import { useRowData } from './useRowData';
import { getVerseKeys } from '@/lib/verseKeysLoader';

/**
 * Canonical hook that returns {anchorIndex, slice} for any component.
 * This is the single source of truth for anchor-centered data.
 */
export function useAnchorSlice(containerRef: RefObject<HTMLElement>) {
  const verseKeys = getVerseKeys();
  const anchorInfo = useAnchorScroll(containerRef);
  const chunk = useChunk(verseKeys, anchorInfo.anchorIndex, 250);
  const rowData = useRowData(chunk.verseIDs, []);

  return {
    anchorIndex: anchorInfo.anchorIndex,
    slice: {
      start: chunk.start,
      end: chunk.end,
      verseIDs: chunk.verseIDs,
      data: rowData
    }
  };
}
