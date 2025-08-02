import { useEffect } from "react";

// Expert's lightweight pattern: CSS-first adaptive widths
// Keeps --vw-free accurate on every resize/orientation change
export function useAdaptiveWidths() {
  useEffect(() => {
    const root = document.documentElement;
    
    function setWidths() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isPortrait = vh > vw;
      
      if (isPortrait) {
        // Portrait handled by adaptive system - no CSS variables needed
        const refW = 72;
        root.style.setProperty("--vw-free", `${vw - refW}px`);
      } else {
        // Landscape - set unified CSS variables for consistent sizing
        root.style.setProperty("--unified-ref-width", "80px");
        root.style.setProperty("--unified-main-width", "320px");
        root.style.setProperty("--unified-cross-width", "320px");
        root.style.setProperty("--unified-alt-width", "320px");
        root.style.setProperty("--unified-prophecy-width", "180px");
        root.style.setProperty("--unified-notes-width", "280px");
        root.style.setProperty("--unified-context-width", "200px");
      }
      
      console.log('🎯 Unified Adaptive Widths:', {
        viewport: `${vw}×${vh}`,
        mode: isPortrait ? 'Portrait' : 'Landscape',
        refWidth: isPortrait ? '72px (adaptive)' : '80px (CSS var)'
      });
    }

    setWidths();
    window.addEventListener("resize", setWidths);
    window.addEventListener("orientationchange", setWidths);
    
    return () => {
      window.removeEventListener("resize", setWidths);
      window.removeEventListener("orientationchange", setWidths);
    };
  }, []);
}