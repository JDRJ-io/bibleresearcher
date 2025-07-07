import { useCallback } from 'react';

export function useTextSelection() {
  const getSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    return {
      text: selection.toString(),
      startOffset: range.startOffset,
      endOffset: range.endOffset,
      containerElement: range.commonAncestorContainer.parentElement
    };
  }, []);
  
  const clearSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }, []);
  
  return { getSelection, clearSelection };
}