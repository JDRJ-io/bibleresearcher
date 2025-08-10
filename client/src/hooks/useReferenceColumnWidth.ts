import { useEffect, useRef } from 'react';
import { log } from '@/utils/logger';

/**
 * Hook to monitor reference column width and apply thin column styling
 * When reference column becomes ≤40px wide, verse references rotate vertically
 */
export function useReferenceColumnWidth() {
  const lastWidthRef = useRef<number | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const applyWidthStyling = (widthValue: number) => {
      // Only apply changes if width actually changed
      if (lastWidthRef.current === widthValue) return;
      
      lastWidthRef.current = widthValue;
      
      log.debug('useReferenceColumnWidth', () => ({ 
        adaptiveRefWidth: `${widthValue}px`, 
        widthValue, 
        isThin: widthValue <= 40 
      }));

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
    };

    const startMonitoring = () => {
      // Find reference column container - look for element with CSS variable
      const rootEl = document.documentElement;
      
      // Get initial width from CSS variable
      const adaptiveRefWidth = getComputedStyle(rootEl)
        .getPropertyValue('--adaptive-ref-width')
        .trim();

      if (adaptiveRefWidth) {
        const initialWidth = parseInt(adaptiveRefWidth.replace('px', ''));
        applyWidthStyling(initialWidth);
      }

      // Use ResizeObserver on document element to detect CSS variable changes
      // This is more efficient than polling
      observerRef.current = new ResizeObserver(() => {
        // Re-read CSS variable when layout changes
        const currentRefWidth = getComputedStyle(rootEl)
          .getPropertyValue('--adaptive-ref-width')
          .trim();
          
        if (currentRefWidth) {
          const currentWidth = parseInt(currentRefWidth.replace('px', ''));
          applyWidthStyling(currentWidth);
        }
      });

      observerRef.current.observe(rootEl);
    };

    // Start monitoring after a brief delay to ensure DOM is ready
    const timeoutId = setTimeout(startMonitoring, 100);

    // Also monitor window resize for immediate updates
    const handleResize = () => {
      setTimeout(() => {
        const adaptiveRefWidth = getComputedStyle(document.documentElement)
          .getPropertyValue('--adaptive-ref-width')
          .trim();
          
        if (adaptiveRefWidth) {
          const widthValue = parseInt(adaptiveRefWidth.replace('px', ''));
          applyWidthStyling(widthValue);
        }
      }, 50); // Small delay for CSS variable updates
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      observerRef.current?.disconnect();
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