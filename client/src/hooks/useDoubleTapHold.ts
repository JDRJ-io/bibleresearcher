import { useRef, useCallback } from 'react';

interface UseDoubleTapHoldOptions {
  onDoubleTap: () => void;
  holdThreshold?: number; // milliseconds to wait before considering it a hold
  doubleTapTimeout?: number; // milliseconds between taps for double tap detection
}

interface TouchInfo {
  startTime: number;
  startX: number;
  startY: number;
}

export function useDoubleTapHold({
  onDoubleTap,
  holdThreshold = 250,
  doubleTapTimeout = 300
}: UseDoubleTapHoldOptions) {
  const lastTapRef = useRef<TouchInfo | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const preventDoubleTapRef = useRef(false);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only handle primary pointer (left mouse button or first touch)
    if (!e.isPrimary) return;

    const currentTime = Date.now();
    const currentX = e.clientX;
    const currentY = e.clientY;

    // Check if this could be the second tap of a double tap
    if (lastTapRef.current) {
      const timeDiff = currentTime - lastTapRef.current.startTime;
      const distance = Math.sqrt(
        Math.pow(currentX - lastTapRef.current.startX, 2) + 
        Math.pow(currentY - lastTapRef.current.startY, 2)
      );

      // If within double tap time window and close to same position
      if (timeDiff <= doubleTapTimeout && distance <= 50) {
        // This is potentially the second tap of a double tap
        isHoldingRef.current = false;
        preventDoubleTapRef.current = false;

        // Set up hold detection timer for the second tap
        holdTimerRef.current = setTimeout(() => {
          // If we reach this point, the second tap is being held down
          isHoldingRef.current = true;
          preventDoubleTapRef.current = true;
        }, holdThreshold);

        // Clear the last tap since we're processing a potential double tap
        lastTapRef.current = null;
        return;
      }
    }

    // This is either a first tap or a new single tap sequence
    lastTapRef.current = {
      startTime: currentTime,
      startX: currentX,
      startY: currentY
    };

    // Clear any existing hold timer
    clearHoldTimer();
    isHoldingRef.current = false;
    preventDoubleTapRef.current = false;

    // Set timeout to clear the last tap if no second tap comes
    setTimeout(() => {
      if (lastTapRef.current && lastTapRef.current.startTime === currentTime) {
        lastTapRef.current = null;
      }
    }, doubleTapTimeout);
  }, [doubleTapTimeout, holdThreshold, clearHoldTimer]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Only handle primary pointer
    if (!e.isPrimary) return;

    // Clear hold timer since pointer is up
    clearHoldTimer();

    // If this was the second tap and we haven't prevented the double tap
    if (lastTapRef.current === null && !preventDoubleTapRef.current && !isHoldingRef.current) {
      // This was a successful double tap (second tap was not held)
      onDoubleTap();
    }

    // Reset state
    isHoldingRef.current = false;
    preventDoubleTapRef.current = false;
  }, [onDoubleTap, clearHoldTimer]);

  const handlePointerCancel = useCallback(() => {
    // Clean up on pointer cancel
    clearHoldTimer();
    lastTapRef.current = null;
    isHoldingRef.current = false;
    preventDoubleTapRef.current = false;
  }, [clearHoldTimer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Only handle primary pointer
    if (!e.isPrimary) return;

    // If we're in a potential double tap sequence and the pointer moves significantly,
    // cancel the double tap detection (this allows for text selection drag)
    if (lastTapRef.current) {
      const distance = Math.sqrt(
        Math.pow(e.clientX - lastTapRef.current.startX, 2) + 
        Math.pow(e.clientY - lastTapRef.current.startY, 2)
      );

      // If moved more than 10 pixels, cancel double tap detection
      if (distance > 10) {
        lastTapRef.current = null;
        clearHoldTimer();
        isHoldingRef.current = false;
        preventDoubleTapRef.current = false;
      }
    }
  }, [clearHoldTimer]);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onPointerMove: handlePointerMove
  };
}