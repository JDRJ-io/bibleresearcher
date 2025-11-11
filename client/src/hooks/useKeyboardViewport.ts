import { useEffect, useState } from "react";

export function useKeyboardViewport(enabled: boolean) {
  const [vvh, setVvh] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 0
  );

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.visualViewport) return;

    const vv = window.visualViewport;
    let last = Math.round(vv.height);
    let raf = 0;

    const onChange = () => {
      const next = Math.round(vv.height);
      // Ignore micro-changes to avoid thrash (and layout-triggered noise)
      if (Math.abs(next - last) < 4) return;
      last = next;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setVvh(next));
    };

    // Initial call
    onChange();

    vv.addEventListener("resize", onChange, { passive: true } as AddEventListenerOptions);
    vv.addEventListener("scroll", onChange, { passive: true } as AddEventListenerOptions);

    return () => {
      vv.removeEventListener("resize", onChange);
      vv.removeEventListener("scroll", onChange);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  return { vvh };
}
