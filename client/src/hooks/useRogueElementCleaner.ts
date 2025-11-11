import { useEffect } from 'react';

/**
 * Hook to automatically detect and remove rogue overlay elements from browser extensions.
 * ENABLED BY DEFAULT to prevent extension overlays from covering UI components.
 * 
 * Can be disabled via localStorage flag: localStorage.setItem('disableRogueCleaner', 'true')
 * Only removes elements that have BOTH:
 * - Exact height: 1.86024e+06px 
 * - Extension signature (data-original-* attributes)
 */
export function useRogueElementCleaner() {
  useEffect(() => {
    console.log('🛡️ ROGUE CLEANER: Hook starting...');
    
    // Check if rogue cleaner is disabled (enabled by default now)
    const isDisabled = localStorage.getItem('disableRogueCleaner') === 'true';
    
    if (isDisabled) {
      console.log('🛡️ ROGUE CLEANER: Manually disabled (remove localStorage.disableRogueCleaner to re-enable)');
      return;
    }
    
    console.log('🛡️ ROGUE CLEANER: Enabled and running...');
    let removalCount = 0;
    const MAX_REMOVALS_PER_SESSION = 10; // Safety limit
    
    // Function to check if an element is a rogue overlay (UPDATED CRITERIA)
    const isRogueElement = (el: Element): boolean => {
      // SAFETY FIRST: Never touch React, Radix, DnD elements, or app root
      const rootElement = document.getElementById('root');
      if (el.hasAttribute('data-reactroot') || 
          el.id.startsWith('react-') ||
          (el.className && el.className.toString().includes('react-')) ||
          el.hasAttribute('role') && el.getAttribute('role') === 'dialog' ||
          el.hasAttribute('data-radix-portal') ||
          el.hasAttribute('data-state') ||
          (el.className && (el.className.toString().includes('dnd-kit') || 
                           el.className.toString().includes('radix'))) ||
          (rootElement && (el.contains(rootElement) || rootElement.contains(el)))) {
        return false;
      }
      
      const style = el.getAttribute('style') || '';
      const computedStyle = window.getComputedStyle(el);
      
      // PATTERN 1: Original problematic height with extension signature
      const hasExactHeight = style.includes('height: 1.86024e+06px');
      const hasExtensionSignature = el.hasAttribute('data-original-style') || 
                                   el.hasAttribute('data-original-text') ||
                                   el.hasAttribute('data-extension-id');
      
      // PATTERN 2: Canvas overlay with fixed position and high z-index (NEW TARGET)
      // Exclude legitimate confetti canvas by checking for whitelist attribute
      const isCanvasOverlay = el.tagName === 'CANVAS' &&
                             computedStyle.position === 'fixed' &&
                             style.includes('inset: 0px') &&
                             computedStyle.zIndex === '10000' &&
                             style.includes('pointer-events: none') &&
                             !el.hasAttribute('data-confetti-canvas'); // Whitelist confetti
      
      if (hasExactHeight && hasExtensionSignature) {
        console.log('🎯 PATTERN 1 MATCH: Found element with exact height AND extension signature');
        return true;
      }
      
      if (isCanvasOverlay) {
        console.log('🎯 PATTERN 2 MATCH: Found canvas overlay with fixed position and z-index 10000');
        return true;
      }
      
      return false;
    };
    
    // Function to automatically find and remove rogue elements
    const findAndRemoveRogueElements = (): number => {
      if (removalCount >= MAX_REMOVALS_PER_SESSION) {
        console.warn('🛡️ SAFETY LIMIT: Reached maximum removals per session, auto-disabled');
        return 0;
      }
      
      const allElements = document.querySelectorAll('*');
      let removedThisRun = 0;
      
      allElements.forEach((el) => {
        if (isRogueElement(el)) {
          try {
            console.log('🗑️ AUTO-REMOVAL: Removing rogue extension overlay', {
              tagName: el.tagName,
              style: el.getAttribute('style'),
              hasExtensionAttributes: {
                'data-original-style': el.hasAttribute('data-original-style'),
                'data-original-text': el.hasAttribute('data-original-text'),
                'data-extension-id': el.hasAttribute('data-extension-id')
              }
            });
            
            el.remove();
            removedThisRun++;
            removalCount++;
            
            // Trigger layout recalculation after removal
            window.dispatchEvent(new Event('resize'));
            window.dispatchEvent(new CustomEvent('rogueOverlayRemoved', {
              detail: { removedCount: removalCount, element: el.tagName }
            }));
            
          } catch (error) {
            console.warn('🛡️ AUTO-REMOVAL failed:', error);
          }
        }
      });
      
      if (removedThisRun > 0) {
        console.log(`✅ AUTO-REMOVED ${removedThisRun} rogue elements (total: ${removalCount})`);
      }
      
      return removedThisRun;
    };
    
    // Initial automatic removal
    console.log('🛡️ ROGUE CLEANER: Starting automatic detection and removal...');
    findAndRemoveRogueElements();
    
    // Set up MutationObserver to catch reinjections
    let removalTimeout: NodeJS.Timeout;
    const observer = new MutationObserver((mutations) => {
      let hasAdditions = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          hasAdditions = true;
        }
      });
      
      if (hasAdditions) {
        // Debounce to avoid excessive scanning
        clearTimeout(removalTimeout);
        removalTimeout = setTimeout(() => {
          const removed = findAndRemoveRogueElements();
          if (removed > 0) {
            console.log('🛡️ REINJECTION DETECTED: Removed additional rogue elements');
          }
        }, 200);
      }
    });
    
    // Observe DOM changes
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // Expose stats and manual controls globally
    (window as any).__rogueCleanerStats = {
      removedCount: () => removalCount,
      maxRemovals: MAX_REMOVALS_PER_SESSION,
      forceDisable: () => localStorage.setItem('disableRogueCleaner', 'true'),
      manualScan: () => findAndRemoveRogueElements()
    };
    
    // Cleanup
    return () => {
      observer.disconnect();
      clearTimeout(removalTimeout);
      delete (window as any).__rogueCleanerStats;
    };
  }, []);
}