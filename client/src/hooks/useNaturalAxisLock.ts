import { useEffect, useRef } from "react";

type Axis = "x" | "y" | null;

interface Options {
  dominanceRatio?: number; // how much stronger one axis must be to lock
  wheelUnlockMs?: number;  // idle ms to reset after wheel burst
  gestureThreshold?: number; // min pixels before deciding
}

export function useNaturalAxisLock<T extends HTMLElement>(
  ref: React.RefObject<T>,
  { dominanceRatio = 1.2, wheelUnlockMs = 90, gestureThreshold = 5 }: Options = {}
) {
  const axisRef = useRef<Axis>(null);

  // ----- TOUCH -----
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0,
      startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      axisRef.current = null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (axisRef.current) return;

      const t = e.touches[0];
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);

      if (dx < gestureThreshold && dy < gestureThreshold) return;

      if (dx > dy * dominanceRatio) {
        axisRef.current = "x";
      } else if (dy > dx * dominanceRatio) {
        axisRef.current = "y";
      }
    };

    const onTouchEnd = () => {
      axisRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart as any);
      el.removeEventListener("touchmove", onTouchMove as any);
      el.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [ref, dominanceRatio, gestureThreshold]);

  // ----- WHEEL -----
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let accX = 0,
      accY = 0;
    let timer: number | null = null;

    const reset = () => {
      axisRef.current = null;
      accX = accY = 0;
    };

    const scheduleReset = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(reset, wheelUnlockMs);
    };

    const onWheel = (e: WheelEvent) => {
      if (axisRef.current) {
        scheduleReset();
        return;
      }

      accX += Math.abs(e.deltaX);
      accY += Math.abs(e.deltaY);

      if (accX > accY * dominanceRatio) {
        axisRef.current = "x";
      } else if (accY > accX * dominanceRatio) {
        axisRef.current = "y";
      }

      scheduleReset();
    };

    el.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel as any);
      if (timer) clearTimeout(timer);
    };
  }, [ref, dominanceRatio, wheelUnlockMs]);
}