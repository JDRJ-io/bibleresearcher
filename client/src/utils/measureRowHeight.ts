/**
 * FIXED: Respect user's row height preference
 * 
 * The baseRowHeight parameter already includes:
 * - Base ROW_HEIGHT constant (120px)
 * - User's fontSize multiplier (rowHeightMult)
 * - Any device-specific adjustments
 * 
 * This function now simply returns the baseRowHeight without clamping,
 * ensuring anchor calculations and spacers use the same value.
 */

let cachedRowHeight: number | null = null;
let cachedBaseRowHeight: number | null = null;

export function measureEffectiveRowHeight(baseRowHeight: number = 120): number {
  // If baseRowHeight changes, invalidate cache
  if (cachedBaseRowHeight !== baseRowHeight) {
    cachedRowHeight = null;
    cachedBaseRowHeight = baseRowHeight;
  }

  // Return cached value if available
  if (cachedRowHeight !== null) {
    return cachedRowHeight;
  }

  // Use the baseRowHeight directly - it already has user preferences applied
  cachedRowHeight = baseRowHeight;
  console.log('📏 Using row height:', cachedRowHeight, 'px (respects user fontSize preference)');
  return cachedRowHeight;
}

/**
 * Reset cached measurement (useful for window resize/orientation change)
 */
export function resetRowHeightCache() {
  cachedRowHeight = null;
}

/**
 * Get current effective row height (for diagnostics)
 */
export function getEffectiveRowHeight(): number {
  return cachedRowHeight ?? 120;
}

// Expose to window for diagnostics
if (typeof window !== 'undefined') {
  (window as any).__ROW_H__ = () => getEffectiveRowHeight();
  (window as any).__resetRowHeight__ = resetRowHeightCache;
}
