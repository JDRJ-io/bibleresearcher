// useNoDiagonalStrict.ts
import { useRef } from 'react';

export function useNoDiagonalStrict() {
  const start = useRef({ x: 0, y: 0 });
  const active = useRef(false);         // TRUE only while dragging
  const scroll = useRef<(dx: number, dy: number) => void>(() => {});

  /* wheel ─────────────────────────────────────────────── */
  function onWheel(e: WheelEvent, apply: (dx: number, dy: number) => void) {
    const { deltaX: dx, deltaY: dy } = e;
    (Math.abs(dx) > Math.abs(dy) ? apply(dx, 0) : apply(0, dy));
    e.preventDefault();                           // ✓ stop browser diagonal
  }

  /* pointer (touch / mouse drag) ──────────────────────── */
  function onPointerDown(
    e: PointerEvent,
    apply: (dx: number, dy: number) => void
  ) {
    if (e.pointerType === 'mouse' && e.buttons !== 1) return;  // ignore hover
    active.current = true;
    start.current = { x: e.clientX, y: e.clientY };
    scroll.current = apply;
  }

  function onPointerMove(e: PointerEvent) {
    if (!active.current) return;                // ignore hover moves
    const dx = start.current.x - e.clientX;
    const dy = start.current.y - e.clientY;

    (Math.abs(dx) > Math.abs(dy) ? scroll.current(dx, 0) : scroll.current(0, dy));

    start.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();                         // ✓ stop native pan
  }

  function onPointerUp() {
    active.current = false;
  }

  return { onWheel, onPointerDown, onPointerMove, onPointerUp };
}