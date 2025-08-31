import { useState, useEffect } from 'react';

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

// EXACT THREE-COLUMN PORTRAIT SYSTEM - User's Specification
function calculatePrecisionPortraitWidths(viewportWidth: number, viewportHeight: number): AdaptivePortraitConfig['adaptiveWidths'] {
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
  // 3. Divide remaining space EQUALLY between main translation and cross-references
  console.log('🎯 THREE-COLUMN Portrait Mode:', { viewportWidth, viewportHeight });

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

  // STEP 2: Calculate remaining space after reference column - MATCH CSS CALCULATIONS
  let remainingSpace: number;
  let mainWidth: number;
  let crossWidth: number;

  if (viewportWidth >= 768 && viewportWidth <= 1024) {
    // Tablet portrait - match CSS calculation exactly: calc((100vw - 140px) * 0.44)
    const cssRemainingSpace = viewportWidth - 140; // Matches CSS: 100vw - 140px
    mainWidth = Math.floor(cssRemainingSpace * 0.44); // Matches CSS percentage
    crossWidth = Math.floor(cssRemainingSpace * 0.44); // Equal to main
    remainingSpace = mainWidth + crossWidth;
  } else {
    // Other sizes - use equal division approach
    remainingSpace = safeViewportWidth - refWidth;
    mainWidth = Math.floor(remainingSpace / 2);
    crossWidth = Math.floor(remainingSpace / 2);
  }

  // Ensure minimum readability (compress proportionally if needed)
  const minMain = 100;  // Absolute minimum for main translation
  const minCross = 80;  // Absolute minimum for cross-references

  let finalRef = refWidth;
  let finalMain = Math.max(minMain, mainWidth);
  let finalCross = Math.max(minCross, crossWidth);

  // If minimums exceed available space, compress proportionally
  const totalNeeded = finalRef + finalMain + finalCross;
  if (totalNeeded > safeViewportWidth) {
    const compressionRatio = safeViewportWidth / totalNeeded;
    finalRef = Math.floor(finalRef * compressionRatio);
    finalMain = Math.floor(finalMain * compressionRatio);
    finalCross = Math.floor(finalCross * compressionRatio);
  }

  console.log('📐 THREE-COLUMN Adaptive Calculation:', {
    viewportWidth,
    safeViewportWidth,
    refWidth: finalRef,
    remainingSpace: safeViewportWidth - finalRef,
    mainWidth: finalMain,
    crossWidth: finalCross,
    totalWidth: finalRef + finalMain + finalCross,
    perfectFit: (finalRef + finalMain + finalCross) <= safeViewportWidth,
    equalMainCross: Math.abs(finalMain - finalCross) <= 1 // Should be equal or within 1px
  });

  return {
    reference: finalRef,
    mainTranslation: finalMain,
    crossReference: finalCross,
    alternate: finalMain, // Same width as main translation
    prophecy: finalMain,  // Same width as main translation
    notes: Math.floor(finalMain * 0.7), // 70% of main for notes  
    context: 0  // Hide context column in mobile portrait mode to prevent extra thin columns
  };
}

export function useAdaptivePortraitColumns(): AdaptivePortraitConfig {
  const [config, setConfig] = useState<AdaptivePortraitConfig>(() => {
    if (typeof window === 'undefined') {
      // SSR fallback - assume iPhone SE dimensions
      const fallbackWidths = calculatePrecisionPortraitWidths(375, 667);
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

    const adaptiveWidths = calculatePrecisionPortraitWidths(screenWidth, screenHeight);
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

      const adaptiveWidths = calculatePrecisionPortraitWidths(screenWidth, screenHeight);
      const coreColumnsWidth = adaptiveWidths.reference + adaptiveWidths.mainTranslation + adaptiveWidths.crossReference;
      const guaranteedFit = coreColumnsWidth <= safeViewportWidth;

      console.log('📱 Adaptive Portrait Update:', {
        dimensions: `${screenWidth}×${screenHeight}`,
        isPortrait,
        safeViewportWidth,
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
  }, []);

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