import { useEffect } from "react";
import { useViewportStore } from "@/stores/viewportStore";

/**
 * Hook to monitor reference column width and apply thin column styling
 * When reference column becomes ≤40px wide, verse references rotate vertically
 */
export function useReferenceColumnWidth() {
  // PERF FIX: Consume viewport store to trigger updates on resize
  const viewportW = useViewportStore(s => s.viewportW);
  
  useEffect(() => {
    const monitorReferenceWidth = () => {
      // Get the current adaptive reference width from CSS variable
      const adaptiveRefWidth = getComputedStyle(document.documentElement)
        .getPropertyValue("--adaptive-ref-width")
        .trim();

      if (adaptiveRefWidth) {
        const widthValue = parseInt(adaptiveRefWidth.replace("px", ""));
        // Monitor reference column width (logging removed for performance)

        // Apply thin column class to body when reference column is ≤65px (increased threshold for better readability)
        if (widthValue <= 60) {
          document.body.classList.add("reference-column-thin");

          // Also mark individual reference cells with data attribute
          const refCells = document.querySelectorAll(".cell-ref");
          refCells.forEach((cell) => {
            (cell as HTMLElement).setAttribute("data-width-thin", "true");
          });
        } else {
          document.body.classList.remove("reference-column-thin");

          // Remove data attribute from reference cells
          const refCells = document.querySelectorAll(".cell-ref");
          refCells.forEach((cell) => {
            (cell as HTMLElement).removeAttribute("data-width-thin");
          });
        }
      }
    };

    // Monitor width changes - initial check
    monitorReferenceWidth();

    // Initial check
    monitorReferenceWidth();

    // Listen for column change events instead of polling
    let cleanup: (() => void) | null = null;

    // Set up event listener for column changes
    const handleColumnChange = (detail: any) => {
      if (detail.changeType === "width" || detail.changeType === "multiplier") {
        setTimeout(monitorReferenceWidth, 50);
      }
    };

    // Dynamically import and set up column change signal
    import("./useColumnChangeSignal")
      .then(({ useColumnChangeSignal }) => {
        if (useColumnChangeSignal) {
          const result = useColumnChangeSignal(handleColumnChange);
          if (typeof result === "function") {
            cleanup = result;
          }
        }
      })
      .catch(() => {
        // Fallback if useColumnChangeSignal is not available
        console.log(
          "Column change signal not available, using polling fallback",
        );
      });

    // 🎯 FIX: REMOVED fallback polling interval to prevent infinite loop
    // The viewport store + column change events are sufficient for triggering updates
    // Continuous polling was causing setState loops during render cycles

    // PERF FIX: Removed window.addEventListener - viewport store handles this
    // Monitor will be triggered by viewport store updates via dependency

    return () => {
      // 🎯 FIX: No interval to clear since we removed the fallback polling
      if (cleanup) cleanup();
      // Clean up classes on unmount
      document.body.classList.remove("reference-column-thin");
      const refCells = document.querySelectorAll(".cell-ref");
      refCells.forEach((cell) => {
        (cell as HTMLElement).removeAttribute("data-width-thin");
      });
    };
  }, [viewportW]); // Re-run when viewport width changes from store
}
