import { useEffect } from "react";

// Expert's lightweight pattern: CSS-first adaptive widths
// Keeps --vw-free accurate on every resize/orientation change
export function useAdaptiveWidths() {
  useEffect(() => {
    const root = document.documentElement;
    
    function setWidths() {
      const vw = window.innerWidth;            // full viewport width
      const refW = 72;                         // keep in sync with CSS --ref-w
      root.style.setProperty("--vw-free", `${vw - refW}px`);
      
      console.log('🎯 Expert Adaptive Widths:', {
        viewport: vw,
        refWidth: refW,
        freeSpace: vw - refW,
        mainXrefWidth: (vw - refW) / 2
      });
    }

    setWidths();                               // run once on mount
    window.addEventListener("resize", setWidths);
    window.addEventListener("orientationchange", setWidths);
    
    return () => {
      window.removeEventListener("resize", setWidths);
      window.removeEventListener("orientationchange", setWidths);
    };
  }, []);
}