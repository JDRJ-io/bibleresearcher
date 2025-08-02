// ScrollAxisClamp.ts   (≈40 lines)
export function clampAxis(el: HTMLElement) {
  let startX = 0, startY = 0, dragging = false;

  const apply = (dx: number, dy: number) => {
    el.scrollLeft += dx;
    el.scrollTop  += dy;
  };

  /* Wheel – capture phase, passive:false so we can preventDefault */
  const wheel = (e: WheelEvent) => {
    const { deltaX: dx, deltaY: dy } = e;
    if (Math.abs(dx) > Math.abs(dy)) apply(dx, 0); else apply(0, dy);
    e.preventDefault();      // kill native 2-D scroll right here
  };

  /* Pointer drag */
  const down = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.buttons !== 1) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = startX - e.clientX;
    const dy = startY - e.clientY;
    if (Math.abs(dx) > Math.abs(dy)) apply(dx, 0); else apply(0, dy);
    startX = e.clientX; startY = e.clientY;
    e.preventDefault();
  };
  const up = (e: PointerEvent) => {
    dragging = false;
    el.releasePointerCapture(e.pointerId);
  };

  /* Attach – capture phase ensures we beat bubbling parents */
  el.addEventListener('wheel', wheel,   { passive:false, capture:true });
  el.addEventListener('pointerdown', down,  { capture:true });
  el.addEventListener('pointermove', move,  { passive:false, capture:true });
  el.addEventListener('pointerup',   up,    { capture:true });
  el.addEventListener('pointercancel', up,  { capture:true });

  return () => {                   // detach helper
    el.removeEventListener('wheel', wheel,   { capture:true } as any);
    el.removeEventListener('pointerdown', down,  { capture:true } as any);
    el.removeEventListener('pointermove', move,  { capture:true } as any);
    el.removeEventListener('pointerup',   up,    { capture:true } as any);
    el.removeEventListener('pointercancel', up,  { capture:true } as any);
  };
}