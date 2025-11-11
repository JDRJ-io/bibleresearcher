import { useEffect, useRef } from "react";

interface SwipeOptions {
  minSwipeDistance?: number;
  maxVerticalDeviation?: number;
  swipeTimeout?: number;
}

interface SwipeActions {
  canShiftLeft: () => boolean;
  canShiftRight: () => boolean;
  shiftLeft: () => void;
  shiftRight: () => void;
}

export function useColumnSwipeNavigation<T extends HTMLElement>(
  containerRef: React.RefObject<T>,
  { 
    minSwipeDistance = 80, 
    maxVerticalDeviation = 100, 
    swipeTimeout = 300 
  }: SwipeOptions = {},
  actions: SwipeActions
) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const horizontalIntentRef = useRef<boolean>(false);
  
  const { canShiftLeft, canShiftRight, shiftLeft, shiftRight } = actions;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Guard against multi-touch gestures
      if (e.touches.length !== 1) {
        touchStartRef.current = null;
        horizontalIntentRef.current = false;
        return;
      }
      
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      horizontalIntentRef.current = false;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Reset touch state
      const wasHorizontalIntent = horizontalIntentRef.current;
      touchStartRef.current = null;
      horizontalIntentRef.current = false;

      // Check if this is a valid swipe gesture
      const isValidSwipe = 
        Math.abs(deltaX) > minSwipeDistance &&
        Math.abs(deltaY) < maxVerticalDeviation &&
        deltaTime < swipeTimeout &&
        wasHorizontalIntent; // Only process if we detected horizontal intent

      if (!isValidSwipe) return;

      // Determine swipe direction and execute navigation
      if (deltaX > 0) {
        // Swipe right (show previous column)
        if (canShiftLeft()) {
          shiftLeft();
          e.preventDefault();
        }
      } else {
        // Swipe left (show next column)
        if (canShiftRight()) {
          shiftRight();
          e.preventDefault();
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      
      // Detect horizontal intent early to prevent vertical scroll
      if (!horizontalIntentRef.current && deltaX > 10 && deltaX > deltaY * 1.5) {
        horizontalIntentRef.current = true;
      }
      
      // Suppress vertical scroll when horizontal intent is detected
      if (horizontalIntentRef.current) {
        e.preventDefault();
      }
    };

    // Add event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false }); // Non-passive for preventDefault
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    containerRef, 
    minSwipeDistance, 
    maxVerticalDeviation, 
    swipeTimeout, 
    actions.shiftLeft,
    actions.shiftRight,
    actions.canShiftLeft,
    actions.canShiftRight
  ]);
}