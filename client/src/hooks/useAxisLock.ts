// useAxisLock.ts
import { useRef } from 'react';

export function useAxisLock() {
  const axis = useRef<null | 'x' | 'y'>(null);
  const wheelTimer = useRef<number>();

  function detectAxis(dx: number, dy: number) {
    if (!axis.current) {
      axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
  }

  function clearAxis() {
    axis.current = null;
  }

  /** Wheel handler */
  function onWheel(e: WheelEvent, applyScroll: (dx: number, dy: number) => void) {
    detectAxis(e.deltaX, e.deltaY);

    if (axis.current === 'x') applyScroll(e.deltaX, 0);
    else                      applyScroll(0, e.deltaY);

    // reset after 100 ms of silence
    window.clearTimeout(wheelTimer.current);
    wheelTimer.current = window.setTimeout(clearAxis, 100);
  }

  /** Pointer drag handler trio */
  let startX = 0, startY = 0;
  function onPointerDown(e: PointerEvent) {
    startX = e.clientX; startY = e.clientY; axis.current = null;
  }
  function onPointerMove(e: PointerEvent, applyScroll: (dx: number, dy: number) => void) {
    const dx = startX - e.clientX;
    const dy = startY - e.clientY;
    detectAxis(dx, dy);

    if (axis.current === 'x') applyScroll(dx, 0);
    else                      applyScroll(0, dy);

    startX = e.clientX; startY = e.clientY;
  }
  function onPointerUp() { clearAxis(); }

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}