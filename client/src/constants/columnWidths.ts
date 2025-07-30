/**
 * Expert's Two-Mode Column Width System
 * Production-ready orientation-specific column widths
 * 
 * Portrait: Dynamic viewport-based calculations for exact fit
 * Landscape: Fixed pixel widths with center-until-overflow behavior
 */

export const ColumnWidths = {
  // Reference column - fixed width in all orientations
  ref: 'w-[72px] shrink-0',

  // Main translation column - responsive by orientation
  main: 'portrait:w-[calc((100dvw-72px)/2)] landscape:w-[320px] shrink-0',

  // Cross-reference column - matches main in portrait, fixed in landscape
  xref: 'portrait:w-[calc((100dvw-72px)/2)] landscape:w-[320px] shrink-0',

  // Extra columns (prophecy, notes, dates) - fixed width everywhere
  prophecy: 'w-[180px] shrink-0',  // P/F/V combined
  notes: 'w-[260px] shrink-0',
  dates: 'w-[200px] shrink-0',
  translation: 'w-[320px] shrink-0', // Additional translations
} as const;

/**
 * Utility function to get column width class by type
 */
export function getColumnWidthClass(columnType: string): string {
  switch (columnType) {
    case 'reference':
      return ColumnWidths.ref;
    case 'main-translation':
      return ColumnWidths.main;
    case 'cross-refs':
      return ColumnWidths.xref;
    case 'prophecy-p':
    case 'prophecy-f':
    case 'prophecy-v':
      return 'w-[60px] shrink-0'; // Individual prophecy columns
    case 'notes':
      return ColumnWidths.notes;
    case 'context':
      return ColumnWidths.dates;
    case 'translation':
      return ColumnWidths.translation;
    default:
      return ColumnWidths.translation; // Default fallback
  }
}