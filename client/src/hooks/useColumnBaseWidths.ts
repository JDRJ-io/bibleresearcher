import { useEffect } from 'react';

/**
 * UNIFIED COLUMN BASE WIDTHS HOOK
 * 
 * Single source of truth for all column widths across portrait/landscape modes.
 * Sets --col-*-base CSS variables that are scaled by --column-width-mult.
 * 
 * Replaces:
 * - useAdaptivePortraitColumns 
 * - useResponsiveColumns
 * - useAdaptiveWidths
 * - CSS clamp --w-* variables
 */
export function useColumnBaseWidths() {
  useEffect(() => {
    const updateBaseWidths = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const isPortrait = screenHeight > screenWidth;
      const root = document.documentElement;

      // Set default --column-width-mult if not present
      const currentMult = getComputedStyle(root).getPropertyValue('--column-width-mult').trim();
      if (!currentMult) {
        root.style.setProperty('--column-width-mult', '1');
      }

      if (isPortrait) {
        // PORTRAIT MODE - Adopt logic from useAdaptivePortraitColumns
        const safeViewportWidth = screenWidth - 30; // Conservative margin for mobile safety
        
        // Reference column - fixed optimal width
        let refWidth: number;
        if (screenWidth >= 768 && screenWidth <= 1024) {
          refWidth = 56; // Tablet portrait
        } else if (screenWidth <= 640) {
          refWidth = 32; // Mobile portrait - ultra-compact
        } else if (screenWidth > 640 && screenWidth < 768) {
          refWidth = Math.max(24, Math.min(32, Math.floor(safeViewportWidth * 0.06)));
        } else {
          refWidth = 60; // Desktop portrait (rare)
        }

        // Calculate remaining space after reference column
        let mainWidth: number;
        let crossWidth: number;
        
        if (screenWidth >= 768 && screenWidth <= 1024) {
          // Tablet portrait - CSS calculation match
          const cssRemainingSpace = screenWidth - 140;
          mainWidth = Math.floor(cssRemainingSpace * 0.44);
          crossWidth = Math.floor(cssRemainingSpace * 0.44);
        } else {
          // Other sizes - equal division approach
          const remainingSpace = safeViewportWidth - refWidth;
          mainWidth = Math.floor(remainingSpace / 2);
          crossWidth = Math.floor(remainingSpace / 2);
        }

        // Ensure minimum readability
        const minMain = 100;
        const minCross = 80;
        let finalRef = refWidth;
        let finalMain = Math.max(minMain, mainWidth);
        let finalCross = Math.max(minCross, crossWidth);

        // Proportional compression if needed
        const totalNeeded = finalRef + finalMain + finalCross;
        if (totalNeeded > safeViewportWidth) {
          const compressionRatio = safeViewportWidth / totalNeeded;
          finalRef = Math.floor(finalRef * compressionRatio);
          finalMain = Math.floor(finalMain * compressionRatio);
          finalCross = Math.floor(finalCross * compressionRatio);
        }

        // Final safety check - emergency compression
        const actualTotal = finalRef + finalMain + finalCross;
        if (actualTotal > safeViewportWidth) {
          const overflow = actualTotal - safeViewportWidth;
          if (finalCross > 60) {
            finalCross = Math.max(60, finalCross - Math.ceil(overflow / 2));
          }
          if (actualTotal > safeViewportWidth && finalMain > 80) {
            finalMain = Math.max(80, finalMain - Math.ceil(overflow / 2));
          }
        }

        // Set portrait base widths
        root.style.setProperty('--col-ref-base', `${finalRef}px`);
        root.style.setProperty('--col-main-base', `${finalMain}px`);
        root.style.setProperty('--col-alt-base', `${finalMain}px`); // Same as main
        root.style.setProperty('--col-xref-base', `${finalCross}px`);
        root.style.setProperty('--col-notes-base', `${Math.floor(finalMain * 0.7)}px`); // 70% of main
        root.style.setProperty('--col-prophecy-base', `${finalMain}px`); // Same as main

      } else {
        // LANDSCAPE MODE - Replace CSS clamp with explicit JS calculations
        let refWidth: number;
        let mainWidth: number;
        let xrefWidth: number;
        let altWidth: number;
        let notesWidth: number;
        let prophecyWidth: number;

        if (screenWidth >= 1920) {
          // Large screens - comfortable widths
          refWidth = 80;
          mainWidth = 350;
          xrefWidth = 320;
          altWidth = 320;
          notesWidth = 300;
          prophecyWidth = 200;
        } else if (screenWidth >= 1440) {
          // Medium-large screens
          refWidth = 72;
          mainWidth = 320;
          xrefWidth = 280;
          altWidth = 280;
          notesWidth = 280;
          prophecyWidth = 200;
        } else if (screenWidth >= 1024) {
          // Medium screens
          refWidth = 72;
          mainWidth = 300;
          xrefWidth = 260;
          altWidth = 260;
          notesWidth = 260;
          prophecyWidth = 200;
        } else if (screenWidth >= 768) {
          // Small screens
          refWidth = 64;
          mainWidth = 280;
          xrefWidth = 240;
          altWidth = 240;
          notesWidth = 240;
          prophecyWidth = 180;
        } else {
          // Landscape mobile - compact but usable
          refWidth = 56;
          mainWidth = 260;
          xrefWidth = 220;
          altWidth = 220;
          notesWidth = 220;
          prophecyWidth = 160;
        }

        // Set landscape base widths
        root.style.setProperty('--col-ref-base', `${refWidth}px`);
        root.style.setProperty('--col-main-base', `${mainWidth}px`);
        root.style.setProperty('--col-alt-base', `${altWidth}px`);
        root.style.setProperty('--col-xref-base', `${xrefWidth}px`);
        root.style.setProperty('--col-notes-base', `${notesWidth}px`);
        root.style.setProperty('--col-prophecy-base', `${prophecyWidth}px`);
      }

      console.log('🎯 useColumnBaseWidths: Updated base widths', {
        mode: isPortrait ? 'portrait' : 'landscape',
        screenWidth,
        screenHeight,
        bases: {
          ref: getComputedStyle(root).getPropertyValue('--col-ref-base'),
          main: getComputedStyle(root).getPropertyValue('--col-main-base'),
          xref: getComputedStyle(root).getPropertyValue('--col-xref-base')
        }
      });
    };

    // Initial update
    updateBaseWidths();

    // Update on resize and orientation change
    window.addEventListener('resize', updateBaseWidths);
    window.addEventListener('orientationchange', () => {
      // Delay to ensure orientation change is complete
      setTimeout(updateBaseWidths, 150);
    });

    return () => {
      window.removeEventListener('resize', updateBaseWidths);
      window.removeEventListener('orientationchange', updateBaseWidths);
    };
  }, []);
}