import { useMemo, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import type { RefObject } from 'react';
import { useBibleStore } from '@/App';

/**
 * Desktop Landscape Alignment & Shifting State Machine
 * 
 * Implements the expert policy for column navigation:
 * 
 * State A: Centered (N_active ≤ N_vp AND k=0)
 * - Everything fits, centered alignment  
 * - Arrows disabled
 * - Clean professional look
 * 
 * State B: Left Idle (N_active > N_vp AND k=0)
 * - Too many columns, left-aligned
 * - Arrows enabled for navigation
 * 
 * State C: Shifting Session (k ≠ 0)  
 * - Left-locked regardless of visible count
 * - No recentering until k=0 again
 * - Headers stay glued to columns
 */

export type AlignmentState = 'centered' | 'left-idle' | 'shifting';

export interface ColumnAlignmentState {
  // Core state values
  N_vp: number;           // Viewport capacity (how many columns fit)
  N_active: number;       // Active columns count
  k: number;              // Shift offset
  
  // Calculated state
  state: AlignmentState;
  alignment: 'center' | 'left';
  arrowsEnabled: boolean;
  
  // Edge detection
  canShiftLeft: boolean;
  canShiftRight: boolean;
  
  // State descriptions for debugging
  stateDescription: string;
  debugInfo: {
    fitsInViewport: boolean;
    isShifting: boolean;
    needsNavigation: boolean;
  };
}

export function useColumnAlignmentStateMachine(headerRef?: RefObject<HTMLElement>): ColumnAlignmentState {
  const {
    navigableColumns,
    maxVisibleNavigableColumns,
    visibleNavigableCount,
    navigationOffset,
    canShiftLeft: storeCanShiftLeft,
    canShiftRight: storeCanShiftRight,
    alignmentLockMode,
    autoRecenter
  } = useBibleStore();
  
  // Track previous fitsInViewport state to detect transitions
  const prevFitsRef = useRef<boolean | null>(null);
  // Track previous column count to detect when columns are added/removed
  const prevColumnCountRef = useRef<number>(navigableColumns.length);

  logger.debug("COL", '🔧 STATE MACHINE HOOK CALLED:', {
    navigableColumnsLength: navigableColumns?.length,
    maxVisibleNavigableColumns,
    visibleNavigableCount,
    navigationOffset,
    alignmentLockMode
  });

  // Memoized calculation for whether content fits in viewport
  // This is used both by the state machine and the auto-reset effect
  const { fitsInViewport, domMeasurementUsed } = useMemo(() => {
    const N_active = navigableColumns.length;
    const N_vp = visibleNavigableCount;
    const prevColumnCount = prevColumnCountRef.current;
    
    // Detect if columns were just added (transition period)
    const columnsJustAdded = N_active > prevColumnCount;
    
    // DOM-based measurement if ref is available (PRIORITY: Trust DOM measurement first)
    let fits = false;
    let measured = false;
    
    if (headerRef?.current) {
      const headerContainer = headerRef.current;
      const innerContainer = headerContainer.querySelector('.column-headers-inner') as HTMLElement;
      
      if (innerContainer) {
        const scrollWidth = innerContainer.scrollWidth;
        const clientWidth = headerContainer.clientWidth;
        const tolerance = 2;
        
        fits = scrollWidth <= (clientWidth + tolerance);
        measured = true;
        
        logger.debug("COL", 'DOM_MEASURE', {
          scrollWidth,
          clientWidth,
          tolerance,
          fitsInViewport: fits,
          domMeasurementUsed: true,
          timestamp: new Date().toISOString().slice(11, 23)
        });
      }
    }
    
    // FALLBACK: When no DOM measurement is available, use conservative estimate
    // Always use actual measured viewport capacity (N_vp), never the optimistic max
    // This ensures arrows enable correctly on desktop when columns overflow
    if (!measured) {
      // Conservative: Only trust actual measured capacity (N_vp)
      // If N_vp is still initializing (1), be pessimistic and assume overflow
      const fallbackCapacity = N_vp > 1 ? N_vp : 1;
      fits = N_active <= fallbackCapacity;
      
      logger.debug("COL", 'FALLBACK_ESTIMATE', {
        N_active,
        N_vp,
        maxVisibleNavigableColumns,
        fallbackCapacity,
        fits,
        columnsJustAdded,
        timestamp: new Date().toISOString().slice(11, 23)
      });
    }
    
    return { fitsInViewport: fits, domMeasurementUsed: measured };
  }, [navigableColumns.length, visibleNavigableCount, maxVisibleNavigableColumns, headerRef]);

  // 🚨 CRITICAL FIX: Auto-recenter when content fits (transition detection)
  // Triggers on: orientation changes, viewport resizes, OR column additions/removals
  useEffect(() => {
    const prevFits = prevFitsRef.current;
    const prevColumnCount = prevColumnCountRef.current;
    const currentColumnCount = navigableColumns.length;
    
    // Update refs for next render
    prevFitsRef.current = fitsInViewport;
    prevColumnCountRef.current = currentColumnCount;
    
    // Detect if columns were added or removed
    const columnsChanged = prevColumnCount !== currentColumnCount;
    
    // Calculate if content fits using simple count comparison (fallback when no DOM measurement)
    const N_active = navigableColumns.length;
    const N_vp = visibleNavigableCount;
    // 🎯 Use same conservative fallback as main calculation
    const fallbackCapacity = N_vp > 1 ? N_vp : 1;
    const fitsBasedOnCount = N_active <= fallbackCapacity;
    
    // Trigger auto-recenter when:
    // 1. In auto mode
    // 2. Content now fits (either DOM-measured OR count-based)
    // 3. We have a real DOM measurement (not optimistic fallback)
    // 4. AND one of these conditions:
    //    - Previous didn't fit, now it does (false→true transition)
    //    - Initial load with non-zero offset
    //    - Columns were added/removed and now they fit
    const shouldRecenter = 
      alignmentLockMode === 'auto' &&
      domMeasurementUsed && // 🎯 CRITICAL: Only auto-recenter when we have real DOM measurement
      (fitsInViewport || fitsBasedOnCount) &&
      (
        prevFits === false || 
        (prevFits === null && navigationOffset !== 0) ||
        (columnsChanged && fitsBasedOnCount)
      );
    
    if (shouldRecenter) {
      logger.debug('COL', '🎯 Transition detected: Auto-recentering', {
        prevFits,
        currentFits: fitsInViewport,
        fitsBasedOnCount,
        columnsChanged,
        prevColumnCount,
        currentColumnCount,
        navigationOffset
      });
      autoRecenter();
    }
  }, [alignmentLockMode, fitsInViewport, domMeasurementUsed, navigationOffset, navigableColumns.length, visibleNavigableCount, maxVisibleNavigableColumns, autoRecenter]);

  return useMemo(() => {
    // Core state variables
    const N_active = navigableColumns.length;
    const N_vp = visibleNavigableCount; // Use actual measured viewport capacity, not inflated max
    const k = navigationOffset;
    
    // On initial load, visibleNavigableCount may be 1 (default) before DOM measurement
    // If we detect this, force left alignment and wait for actual measurement
    const isProbablyInitializing = N_vp === 1 && navigableColumns.length > 1;
    
    // Helper calculations  
    const isShifting = k !== 0;
    const needsNavigation = !fitsInViewport;
    
    // State machine logic with explicit lock mode support
    let state: AlignmentState;
    let alignment: 'center' | 'left';
    let arrowsEnabled: boolean;
    let stateDescription: string;
    
    // Handle explicit lock modes first
    if (alignmentLockMode === 'centeredLocked') {
      // CENTERED LOCKED MODE: Always centered, no shifting allowed
      state = 'centered';
      alignment = 'center';
      arrowsEnabled = false; // NO navigation allowed in centered lock mode
      stateDescription = `Centered Locked - Navigation disabled, forced center alignment`;
    } else if (alignmentLockMode === 'leftLocked') {
      // LEFT LOCKED MODE: Always left-aligned, but allow navigation
      state = k !== 0 ? 'shifting' : 'left-idle';
      alignment = 'left';
      arrowsEnabled = !fitsInViewport; // Only enable if content overflows
      stateDescription = `Left Locked - ${k !== 0 ? 'Shifting' : 'Idle'}, forced left alignment`;
    } else {
      // AUTO MODE: Original dynamic behavior
      if (k !== 0) {
        // State C: Shifting Session
        state = 'shifting';
        alignment = 'left';  // LOCKED left during shift session
        arrowsEnabled = true;
        stateDescription = `Auto Shifting (k=${k}) - Left-locked until reset`;
      } else if (isProbablyInitializing && !domMeasurementUsed) {
        // INITIALIZATION: Waiting for actual DOM measurement, default to centered
        // This prevents the "flash of left-aligned content" on page reload
        state = 'centered';
        alignment = 'center';
        arrowsEnabled = false;
        stateDescription = `Initializing - Waiting for DOM measurement (N_vp=${N_vp}, N_active=${N_active})`;
      } else if (fitsInViewport) {
        // State A: Centered  
        state = 'centered';
        alignment = 'center';
        arrowsEnabled = false; // DISABLED when centered
        stateDescription = `Auto Centered - Content fits in viewport${domMeasurementUsed ? ' (DOM measured)' : ''}`;
      } else {
        // State B: Left Idle
        state = 'left-idle';
        alignment = 'left';
        arrowsEnabled = true;
        stateDescription = `Auto Left Idle - ${N_active} columns > ${N_vp} viewport capacity`;
      }
    }
    
    // Edge detection for individual arrows
    // Use store functions for actual navigation capability
    const canShiftLeft = arrowsEnabled && storeCanShiftLeft();
    const canShiftRight = arrowsEnabled && storeCanShiftRight();
    
    const result: ColumnAlignmentState = {
      N_vp,
      N_active,
      k,
      state,
      alignment,
      arrowsEnabled,
      canShiftLeft,
      canShiftRight,
      stateDescription,
      debugInfo: {
        fitsInViewport,
        isShifting,
        needsNavigation
      }
    };
    
    // Structured logging for diagnosis
    logger.debug("COL", 'ALIGN_DECISION', {
      N_active,
      N_vp, 
      k,
      align: alignment,
      arrowsEnabled,
      refAttached: true, // Will be updated when we check actual ref status
      stateDescription,
      timestamp: new Date().toISOString().slice(11, 23)
    });
    
    // Debug logging for development - FORCE UPDATE  
    logger.debug("COL", '🎯 ALIGNMENT STATE MACHINE:', {
      ...result,
      timestamp: new Date().toISOString().slice(11, 23) // HH:MM:SS.mmm
    });
    
    return result;
  }, [
    navigableColumns.length,
    maxVisibleNavigableColumns, 
    visibleNavigableCount,
    navigationOffset,
    storeCanShiftLeft,
    storeCanShiftRight,
    alignmentLockMode,
    fitsInViewport,
    domMeasurementUsed
  ]);
}