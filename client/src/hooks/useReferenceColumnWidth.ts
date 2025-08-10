import { useEffect } from 'react';

/**
 * Hook to monitor reference column width and apply thin column styling
 * When reference column becomes ≤40px wide, verse references rotate vertically
 */
export function useReferenceColumnWidth() {
  useEffect(() => {
    let lastWidthValue = -1; // Track previous width to avoid unnecessary work
    
    const monitorReferenceWidth = () => {
      // Get the current adaptive reference width from CSS variable
      const adaptiveRefWidth = getComputedStyle(document.documentElement)
        .getPropertyValue('--adaptive-ref-width')
        .trim();

      if (adaptiveRefWidth) {
        const widthValue = parseInt(adaptiveRefWidth.replace('px', ''));
        
        // Only process if width actually changed to prevent rapid firing
        if (widthValue === lastWidthValue) {
          return;
        }
        
        lastWidthValue = widthValue;
        
        // Remove excessive logging that was causing performance issues
        // console.log('📐 Reference column width monitoring:', { 
        //   adaptiveRefWidth, 
        //   widthValue, 
        //   isThin: widthValue <= 40 
        // });

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

    // Reduce frequency to improve performance during scrolling
    const intervalId = setInterval(monitorReferenceWidth, 500); // Check every 500ms instead of 250ms

    // Also monitor window resize for immediate updates
    const handleResize = () => {
      setTimeout(monitorReferenceWidth, 100); // Increased delay for better performance
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearInterval(intervalId);
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