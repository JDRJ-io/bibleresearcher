import { useRef, useEffect } from 'react';

/**
 * Optimized element hook for theme-aware components
 * Eliminates memory leaks from MutationObserver and reduces DOM manipulation
 */
export function useElement(theme: string) {
  const element = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const elem = element.current;
    if (!elem) return;
    
    // Simple class update without mutation observer
    // The theme is managed globally, so individual elements don't need observers
    elem.setAttribute('data-theme', theme);
    
    // Cleanup function (no observer to disconnect)
    return () => {
      if (elem) {
        elem.removeAttribute('data-theme');
      }
    };
  }, [theme]);
  
  return element;
}

/**
 * Performance-optimized theme-aware element hook
 * Use this for components that need minimal theme integration
 */
export function useMinimalThemeElement() {
  const element = useRef<HTMLElement>(null);
  
  // No theme-specific logic - relies on CSS variables only
  // This reduces memory footprint for simple components
  return element;
}