/**
 * Cross-browser dynamic viewport height utility
 * Handles iOS Safari collapsing bars, keyboard detection, and safe areas
 */

let lastHeight = window.innerHeight;

export function setupDynamicViewport() {
  const root = document.documentElement;

  // Feature-detect dvh support
  const supportsDVH = CSS.supports('height', '100dvh');
  
  if (supportsDVH) {
    root.classList.add('has-dvh');
  }

  // Keyboard-aware viewport height calculation
  // Ignores viewport shrinks that are likely due to keyboard (>100px sudden shrink)
  function setVHStable() {
    const currentHeight = window.visualViewport?.height || window.innerHeight;
    const heightDiff = Math.abs(currentHeight - lastHeight);
    const keyboardLikely = heightDiff > 100 && currentHeight < lastHeight;
    
    // Only update if not a keyboard event
    // Keyboards typically shrink viewport by 200-400px, so we skip those updates
    if (!keyboardLikely) {
      root.style.setProperty('--vh-px', `${Math.round(currentHeight)}px`);
      lastHeight = currentHeight;
    }
  }

  // Initial setup
  setVHStable();

  // Listen for viewport changes
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setVHStable);
  }
  
  window.addEventListener('resize', setVHStable);
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure accurate measurements after orientation change
    setTimeout(setVHStable, 250);
  });

  // Cleanup function
  return () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', setVHStable);
    }
    window.removeEventListener('resize', setVHStable);
  };
}
