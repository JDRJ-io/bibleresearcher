import { useState, useEffect, useRef } from 'react';
import { useBibleStore } from '@/App';
import { useViewportStore } from '@/stores/viewportStore';
import { logLayout } from '@/lib/layoutDiagnostics';

interface AdaptivePortraitConfig {
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  safeViewportWidth: number;
  coreColumnsWidth: number;
  guaranteedFit: boolean;
  adaptiveWidths: {
    reference: number;
    mainTranslation: number;
    crossReference: number;
    alternate: number;
    prophecy: number;
    notes: number;
    context: number;
  };
}

// UNIFIED COLUMN WIDTH SYSTEM
// Mobile devices (portrait OR landscape): Fill screen with exactly 2 columns, extras scroll horizontally
// Desktop (width > 1024): Use comfortable fixed 320px widths
function calculatePrecisionPortraitWidths(viewportWidth: number, viewportHeight: number, navigableColumnCount: number = 2): AdaptivePortraitConfig['adaptiveWidths'] {
  const isPortrait = viewportHeight > viewportWidth;
  const isMobile = viewportWidth <= 1024;

  // Desktop landscape (width > 1024) - use comfortable fixed widths
  if (!isMobile && !isPortrait) {
    return {
      reference: 72,    // 4.5rem equivalent
      mainTranslation: 320, // 20rem equivalent (w-80)
      crossReference: 320,  // Same as all other columns
      alternate: 320,   // Same as all other columns
      prophecy: 320,    // Same as all other columns
      notes: 320,       // Same as all other columns
      context: 320      // Same as all other columns
    };
  }

  // MOBILE UNIFIED MODE (portrait OR landscape):
  // 1. Keep reference column fixed size
  // 2. Calculate standard column width based on remaining space for exactly 2 columns
  // 3. All additional columns use the SAME width (horizontal scroll for extras)

  // Account for scrollbars, borders, padding - conservative margin
  const safeViewportWidth = viewportWidth - 20; // 10px margin on each side

  // STEP 1: Reference column gets fixed optimal width - SYNC WITH CSS BREAKPOINTS
  let refWidth: number;
  
  if (isPortrait) {
    // Portrait mode reference widths
    if (viewportWidth >= 768 && viewportWidth <= 1024) {
      // Tablet portrait - match CSS breakpoint exactly
      refWidth = 56; // Matches tablet CSS breakpoint
    } else if (viewportWidth <= 640) {
      // Mobile portrait - ultra-compact for reference column
      refWidth = 32; // Compact but readable for "#" header
    } else if (viewportWidth > 640 && viewportWidth < 768) {
      // Large mobile/small tablet transition - make reference column more compact
      refWidth = Math.max(24, Math.min(32, Math.floor(safeViewportWidth * 0.06)));
    } else {
      // Desktop portrait (rare) - use comfortable width
      refWidth = 60;
    }
  } else {
    // Mobile landscape mode reference widths
    if (viewportWidth <= 667) {
      // Small phone landscape (iPhone SE, etc.)
      refWidth = 40;
    } else if (viewportWidth <= 896) {
      // Standard phone landscape (iPhone 11, 12, 13, etc.)
      refWidth = 50;
    } else {
      // Large phone/tablet landscape
      refWidth = 56;
    }
  }

  // STEP 2: Calculate standard column width based on ONLY 2 columns fitting in viewport
  // Additional columns will use this same width and scroll horizontally
  const remainingSpace = safeViewportWidth - refWidth;
  const standardColumnWidth = Math.floor(remainingSpace / 2); // Always divide by 2, not actual column count

  // Ensure minimum readability
  const minColumnWidth = 80;  // Absolute minimum for any navigable column
  
  let finalRef = refWidth;
  let finalColumnWidth = Math.max(minColumnWidth, standardColumnWidth);

  // Only compress if the base 2-column setup doesn't fit
  const baseTwoColumnWidth = finalRef + (finalColumnWidth * 2);
  if (baseTwoColumnWidth > safeViewportWidth) {
    const compressionRatio = safeViewportWidth / baseTwoColumnWidth;
    finalRef = Math.floor(finalRef * compressionRatio);
    finalColumnWidth = Math.floor(finalColumnWidth * compressionRatio);
  }

  return {
    reference: finalRef,
    mainTranslation: finalColumnWidth,
    crossReference: finalColumnWidth,
    alternate: finalColumnWidth,     // Same width as all other columns
    prophecy: finalColumnWidth,      // Same width as all other columns
    notes: finalColumnWidth,         // Same width as all other columns  
    context: (isPortrait && viewportWidth <= 640) ? 0 : finalColumnWidth  // Hide context only in small mobile portrait mode
  };
}

export function useAdaptivePortraitColumns(): AdaptivePortraitConfig {
  // PERF FIX: Use viewport store instead of window event listeners
  const viewportW = useViewportStore(s => s.viewportW);
  const viewportH = useViewportStore(s => s.viewportH);
  
  // Get navigable column count from store
  const navigableColumns = useBibleStore((s) => s.navigableColumns) as string[];
  const navigableColumnCount = navigableColumns.length || 2;
  
  // Get column width multiplier from store to apply to reference column
  const columnWidthMult = useBibleStore(state => state.sizeState.externalSizeMult);

  // Track previous width values to prevent unnecessary event dispatches
  const prevWidthsRef = useRef<AdaptivePortraitConfig['adaptiveWidths'] | null>(null);
  
  // Track previous navigable column count to detect config changes
  const prevNavCountRef = useRef<number>(navigableColumnCount);

  const [config, setConfig] = useState<AdaptivePortraitConfig>(() => {
    if (typeof window === 'undefined') {
      // SSR fallback - assume iPhone SE dimensions
      const fallbackWidths = calculatePrecisionPortraitWidths(375, 667, 2);
      return {
        isPortrait: true,
        screenWidth: 375,
        screenHeight: 667,
        safeViewportWidth: 351,
        coreColumnsWidth: fallbackWidths.reference + fallbackWidths.mainTranslation + fallbackWidths.crossReference,
        guaranteedFit: true,
        adaptiveWidths: fallbackWidths
      };
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isPortrait = screenHeight > screenWidth;
    const safeViewportWidth = screenWidth - 24;

    const adaptiveWidths = calculatePrecisionPortraitWidths(screenWidth, screenHeight, navigableColumnCount);
    const coreColumnsWidth = adaptiveWidths.reference + adaptiveWidths.mainTranslation + adaptiveWidths.crossReference;
    const guaranteedFit = coreColumnsWidth <= safeViewportWidth;

    return {
      isPortrait,
      screenWidth,
      screenHeight,
      safeViewportWidth,
      coreColumnsWidth,
      guaranteedFit,
      adaptiveWidths
    };
  });

  // Function to update CSS variables with current adaptive widths
  const updateCSSVariables = (widths: AdaptivePortraitConfig['adaptiveWidths']) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Get the current column width multiplier from CSS
      const columnWidthMult = parseFloat(
        getComputedStyle(root).getPropertyValue('--column-width-mult') || '1'
      );
      
      // DIAGNOSTIC: Log CSS variable update
      logLayout('useAdaptive:updateCSS', {
        rawWidths: widths,
        multiplier: columnWidthMult,
        willScale: columnWidthMult !== 1
      });
      
      // Only update CSS variables if they have actually changed
      const currentRefWidth = root.style.getPropertyValue('--adaptive-ref-width');
      const currentMainWidth = root.style.getPropertyValue('--adaptive-main-width');
      const currentCrossWidth = root.style.getPropertyValue('--adaptive-cross-width');
      
      // Apply column width multiplier to ALL columns (not just reference!)
      const scaledRefWidth = Math.round(widths.reference * columnWidthMult);
      const scaledMainWidth = Math.round(widths.mainTranslation * columnWidthMult);
      const scaledCrossWidth = Math.round(widths.crossReference * columnWidthMult);
      
      const newRefWidth = `${scaledRefWidth}px`;
      const newMainWidth = `${scaledMainWidth}px`;
      const newCrossWidth = `${scaledCrossWidth}px`;
      
      if (currentRefWidth !== newRefWidth) {
        root.style.setProperty('--adaptive-ref-width', newRefWidth);
      }
      if (currentMainWidth !== newMainWidth) {
        root.style.setProperty('--adaptive-main-width', newMainWidth);
      }
      if (currentCrossWidth !== newCrossWidth) {
        root.style.setProperty('--adaptive-cross-width', newCrossWidth);
      }
      
      // Update remaining variables with multiplier applied
      root.style.setProperty('--adaptive-alt-width', `${Math.round(widths.alternate * columnWidthMult)}px`);
      root.style.setProperty('--adaptive-prophecy-width', `${Math.round(widths.prophecy * columnWidthMult)}px`);
      root.style.setProperty('--adaptive-notes-width', `${Math.round(widths.notes * columnWidthMult)}px`);
      root.style.setProperty('--adaptive-context-width', `${Math.round(widths.context * columnWidthMult)}px`);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // CRITICAL FIX: Reset ALL multipliers when navigable column count changes
    // This prevents saved multipliers from wrong configurations being applied
    if (prevNavCountRef.current !== navigableColumnCount) {
      const oldCount = prevNavCountRef.current;
      
      // UPDATE REF FIRST to prevent infinite loop (setters trigger re-render)
      prevNavCountRef.current = navigableColumnCount;
      
      // Only reset if multipliers are not already 1 (avoid unnecessary updates)
      const currentState = useBibleStore.getState().sizeState;
      if (currentState.externalSizeMult !== 1 || currentState.textSizeMult !== 1) {
        currentState.setExternalSizeMult(1);
        currentState.setTextSizeMult(1);
        
        logLayout('useAdaptive:reset-multiplier', {
          reason: 'navigable-column-count-changed',
          prevCount: oldCount,
          newCount: navigableColumnCount,
          resetExternalTo: 1,
          resetTextTo: 1
        });
      }
    }

    const screenWidth = viewportW;
    const screenHeight = viewportH;
    const isPortrait = screenHeight > screenWidth;
    const safeViewportWidth = screenWidth - 24;

    const adaptiveWidths = calculatePrecisionPortraitWidths(screenWidth, screenHeight, navigableColumnCount);
    const coreColumnsWidth = adaptiveWidths.reference + adaptiveWidths.mainTranslation + adaptiveWidths.crossReference;
    const guaranteedFit = coreColumnsWidth <= safeViewportWidth;

    // DIAGNOSTIC: Log recalculation trigger
    logLayout('useAdaptive:effect', {
      trigger: 'viewport/navCols/mult-change',
      viewportW,
      viewportH,
      navigableColumnCount,
      columnWidthMult,
      isPortrait,
      adaptiveWidths
    });

    // Update CSS variables FIRST
    updateCSSVariables(adaptiveWidths);

    // Then update React state
    setConfig({
      isPortrait,
      screenWidth,
      screenHeight,
      safeViewportWidth,
      coreColumnsWidth,
      guaranteedFit,
      adaptiveWidths
    });
  }, [viewportW, viewportH, navigableColumnCount, columnWidthMult]); // Update when viewport changes from store

  // Update CSS variables whenever config changes
  useEffect(() => {
    updateCSSVariables(config.adaptiveWidths);
    
    // Only dispatch event if widths have actually changed (prevents infinite loop)
    const prev = prevWidthsRef.current;
    const hasChanged = !prev || 
      prev.reference !== config.adaptiveWidths.reference ||
      prev.mainTranslation !== config.adaptiveWidths.mainTranslation ||
      prev.crossReference !== config.adaptiveWidths.crossReference ||
      prev.alternate !== config.adaptiveWidths.alternate ||
      prev.prophecy !== config.adaptiveWidths.prophecy ||
      prev.notes !== config.adaptiveWidths.notes ||
      prev.context !== config.adaptiveWidths.context;
    
    if (hasChanged) {
      // Store current widths for next comparison
      prevWidthsRef.current = { ...config.adaptiveWidths };
      
      // Trigger immediate column change signal to notify headers to update
      try {
        // Emit width change signal to update headers
        window.dispatchEvent(new CustomEvent('columnWidthChange', {
          detail: { adaptiveWidths: config.adaptiveWidths }
        }));
      } catch (error) {
        console.warn('Could not emit column width change signal');
      }
    }
  }, [config.adaptiveWidths]);

  return config;
}