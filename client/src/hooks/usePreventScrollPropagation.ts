import { useLayoutEffect, RefObject } from 'react';

/**
 * Prevents scroll/touch events from propagating through an overlay element
 * to the content beneath it. Essential for fixed/absolute positioned elements
 * that sit on top of scrollable content.
 * 
 * @param ref - React ref to the element that should block scroll propagation
 * @param options - Configuration options
 * @param options.allowInternalScroll - If true, allows scrolling within the element itself (default: true)
 * @param options.preventWheel - If true, prevents mouse wheel events (default: true)
 * @param options.preventTouch - If true, prevents touch move events (default: true)
 */
export function usePreventScrollPropagation(
  ref: RefObject<HTMLElement>,
  options: {
    allowInternalScroll?: boolean;
    preventWheel?: boolean;
    preventTouch?: boolean;
  } = {}
) {
  const {
    allowInternalScroll = true,
    preventWheel = true,
    preventTouch = true,
  } = options;

  // Use useLayoutEffect to attach listeners immediately after DOM mutations
  // This ensures listeners are attached even when ref.current changes
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      if (!preventWheel) return;

      if (allowInternalScroll) {
        const target = e.target as HTMLElement;
        const scrollableParent = findScrollableParent(target, element);
        
        if (scrollableParent) {
          const { scrollTop, scrollHeight, clientHeight } = scrollableParent;
          const isScrollingDown = e.deltaY > 0;
          const isScrollingUp = e.deltaY < 0;
          
          const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
          const atTop = scrollTop <= 1;
          
          if ((isScrollingDown && atBottom) || (isScrollingUp && atTop)) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
      }
      
      // Block all scroll propagation
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!preventTouch) return;
      
      const target = e.target as HTMLElement;
      const scrollableParent = findScrollableParent(target, element);
      
      if (scrollableParent && allowInternalScroll) {
        (e.target as any)._scrollableParent = scrollableParent;
        (e.target as any)._startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!preventTouch) return;

      // Allow touch events from scrollbar thumbs to pass through
      const target = e.target as HTMLElement;
      if (target.closest('[data-scrollbar-thumb]')) {
        return;
      }

      if (allowInternalScroll) {
        const scrollableParent = (target as any)._scrollableParent;
        
        if (scrollableParent) {
          const currentY = e.touches[0].clientY;
          const startY = (target as any)._startY || currentY;
          const deltaY = startY - currentY;
          
          const { scrollTop, scrollHeight, clientHeight } = scrollableParent;
          const isScrollingDown = deltaY > 0;
          const isScrollingUp = deltaY < 0;
          
          const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
          const atTop = scrollTop <= 1;
          
          if ((isScrollingDown && atBottom) || (isScrollingUp && atTop)) {
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }
      }
      
      // Block all scroll propagation
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!preventTouch) return;
      const target = e.target as any;
      delete target._scrollableParent;
      delete target._startY;
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  // Re-run whenever ref.current, options, or the element identity changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref.current, allowInternalScroll, preventWheel, preventTouch]);
}

/**
 * Finds the nearest scrollable ancestor element within a container (including the container itself)
 */
function findScrollableParent(element: HTMLElement, container: HTMLElement): HTMLElement | null {
  let current = element;
  
  // Check up to and including the container element
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    const isScrollable = 
      (style.overflowY === 'auto' || style.overflowY === 'scroll' || style.overflowY === 'overlay') ||
      (style.overflow === 'auto' || style.overflow === 'scroll' || style.overflow === 'overlay');
    
    if (isScrollable && current.scrollHeight > current.clientHeight) {
      return current;
    }
    
    // Stop after checking the container itself
    if (current === container) {
      break;
    }
    
    current = current.parentElement as HTMLElement;
  }
  
  return null;
}
