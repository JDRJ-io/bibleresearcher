/**
 * Anchor-centered scrolling utility for smooth navigation
 * Integrates with LoadMode system for optimized performance during dragging
 */

export interface ScrollToOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  targetIndex: number;
  totalVerses: number;
  rowHeight: number;
  behavior?: 'smooth' | 'instant';
  onScrollStart?: () => void;
  onScrollEnd?: () => void;
}

/**
 * Centers a specific verse index in the viewport
 */
export function centerAnchor({
  containerRef,
  targetIndex,
  totalVerses,
  rowHeight,
  behavior = 'smooth',
  onScrollStart,
  onScrollEnd
}: ScrollToOptions) {
  const container = containerRef.current;
  if (!container) return;

  onScrollStart?.();

  const containerHeight = container.clientHeight;
  const maxScrollTop = Math.max(0, totalVerses * rowHeight - containerHeight);
  
  // Calculate scroll position to center the target verse
  const targetScrollTop = Math.max(0, Math.min(
    maxScrollTop,
    targetIndex * rowHeight - containerHeight / 2 + rowHeight / 2
  ));

  container.scrollTo({
    top: targetScrollTop,
    behavior
  });

  // Call onScrollEnd after scroll completes
  if (onScrollEnd) {
    if (behavior === 'smooth') {
      // For smooth scrolling, wait for scroll to complete
      const checkScrollEnd = () => {
        if (Math.abs(container.scrollTop - targetScrollTop) < 1) {
          onScrollEnd();
        } else {
          requestAnimationFrame(checkScrollEnd);
        }
      };
      requestAnimationFrame(checkScrollEnd);
    } else {
      // For instant scrolling, call immediately
      onScrollEnd();
    }
  }
}

/**
 * Calculates the verse index that would be at the center of viewport for a given scroll position
 */
export function getVerseAtScrollPosition(
  scrollTop: number,
  containerHeight: number,
  rowHeight: number
): number {
  const centerY = scrollTop + containerHeight / 2;
  return Math.floor(centerY / rowHeight);
}

/**
 * Gets the scroll position needed to center a specific verse
 */
export function getScrollPositionForVerse(
  verseIndex: number,
  containerHeight: number,
  rowHeight: number,
  totalVerses: number
): number {
  const maxScrollTop = Math.max(0, totalVerses * rowHeight - containerHeight);
  
  return Math.max(0, Math.min(
    maxScrollTop,
    verseIndex * rowHeight - containerHeight / 2 + rowHeight / 2
  ));
}