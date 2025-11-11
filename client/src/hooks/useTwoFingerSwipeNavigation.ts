import { useRef, useEffect } from 'react';

interface SwipeActions {
  canShiftLeft: () => boolean;
  canShiftRight: () => boolean;
  shiftLeft: () => void;
  shiftRight: () => void;
}

interface TrackpadOptions {
  minHorizontalDelta?: number;
  debounceMs?: number;
  horizontalDominanceRatio?: number;
}

export function useTwoFingerSwipeNavigation<T extends HTMLElement>(
  containerRef: React.RefObject<T>,
  { 
    minHorizontalDelta = 30, 
    debounceMs = 300, // Longer cooldown to prevent multiple triggers
    horizontalDominanceRatio = 2.0 // More strict requirement
  }: TrackpadOptions = {},
  actions: SwipeActions
) {
  const lastGestureTimeRef = useRef<number>(0);
  const accumulatedDeltaXRef = useRef<number>(0);
  const lastNavigationTimeRef = useRef<number>(0);
  
  const { canShiftLeft, canShiftRight, shiftLeft, shiftRight } = actions;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      
      // Prevent rapid successive navigation (cooldown period)
      if (now - lastNavigationTimeRef.current < 400) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Reset accumulated delta if too much time has passed
      if (now - lastGestureTimeRef.current > debounceMs) {
        accumulatedDeltaXRef.current = 0;
      }
      
      // Check if this is a horizontal gesture (trackpad two-finger swipe)
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      
      // Only process horizontal gestures where horizontal movement dominates
      const isHorizontalDominant = absX > absY * horizontalDominanceRatio;
      
      if (isHorizontalDominant && absX > 0) {
        // Accumulate horizontal movement
        accumulatedDeltaXRef.current += e.deltaX;
        lastGestureTimeRef.current = now;
        
        // Check if we've accumulated enough movement to trigger navigation
        if (Math.abs(accumulatedDeltaXRef.current) >= minHorizontalDelta) {
          const direction = accumulatedDeltaXRef.current > 0 ? 'right' : 'left';
          
          // Reset accumulator and set navigation cooldown
          accumulatedDeltaXRef.current = 0;
          lastNavigationTimeRef.current = now;
          
          // Execute navigation with CORRECTED direction mapping
          if (direction === 'right') {
            // Swipe right = move right (show next column)
            if (canShiftRight()) {
              shiftRight();
              e.preventDefault();
              e.stopPropagation();
            }
          } else {
            // Swipe left = move left (show previous column)
            if (canShiftLeft()) {
              shiftLeft();
              e.preventDefault();
              e.stopPropagation();
            }
          }
        } else {
          // Still accumulating, prevent default to avoid unwanted scrolling
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    // Add wheel event listener with capture to intercept before other handlers
    container.addEventListener('wheel', handleWheel, { 
      passive: false, 
      capture: true 
    });

    return () => {
      container.removeEventListener('wheel', handleWheel, true);
    };
  }, [containerRef, minHorizontalDelta, debounceMs, horizontalDominanceRatio, canShiftLeft, canShiftRight, shiftLeft, shiftRight]);
}