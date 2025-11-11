/**
 * Compute 0-based, end-exclusive offsets of current window selection
 * relative to a root verse element (which contains only the verse text + markup).
 * Returns null if selection is collapsed or outside root.
 */
export function selectionOffsetsIn(rootEl: HTMLElement): { start: number; end: number; rect?: DOMRect } | null {
  const sel = window.getSelection?.();
  if (!sel || sel.rangeCount === 0) return null;

  // Ensure selection is inside this verse root
  const range = sel.getRangeAt(0);
  if (!rootEl.contains(range.startContainer) || !rootEl.contains(range.endContainer)) {
    return null;
  }
  if (range.collapsed) return null;

  // Compute index of a (container,offset) within root by measuring text content
  const indexOf = (container: Node, offsetInNode: number) => {
    try {
      // Create a range from the start of root to the boundary point
      const measureRange = document.createRange();
      measureRange.setStart(rootEl, 0);
      measureRange.setEnd(container, offsetInNode);
      
      // Get the text content of this range
      const textContent = measureRange.toString();
      return textContent.length;
    } catch (error) {
      // Fallback to walker-based calculation for edge cases
      let index = 0;
      const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      
      while (node) {
        const text = node as Text;
        if (node === container && container.nodeType === Node.TEXT_NODE) {
          index += offsetInNode;
          break;
        }
        index += text.data.length;
        node = walker.nextNode();
      }
      return index;
    }
  };

  // Normalize (start,end)
  const aNode = range.startContainer, aOff = range.startOffset;
  const bNode = range.endContainer,   bOff = range.endOffset;
  let start = indexOf(aNode, aOff);
  let end   = indexOf(bNode, bOff);
  if (start > end) [start, end] = [end, start]; // reverse selection

  // Clamp to non-negative
  start = Math.max(0, start);
  end   = Math.max(start, end);

  // Get a stable rect for toolbar (fallback to boundingClientRect of range)
  let rect: DOMRect | undefined;
  try { rect = range.getBoundingClientRect(); } catch { /* noop */ }

  return { start, end, rect };
}