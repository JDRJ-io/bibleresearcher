import { useEffect } from "react";
import { useViewportStore } from "@/stores/viewportStore";

// Expert's lightweight pattern: CSS-first adaptive widths
// Keeps --vw-free accurate on every resize/orientation change
// PERF FIX: Use viewport store instead of window event listeners
export function useAdaptiveWidths() {
  // PERF FIX: Consume viewport store instead of creating listeners
  const viewportW = useViewportStore(s => s.viewportW);
  
  useEffect(() => {
    const root = document.documentElement;
    const refW = 72;                         // keep in sync with CSS --ref-w
    root.style.setProperty("--vw-free", `${viewportW - refW}px`);
    
    console.log('🎯 Expert Adaptive Widths:', {
      viewport: viewportW,
      refWidth: refW,
      freeSpace: viewportW - refW,
      mainXrefWidth: (viewportW - refW) / 2
    });
  }, [viewportW]); // Update when viewport width changes from store
}