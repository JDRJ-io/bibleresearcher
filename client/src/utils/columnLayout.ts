type ColumnId = 'KJV' | 'CrossRefs' | 'Prediction' | 'Fulfillment' | 'Verification' | 'Notes';

type LayoutParams = {
  // Pixels
  containerWidthPx: number;    // the total width of the scrolling area INCLUDING the pillar
  pillarWidthPx: number;       // measured width of the sticky Ref/# pillar
  gapPx: number;               // horizontal gap between columns (if any)

  // Which columns are currently toggled on (excluding pillar)
  activeColumns: ColumnId[];

  // Widths per column type at zoom=1 (in px). Adjust these to your design.
  baseWidths: Record<ColumnId, number>;

  // Current UI zoom / size factor for columns (1.0 = base, 1.2 = 20% wider, etc.)
  zoom: number;

  // Target number of content columns to show per "page"
  // e.g., portrait = 2, landscape = 3 (not counting the pillar)
  targetSlots: number;

  // Current left-offset index in the activeColumns array (0-based)
  offset: number;
};

type LayoutResult = {
  contentViewportPx: number;     // containerWidthPx - pillarWidthPx
  totalNavigableColumns: number; // activeColumns.length
  visibleCount: number;          // how many content columns we'll show this page
  startIndex: number;            // 0-based index into activeColumns
  endIndex: number;              // inclusive 0-based index
  labelStart: number;            // 1-based for display
  labelEnd: number;              // 1-based for display
  canGoLeft: boolean;
  canGoRight: boolean;
};

export function computeVisibleRange(p: LayoutParams): LayoutResult {
  const contentViewportPx = Math.max(0, p.containerWidthPx - p.pillarWidthPx);
  const totalNavigableColumns = p.activeColumns.length;
  const widths = p.activeColumns.map(id => Math.max(1, Math.round(p.baseWidths[id] * p.zoom)));

  // If nothing to show, return a neutral result
  if (totalNavigableColumns === 0) {
    return {
      contentViewportPx,
      totalNavigableColumns,
      visibleCount: 0,
      startIndex: 0,
      endIndex: -1,
      labelStart: 0,
      labelEnd: 0,
      canGoLeft: false,
      canGoRight: false
    };
  }

  // Clamp offset to valid range; we'll refine after we know visibleCount
  let offset = Math.max(0, Math.min(p.offset, totalNavigableColumns - 1));

  // Compute how many columns fit starting at `offset`, but
  // NEVER exceed targetSlots; ALWAYS show at least 1.
  const fitCount = (start: number): number => {
    let count = 0;
    let used = 0;
    for (let i = start; i < totalNavigableColumns; i++) {
      const w = widths[i];
      const next = (count === 0 ? w : used + p.gapPx + w);
      if (next > contentViewportPx) break;
      used = next;
      count++;
      if (count >= p.targetSlots) break; // hard cap
    }
    return Math.max(1, count);
  };

  let visibleCount = fitCount(offset);

  // If we're so far to the right that we can't fill visibleCount, pull offset left.
  // (This also fixes the "thinks it's at the end too early" bug.)
  const maxOffset = Math.max(0, totalNavigableColumns - visibleCount);
  if (offset > maxOffset) {
    offset = maxOffset;
    visibleCount = fitCount(offset);
  }

  const startIndex = offset;
  const endIndex = Math.min(offset + visibleCount - 1, totalNavigableColumns - 1);

  const canGoLeft = startIndex > 0;
  const canGoRight = endIndex < totalNavigableColumns - 1;

  // 1-based labels, NOT including the pillar
  const labelStart = startIndex + 1;
  const labelEnd   = endIndex + 1;

  return {
    contentViewportPx,
    totalNavigableColumns,
    visibleCount,
    startIndex,
    endIndex,
    labelStart,
    labelEnd,
    canGoLeft,
    canGoRight
  };
}

export type { ColumnId, LayoutParams, LayoutResult };