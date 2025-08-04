import { useEffect, useState } from 'react';

export function useHighlightCapture(onSelect: (info: SelectionInfo) => void) {
  useEffect(() => {
    function handleMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;

      // Ensure selection starts *inside* a verse-text span
      const anchorEl = sel.anchorNode?.parentElement;
      if (!anchorEl?.classList.contains('verse-text')) return;

      const verseRef = anchorEl.dataset.verseRef!;
      const translation = anchorEl.dataset.translation!;
      const start = sel.anchorOffset;
      const end = sel.focusOffset;

      // Normalize direction
      const [s, e] = start < end ? [start, end] : [end, start];

      // Absolute coords for color wheel
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const pos = { x: rect.left + rect.width / 2, y: rect.top - 8 };

      onSelect({ verseRef, translation, startPos: s, endPos: e, pos });
      sel.removeAllRanges(); // collapse selection
    }
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [onSelect]);
}

export interface SelectionInfo {
  verseRef: string;
  translation: string;
  startPos: number;
  endPos: number;
  pos: { x: number; y: number }; // screen coords
}