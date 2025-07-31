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
      alternate: 320,   // 20rem equivalent
      prophecy: 352,    // Same as main
      notes: 320,
      context: 192
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
    // Mobile portrait - match mobile CSS
    refWidth = 24; // Matches mobile CSS
  } else if (viewportWidth > 640 && viewportWidth < 768) {
    // Large mobile/small tablet transition
    refWidth = Math.max(28, Math.min(40, Math.floor(safeViewportWidth * 0.08)));
  } else {
    // Desktop portrait (rare) - use comfortable width
    refWidth = 64;
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
    alternate: Math.floor(finalMain * 0.8), // 80% of main for alternates (horizontal scroll)
    prophecy: finalMain,  // Same width as main translation
    notes: Math.floor(finalMain * 0.7), // 70% of main for notes
    context: Math.floor(finalMain * 0.6)  // 60% of main for context
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

  return config;
}