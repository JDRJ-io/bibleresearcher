import { useState, useEffect } from 'react';
import { useBibleStore } from '@/App';

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

// DYNAMIC COLUMN PORTRAIT SYSTEM - User's Specification: equal width for all non-reference columns
function calculatePrecisionPortraitWidths(viewportWidth: number, viewportHeight: number, navigableColumnCount: number = 2): AdaptivePortraitConfig['adaptiveWidths'] {
  const isPortrait = viewportHeight > viewportWidth;

  if (!isPortrait) {
    // Landscape - use standard comfortable widths
    return {
      reference: 72,    // 4.5rem equivalent
      mainTranslation: 352, // 22rem equivalent  
      crossReference: 288,  // 18rem equivalent
      alternate: 352,   // Same as main translation
      prophecy: 352,    // Same as main
      notes: 320,
      context: 120      // Thinner for landscape mode
    };
  }

  // Portrait precision mode - USER'S EXACT SPECIFICATION:
  // 1. Detect portrait viewport width automatically 
  // 2. Subtract reference column width
  // 3. Divide remaining space EQUALLY among ALL non-reference columns
  console.log('🎯 DYNAMIC-COLUMN Portrait Mode:', { viewportWidth, viewportHeight, navigableColumnCount });

  // Account for scrollbars, borders, padding - conservative margin
  const safeViewportWidth = viewportWidth - 20; // 10px margin on each side

  // STEP 1: Reference column gets fixed optimal width - SYNC WITH CSS BREAKPOINTS
  let refWidth: number;
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

  // STEP 2: Calculate remaining space after reference column and divide EQUALLY among all navigable columns
  const remainingSpace = safeViewportWidth - refWidth;
  const equalColumnWidth = navigableColumnCount > 0 ? Math.floor(remainingSpace / navigableColumnCount) : 0;

  // Ensure minimum readability (compress proportionally if needed)
  const minColumnWidth = 80;  // Absolute minimum for any navigable column

  let finalRef = refWidth;
  let finalColumnWidth = Math.max(minColumnWidth, equalColumnWidth);

  // If minimum width would exceed available space, compress proportionally
  const totalNeeded = finalRef + (finalColumnWidth * navigableColumnCount);
  if (totalNeeded > safeViewportWidth) {
    const compressionRatio = safeViewportWidth / totalNeeded;
    finalRef = Math.floor(finalRef * compressionRatio);
    finalColumnWidth = Math.floor(finalColumnWidth * compressionRatio);
  }

  console.log('📐 DYNAMIC-COLUMN Adaptive Calculation:', {
    viewportWidth,
    safeViewportWidth,
    navigableColumnCount,
    refWidth: finalRef,
    remainingSpace: safeViewportWidth - finalRef,
    equalColumnWidth: finalColumnWidth,
    totalWidth: finalRef + (finalColumnWidth * navigableColumnCount),
    perfectFit: (finalRef + (finalColumnWidth * navigableColumnCount)) <= safeViewportWidth
  });

  return {
    reference: finalRef,
    mainTranslation: finalColumnWidth,
    crossReference: finalColumnWidth,
    alternate: finalColumnWidth,     // Same width as all other columns
    prophecy: finalColumnWidth,      // Same width as all other columns
    notes: finalColumnWidth,         // Same width as all other columns  
    context: viewportWidth <= 640 ? 0 : finalColumnWidth  // Hide context in mobile portrait mode
  };
}

export function useAdaptivePortraitColumns(): AdaptivePortraitConfig {
  // Get navigable column count from store
  const { navigableColumns } = useBibleStore();
  const navigableColumnCount = navigableColumns.length || 2;

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
      root.style.setProperty('--adaptive-ref-width', `${widths.reference}px`);
      root.style.setProperty('--adaptive-main-width', `${widths.mainTranslation}px`);
      root.style.setProperty('--adaptive-cross-width', `${widths.crossReference}px`);
      root.style.setProperty('--adaptive-alt-width', `${widths.alternate}px`);
      root.style.setProperty('--adaptive-prophecy-width', `${widths.prophecy}px`);
      root.style.setProperty('--adaptive-notes-width', `${widths.notes}px`);
      root.style.setProperty('--adaptive-context-width', `${widths.context}px`);

      console.log('🎯 CSS Variables Updated:', {
        '--adaptive-ref-width': `${widths.reference}px`,
        '--adaptive-main-width': `${widths.mainTranslation}px`,
        '--adaptive-cross-width': `${widths.crossReference}px`
      });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateConfig = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const isPortrait = screenHeight > screenWidth;
      const safeViewportWidth = screenWidth - 24;

      const adaptiveWidths = calculatePrecisionPortraitWidths(screenWidth, screenHeight, navigableColumnCount);
      const coreColumnsWidth = adaptiveWidths.reference + adaptiveWidths.mainTranslation + adaptiveWidths.crossReference;
      const guaranteedFit = coreColumnsWidth <= safeViewportWidth;

      console.log('📱 Adaptive Portrait Update:', {
        dimensions: `${screenWidth}×${screenHeight}`,
        isPortrait,
        safeViewportWidth,
        navigableColumnCount,
        coreColumnsWidth,
        guaranteedFit,
        widths: adaptiveWidths
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
    };

    // Initial update
    updateConfig();

    // Listen for both resize and orientation changes
    window.addEventListener('resize', updateConfig);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure orientation change is complete
      setTimeout(updateConfig, 150);
    });

    return () => {
      window.removeEventListener('resize', updateConfig);
      window.removeEventListener('orientationchange', updateConfig);
    };
  }, [navigableColumnCount]); // Re-run when column count changes

  // Update CSS variables whenever config changes
  useEffect(() => {
    updateCSSVariables(config.adaptiveWidths);
    
    // Trigger column change signal to notify headers to update
    setTimeout(() => {
      try {
        // Emit width change signal to update headers
        window.dispatchEvent(new CustomEvent('columnWidthChange', {
          detail: { adaptiveWidths: config.adaptiveWidths }
        }));
      } catch (error) {
        console.warn('Could not emit column width change signal');
      }
    }, 50);
  }, [config.adaptiveWidths]);

  return config;
}