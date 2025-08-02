// useNoDiagonal.ts
import { useRef } from 'react';

export function useNoDiagonal() {
  let lastX = 0, lastY = 0;

  /** Wheel */
  function onWheel(e: WheelEvent, apply: (dx: number, dy: number) => void) {
    const { deltaX: dx, deltaY: dy } = e;
    (Math.abs(dx) > Math.abs(dy))
      ? apply(dx, 0)
      : apply(0, dy);
    e.preventDefault();          // keeps the browser from "helping"
  }

  /** Pointer drag trio */
  function onPointerDown(e: PointerEvent) {
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function onPointerMove(e: PointerEvent, apply: (dx:number,dy:number)=>void) {
    const dx = lastX - e.clientX;
    const dy = lastY - e.clientY;
    (Math.abs(dx) > Math.abs(dy))
      ? apply(dx, 0)
      : apply(0, dy);
    lastX = e.clientX;
    lastY = e.clientY;
  }
  function onPointerUp() { /* nothing to reset */ }

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}