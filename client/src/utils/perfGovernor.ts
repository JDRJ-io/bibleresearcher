/**
 * Performance Governor: Compute optimal row budget based on column count
 * 
 * Goal: Keep total cells ≤ ~360 for smooth scrolling
 * - 5 columns: 70 rows = 350 cells
 * - 4 columns: 90 rows = 360 cells
 * - ≤3 columns: 120 rows = max 360 cells
 */

export function computeOptimalRowCount(columnCount: number): number {
  if (columnCount >= 5) return 70;   // 70 × 5 = 350 cells
  if (columnCount === 4) return 90;  // 90 × 4 = 360 cells
  return 120;                        // ≤3 columns: max 360 cells
}

/**
 * Performance guard: Warn if cell count exceeds safe threshold
 * Use during development to catch performance regressions
 */
export function perfGuard(rowsTotal: number, columns: number) {
  const cells = rowsTotal * columns;
  if (cells > 380) {
    console.warn('[PerfGuard] High cell count detected:', { 
      rowsTotal, 
      columns, 
      cells,
      recommendation: `Reduce rows to ${computeOptimalRowCount(columns)}`
    });
  }
}
