// Unified column width system for exact header-to-content matching
// This ensures perfect alignment between ColumnHeaders and VirtualRow cells

interface ColumnInfo {
  slot: number;
  visible: boolean;
  widthRem: number;
  displayOrder: number;
}

/**
 * Convert rem width to exact pixel width
 * Uses 1rem = 16px standard
 */
export function getColumnPixelWidth(widthRem: number): string {
  return `${widthRem * 16}px`;
}

/**
 * Get column width from columnState by slot number
 * Returns exact pixel width as CSS string
 */
export function getSlotWidth(columnState: { columns: ColumnInfo[] }, slot: number): string {
  const columnInfo = columnState.columns.find(col => col.slot === slot);
  if (!columnInfo) {
    console.warn(`No column info found for slot ${slot}`);
    return '160px'; // fallback
  }
  
  return getColumnPixelWidth(columnInfo.widthRem);
}

/**
 * Get Tailwind class equivalent for a rem width
 * Used for backward compatibility with Tailwind-based cells
 */
export function getRemToTailwindClass(widthRem: number): string {
  // Standard Tailwind width mapping (w-X = X * 0.25rem)
  const tailwindValue = Math.round(widthRem / 0.25);
  return `w-${tailwindValue}`;
}