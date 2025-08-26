import { useEffect, useRef } from "react";

type Axis = "x" | "y" | null;

interface Options {
  dominanceRatio?: number; // how much stronger one axis must be to win
  wheelUnlockMs?: number;  // reset delay for wheel bursts
}

export function useSmoothAxisLock<T extends HTMLElement>(
  ref: React.RefObject<T>,
  { dominanceRatio = 1.2, wheelUnlockMs = 160 }: Options = {}
) {
  const axisRef = useRef<Axis>(null);

  // ============ TOUCH ============
  const touchLast = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchLast.current = { x: t.clientX, y: t.clientY };
      axisRef.current = null; // reset per gesture
    };

    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!touchLast.current) return;

      const dx = t.clientX - touchLast.current.x;
      const dy = t.clientY - touchLast.current.y;

      // Pick or flip axis based on dominance
      if (
        !axisRef.current ||
        Math.abs(dx) > Math.abs(dy) * dominanceRatio ||
        Math.abs(dy) > Math.abs(dx) * dominanceRatio
      ) {
        axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      e.preventDefault(); // kill diagonal scroll
      if (axisRef.current === "x") el.scrollLeft -= dx;
      else el.scrollTop -= dy;

      touchLast.current = { x: t.clientX, y: t.clientY };
    };

    const onEnd = () => {
      axisRef.current = null;
      touchLast.current = null;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart as any);
      el.removeEventListener("touchmove", onMove as any);
      el.removeEventListener("touchend", onEnd as any);
    };
  }, [ref, dominanceRatio]);

  // ============ WHEEL ============
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let accX = 0,
      accY = 0,
      timer: number | null = null;

    const reset = () => {
      axisRef.current = null;
      accX = accY = 0;
      if (timer) clearTimeout(timer);
      timer = null;
    };

    const scheduleReset = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(reset, wheelUnlockMs);
    };

    const onWheel = (e: WheelEvent) => {
      if (!axisRef.current) {
        accX += Math.abs(e.deltaX);
        accY += Math.abs(e.deltaY);

        if (
          accX > accY * dominanceRatio ||
          accY > accX * dominanceRatio
        ) {
          axisRef.current = accX >= accY ? "x" : "y";
        } else {
          // Still undecided → let browser handle diagonal until clear
          scheduleReset();
          return;
        }
      }

      e.preventDefault();
      if (axisRef.current === "x") {
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        el.scrollLeft += delta;
      } else {
        const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
        el.scrollTop += delta;
      }

      scheduleReset();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel as any);
      if (timer) clearTimeout(timer);
    };
  }, [ref, dominanceRatio, wheelUnlockMs]);

  // ============ KEYBOARD ============
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onKey = (e: KeyboardEvent) => {
      if (!el.contains(document.activeElement)) return;

      switch (e.key) {
        case "ArrowRight": el.scrollLeft += 40; e.preventDefault(); break;
        case "ArrowLeft":  el.scrollLeft -= 40; e.preventDefault(); break;
        case "ArrowDown":  el.scrollTop += 40; e.preventDefault(); break;
        case "ArrowUp":    el.scrollTop -= 40; e.preventDefault(); break;
        case "PageDown":   el.scrollTop += el.clientHeight * 0.8; e.preventDefault(); break;
        case "PageUp":     el.scrollTop -= el.clientHeight * 0.8; e.preventDefault(); break;
        case "Home":       el.scrollTop = 0; e.preventDefault(); break;
        case "End":        el.scrollTop = el.scrollHeight; e.preventDefault(); break;
      }
    };

    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey as any);
  }, [ref]);
}