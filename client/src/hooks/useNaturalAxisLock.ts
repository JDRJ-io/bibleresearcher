import { useEffect, useRef } from "react";

type Axis = "x" | "y" | null;

interface Options {
  dominanceRatio?: number; // how much stronger one axis must be to lock
  wheelUnlockMs?: number;  // idle ms to reset after wheel burst
  gestureThreshold?: number; // min pixels before deciding
}

export function useNaturalAxisLock<T extends HTMLElement>(
  ref: React.RefObject<T>,
  { dominanceRatio = 1.2, wheelUnlockMs = 160, gestureThreshold = 8 }: Options = {}
) {
  const axisRef = useRef<Axis>(null);

  const setAxisOverflow = (el: HTMLElement, axis: Axis | null) => {
    if (!el) return;
    if (!axis) {
      el.style.overflowX = "";
      el.style.overflowY = "";
    } else if (axis === "x") {
      el.style.overflowX = "auto";
      el.style.overflowY = "hidden";
    } else {
      el.style.overflowX = "hidden";
      el.style.overflowY = "auto";
    }
  };

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
      setAxisOverflow(el, null);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (axisRef.current) return; // already locked

      const t = e.touches[0];
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);

      if (dx < gestureThreshold && dy < gestureThreshold) return; // not enough yet

      if (dx > dy * dominanceRatio) {
        axisRef.current = "x";
      } else if (dy > dx * dominanceRatio) {
        axisRef.current = "y";
      }

      setAxisOverflow(el, axisRef.current);
    };

    const onTouchEnd = () => {
      axisRef.current = null;
      setAxisOverflow(el, null); // free both axes
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
      setAxisOverflow(el, null);
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
        setAxisOverflow(el, "x");
      } else if (accY > accX * dominanceRatio) {
        axisRef.current = "y";
        setAxisOverflow(el, "y");
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