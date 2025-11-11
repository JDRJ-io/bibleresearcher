/**
 * FIX #1: Base row height for calculation
 * Actual effective row height is measured dynamically via measureEffectiveRowHeight()
 * Mobile typically measures 24-28px, desktop may be higher
 */
export const BASE_ROW_HEIGHT = 120; // Base height, will be measured and corrected
export const ROW_HEIGHT = BASE_ROW_HEIGHT; // Keep for compatibility
