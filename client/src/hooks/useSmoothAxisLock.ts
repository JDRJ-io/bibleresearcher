import { useEffect, useRef } from "react";

type Axis = "x" | "y" | null;

interface Options {
  dominanceRatio?: number;   // axis dominance threshold (e.g., 1.2 = 20% stronger)
  wheelUnlockMs?: number;    // release wheel lock after idle (ms)
  momentum?: boolean;        // enable kinetic scroll on touch
  momentumDecay?: number;    // 0..1 per ms exponential decay factor (~0.002 – 0.005)
  momentumMinVelocity?: number; // px/ms cutoff to start momentum
  momentumMaxDuration?: number; // ms safety cap
}

export function useSmoothAxisLock<T extends HTMLElement>(
  ref: React.RefObject<T>,
  {
    dominanceRatio = 1.2,
    wheelUnlockMs = 160,
    momentum = true,
    momentumDecay = 0.003,
    momentumMinVelocity = 0.05,   // ~50 px/s
    momentumMaxDuration = 1200,   // 1.2s cap
  }: Options = {}
) {
  const axisRef = useRef<Axis>(null);

  // --- Momentum state (touch only) ---
  const rafId = useRef<number | null>(null);
  const momentumV = useRef<number>(0);          // px/ms along active axis
  const lastTS = useRef<number>(0);             // ms timestamp for raf integration
  const momentumStartTS = useRef<number>(0);    // when momentum started (cap duration)

  const stopMomentum = () => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    momentumV.current = 0;
  };

  const startMomentum = (el: HTMLElement, axis: Axis, v0: number) => {
    if (!momentum || axis === null) return;
    if (Math.abs(v0) < momentumMinVelocity) return;

    stopMomentum();
    momentumV.current = v0;
    momentumStartTS.current = performance.now();
    lastTS.current = momentumStartTS.current;

    const step = (ts: number) => {
      const dt = ts - lastTS.current; // ms
      lastTS.current = ts;

      // exponential decay: v = v * e^(-k*dt)
      const k = momentumDecay;
      const v = momentumV.current * Math.exp(-k * dt);
      momentumV.current = v;

      const dx = v * dt; // px

      if (axis === "x") {
        const prev = el.scrollLeft;
        el.scrollLeft += dx;
        // stop if we hit edges (no movement)
        if (el.scrollLeft === prev) return; 
      } else {
        const prev = el.scrollTop;
        el.scrollTop += dx;
        if (el.scrollTop === prev) return;
      }

      const elapsed = ts - momentumStartTS.current;
      if (Math.abs(v) < momentumMinVelocity || elapsed > momentumMaxDuration) {
        stopMomentum();
        return;
      }
      rafId.current = requestAnimationFrame(step);
    };

    rafId.current = requestAnimationFrame(step);
  };

  // ============ TOUCH ============
  const touchLast = useRef<{ x: number; y: number; t: number } | null>(null);
  // Keep a small velocity window (last ~50–80ms)
  const velSamples = useRef<Array<{ v: number; t: number }>>([]); // velocity along active axis

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      stopMomentum();       // interrupt momentum on new touch
      const t = e.touches[0];
      touchLast.current = { x: t.clientX, y: t.clientY, t: performance.now() };
      axisRef.current = null;
      velSamples.current = [];
    };

    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!touchLast.current) return;

      const now = performance.now();
      const dt = Math.max(1, now - touchLast.current.t); // ms
      const dx = t.clientX - touchLast.current.x;
      const dy = t.clientY - touchLast.current.y;

      // choose/flip axis by dominance
      if (
        !axisRef.current ||
        Math.abs(dx) > Math.abs(dy) * dominanceRatio ||
        Math.abs(dy) > Math.abs(dx) * dominanceRatio
      ) {
        axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        velSamples.current = []; // reset window on flip to avoid bogus velocity
      }

      e.preventDefault(); // own the gesture, avoid diagonal/native
      if (axisRef.current === "x") {
        el.scrollLeft -= dx;
        // velocity along X in px/ms (negative because scrollLeft-=dx)
        const vx = (-dx) / dt;
        velSamples.current.push({ v: vx, t: now });
      } else {
        el.scrollTop -= dy;
        const vy = (-dy) / dt;
        velSamples.current.push({ v: vy, t: now });
      }

      // keep last ~80ms of samples
      const cutoff = now - 80;
      velSamples.current = velSamples.current.filter(s => s.t >= cutoff);

      touchLast.current = { x: t.clientX, y: t.clientY, t: now };
    };

    const onEnd = () => {
      // compute average velocity over last window
      if (!momentum || !axisRef.current) {
        axisRef.current = null;
        touchLast.current = null;
        velSamples.current = [];
        return;
      }
      const samples = velSamples.current;
      if (!samples.length) {
        axisRef.current = null;
        touchLast.current = null;
        return;
      }
      const avgV = samples.reduce((a, s) => a + s.v, 0) / samples.length;
      const axis = axisRef.current;
      axisRef.current = null;
      touchLast.current = null;
      velSamples.current = [];
      startMomentum(el, axis, avgV);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onStart as any);
      el.removeEventListener("touchmove", onMove as any);
      el.removeEventListener("touchend", onEnd as any);
      el.removeEventListener("touchcancel", onEnd as any);
    };
  }, [ref, dominanceRatio, momentum, momentumDecay, momentumMinVelocity, momentumMaxDuration]);

  // ============ WHEEL ============
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let accX = 0, accY = 0;
    let timer: number | null = null;

    const reset = () => {
      axisRef.current = null;
      accX = accY = 0;
    };

    const scheduleReset = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        reset();
        timer = null;
      }, wheelUnlockMs);
    };

    const onWheel = (e: WheelEvent) => {
      // wheel delivers its own momentum as a stream of events; don't fake more
      if (!axisRef.current) {
        accX += Math.abs(e.deltaX);
        accY += Math.abs(e.deltaY);

        if (accX > accY * dominanceRatio || accY > accX * dominanceRatio) {
          axisRef.current = accX >= accY ? "x" : "y";
        } else {
          // undecided: allow native diagonal until dominance is clear
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

  // Interrupt momentum on pointer down inside the element (mouse/touch)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kill = () => stopMomentum();
    el.addEventListener("mousedown", kill, { passive: true });
    el.addEventListener("touchstart", kill, { passive: true });
    return () => {
      el.removeEventListener("mousedown", kill as any);
      el.removeEventListener("touchstart", kill as any);
    };
  }, [ref]);
}