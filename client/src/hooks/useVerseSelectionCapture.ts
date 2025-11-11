import { useEffect, useRef } from 'react';
import { useVerseSelection } from '@/contexts/SelectionContext';
import { useAuth } from '@/contexts/AuthContext';
import { selectionOffsetsIn } from '@/lib/selectionOffsets';

/**
 * Event delegation hook for capturing text selections in Bible verses.
 * Attaches a single listener to a container element instead of one per verse.
 * 
 * @param containerRef - Ref to the scroll container element
 */
export function useVerseSelectionCapture(containerRef: React.RefObject<HTMLElement>) {
  const { setSelection, clearSelection } = useVerseSelection();
  const { user } = useAuth();
  const isHandlingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleSelectionEnd(e: MouseEvent | TouchEvent) {
      // Prevent duplicate handling
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;
      
      // Small delay to ensure selection is finalized
      setTimeout(() => {
        try {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
            clearSelection();
            return;
          }

          const range = sel.getRangeAt(0);
          
          // Walk up from the selection to find the verse-text span
          let verseTextEl: HTMLElement | null = null;
          let node: Node | null = range.commonAncestorContainer;
          
          // If it's a text node, get its parent element
          if (node.nodeType === Node.TEXT_NODE) {
            node = node.parentElement;
          }
          
          // Walk up the DOM to find the verse-text element with data attributes
          while (node && node !== container) {
            const el = node as HTMLElement;
            if (el.classList?.contains('verse-text') && el.dataset?.verseRef) {
              verseTextEl = el;
              break;
            }
            node = el.parentElement;
          }

          if (!verseTextEl) {
            // Selection is not within a verse
            clearSelection();
            return;
          }

          // Extract verse metadata from data attributes
          const verseRef = verseTextEl.dataset.verseRef;
          const translation = verseTextEl.dataset.translation || 'NKJV';
          
          if (!verseRef) {
            clearSelection();
            return;
          }

          // Calculate character offsets within this verse's text
          const offsets = selectionOffsetsIn(verseTextEl);
          
          if (!offsets) {
            clearSelection();
            return;
          }

          // Get the text length for clamping
          const textLength = verseTextEl.textContent?.length || 0;

          // Build selection data and trigger toolbar
          setSelection({
            verseRef,
            translation,
            startPos: offsets.start,
            endPos: offsets.end,
            textLength,
            rect: offsets.rect,
          });

          console.log('✅ Selection captured:', {
            verseRef,
            translation,
            startPos: offsets.start,
            endPos: offsets.end,
            textLength,
            userId: user?.id,
          });
        } catch (error) {
          console.error('❌ Error capturing selection:', error);
          clearSelection();
        } finally {
          isHandlingRef.current = false;
        }
      }, 50);
    }

    // Attach listeners for both mouse and touch
    container.addEventListener('mouseup', handleSelectionEnd);
    container.addEventListener('touchend', handleSelectionEnd);

    return () => {
      container.removeEventListener('mouseup', handleSelectionEnd);
      container.removeEventListener('touchend', handleSelectionEnd);
    };
  }, [containerRef, setSelection, clearSelection, user]);
}
