import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useHighlightCapture(onSelect: (info: SelectionInfo) => void) {
  const { user } = useAuth();
  
  useEffect(() => {
    function handleMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !user) return; // Don't show for non-logged users

      // Ensure selection is inside a verse-text span (check both anchor node and parent)
      let verseTextEl = sel.anchorNode?.parentElement;
      if (!verseTextEl?.classList.contains('verse-text')) {
        // Try checking if the anchor node itself has the class
        verseTextEl = sel.anchorNode as HTMLElement;
        if (!verseTextEl?.classList?.contains('verse-text')) {
          // Try finding the closest verse-text parent
          verseTextEl = (sel.anchorNode as HTMLElement)?.closest?.('.verse-text') as HTMLElement;
          if (!verseTextEl) return;
        }
      }

      const verseRef = verseTextEl.dataset.verseRef!;
      const translation = verseTextEl.dataset.translation!;
      const start = sel.anchorOffset;
      const end = sel.focusOffset;

      // Normalize direction
      const [s, e] = start < end ? [start, end] : [end, start];

      // Absolute coords for color wheel
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const pos = { x: rect.left + rect.width / 2, y: rect.top - 8 };

      onSelect({ verseRef, translation, startPos: s, endPos: e, pos });
      // DON'T clear selection immediately - let user see what they selected
    }
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [onSelect, user]);
}

export interface SelectionInfo {
  verseRef: string;
  translation: string;
  startPos: number;
  endPos: number;
  pos: { x: number; y: number }; // screen coords
}