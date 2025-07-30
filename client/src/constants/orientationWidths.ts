
// Two-modes / one-track column width system
export const COLUMN_WIDTHS = {
  // Reference column - fixed width both orientations
  ref: 'w-[72px] shrink-0',

  // Main + Cross-Ref split leftover width in PORTRAIT, fixed px in LANDSCAPE
  main: 'portrait:w-[calc((100dvw-72px)/2)] landscape:w-[320px] shrink-0',
  xref: 'portrait:w-[calc((100dvw-72px)/2)] landscape:w-[320px] shrink-0',

  // Extra columns - keep fixed px everywhere
  alternate: 'w-[280px] shrink-0',
  prophecy: 'w-[260px] shrink-0',
  notes: 'w-[240px] shrink-0',
  context: 'w-[160px] shrink-0',
};

// Helper to get width class for column type
export function getColumnWidth(columnType: string): string {
  switch (columnType) {
    case 'reference':
      return COLUMN_WIDTHS.ref;
    case 'main-translation':
      return COLUMN_WIDTHS.main;
    case 'cross-refs':
      return COLUMN_WIDTHS.xref;
    case 'alternate':
      return COLUMN_WIDTHS.alternate;
    case 'prophecy':
      return COLUMN_WIDTHS.prophecy;
    case 'notes':
      return COLUMN_WIDTHS.notes;
    case 'context':
      return COLUMN_WIDTHS.context;
    default:
      return COLUMN_WIDTHS.alternate;
  }
}
