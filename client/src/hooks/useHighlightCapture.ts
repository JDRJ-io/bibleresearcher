import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useHighlightCapture(onSelect: (info: SelectionInfo) => void) {
  const { user } = useAuth();
  
  useEffect(() => {
    function handleSelectionEnd() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !user) return; // Don't show for non-logged users

      // Find the verse-text element - works even with highlighted text
      let verseTextEl: HTMLElement | null = null;
      
      // First try the anchor node's parent
      if (sel.anchorNode?.parentElement?.classList.contains('verse-text')) {
        verseTextEl = sel.anchorNode.parentElement;
      }
      // Then try the anchor node itself
      else if ((sel.anchorNode as HTMLElement)?.classList?.contains('verse-text')) {
        verseTextEl = sel.anchorNode as HTMLElement;
      }
      // Finally, traverse up to find verse-text parent (works with highlighted spans)
      else {
        let current = sel.anchorNode;
        while (current && current !== document.body) {
          if ((current as HTMLElement)?.classList?.contains('verse-text')) {
            verseTextEl = current as HTMLElement;
            break;
          }
          current = current.parentNode;
        }
      }
      
      if (!verseTextEl) return;

      const verseRef = verseTextEl.dataset.verseRef!;
      const translation = verseTextEl.dataset.translation!;
      const start = sel.anchorOffset;
      const end = sel.focusOffset;

      // Normalize direction
      const [s, e] = start < end ? [start, end] : [end, start];

      // Absolute coords for color wheel - position well above the selected text
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      const pos = { x: rect.left + rect.width / 2, y: rect.top - 50 };

      onSelect({ verseRef, translation, startPos: s, endPos: e, pos });
      // DON'T clear selection immediately - let user see what they selected
    }
    
    // Add both mouse and touch event listeners for better cross-device support
    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);
    
    return () => {
      document.removeEventListener('mouseup', handleSelectionEnd);
      document.removeEventListener('touchend', handleSelectionEnd);
    };
  }, [onSelect, user]);
}

export interface SelectionInfo {
  verseRef: string;
  translation: string;
  startPos: number;
  endPos: number;
  pos: { x: number; y: number }; // screen coords
}