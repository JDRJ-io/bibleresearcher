import { useEffect } from 'react';

/**
 * Hook to monitor reference column width and apply thin column styling
 * When reference column becomes ≤40px wide, verse references rotate vertically
 */
export function useReferenceColumnWidth() {
  useEffect(() => {
    const monitorReferenceWidth = () => {
      // Get the current adaptive reference width from CSS variable
      const adaptiveRefWidth = getComputedStyle(document.documentElement)
        .getPropertyValue('--adaptive-ref-width')
        .trim();

      if (adaptiveRefWidth) {
        const widthValue = parseInt(adaptiveRefWidth.replace('px', ''));
        console.log('📐 Reference column width monitoring:', { 
          adaptiveRefWidth, 
          widthValue, 
          isThin: widthValue <= 40 
        });

        // Apply thin column class to body when reference column is ≤40px
        if (widthValue <= 40) {
          document.body.classList.add('reference-column-thin');
          
          // Also mark individual reference cells with data attribute
          const refCells = document.querySelectorAll('.cell-ref');
          refCells.forEach(cell => {
            (cell as HTMLElement).setAttribute('data-width-thin', 'true');
          });
        } else {
          document.body.classList.remove('reference-column-thin');
          
          // Remove data attribute from reference cells
          const refCells = document.querySelectorAll('.cell-ref');
          refCells.forEach(cell => {
            (cell as HTMLElement).removeAttribute('data-width-thin');
          });
        }
      }
    };

    // Monitor width changes - initial check
    monitorReferenceWidth();

    // Initial check
    monitorReferenceWidth();

    // Listen for column change events instead of polling
    const { useColumnChangeSignal } = await import('./useColumnChangeSignal');
    
    // Set up event listener for column changes
    const handleColumnChange = (detail: any) => {
      if (detail.changeType === 'width' || detail.changeType === 'multiplier') {
        setTimeout(monitorReferenceWidth, 50);
      }
    };

    const cleanup = useColumnChangeSignal ? 
      useColumnChangeSignal(handleColumnChange) : 
      null;

    // Fallback: minimal polling only if events aren't working
    const fallbackInterval = setInterval(monitorReferenceWidth, 2000); // Much less frequenty 250ms

    // Also monitor window resize for immediate updates
    const handleResize = () => {
      setTimeout(monitorReferenceWidth, 50); // Small delay for CSS variable updates
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(fallbackInterval);
      if (cleanup) cleanup();
      window.removeEventListener('resize', handleResize);
      // Clean up classes on unmount
      document.body.classList.remove('reference-column-thin');
      const refCells = document.querySelectorAll('.cell-ref');
      refCells.forEach(cell => {
        (cell as HTMLElement).removeAttribute('data-width-thin');
      });
    };
  }, []);
}