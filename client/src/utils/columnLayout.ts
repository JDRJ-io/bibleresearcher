type ColumnId = 'KJV' | 'CrossRefs' | 'Prediction' | 'Fulfillment' | 'Verification' | 'Notes';

type LayoutParams = {
  containerWidthPx: number;        // total width (incl. pillar)
  pillarWidthPx: number;           // sticky Ref/# width
  gapPx: number;                   // px gap between columns
  activeColumns: ColumnId[];       // excludes pillar

  // Prefer measured widths; else base*zoom
  widthsPx?: number[];             
  baseWidths?: Record<ColumnId, number>;
  zoom?: number;

  offset: number;                  // 0-based, excludes pillar
  ghostSlots?: number;             // trailing ghost to allow final single-column page (default 1)
};

type LayoutResult = {
  contentViewportPx: number;
  startIndex: number;              // 0-based
  endIndex: number;                // inclusive
  visibleCount: number;            // how many actually fit
  labelStart: number;              // 1-based
  labelEnd: number;                // 1-based
  totalNavigableColumns: number;
  canGoLeft: boolean;
  canGoRight: boolean;
};

export function computeVisibleRangeDynamic(p: LayoutParams): LayoutResult {
  const contentViewportPx = Math.max(0, p.containerWidthPx - p.pillarWidthPx);
  const total = p.activeColumns.length;
  const ghostSlots = Math.max(0, p.ghostSlots ?? 1);

  // Build widths
  let widths: number[];
  if (p.widthsPx && p.widthsPx.length === total) {
    widths = p.widthsPx.map(w => Math.max(1, Math.round(w)));
  } else {
    const zoom = p.zoom ?? 1;
    const base = p.baseWidths ?? {} as Record<ColumnId, number>;
    widths = p.activeColumns.map(id => Math.max(1, Math.round((base[id] ?? 320) * zoom)));
  }

  if (total === 0) {
    return {
      contentViewportPx,
      startIndex: 0, endIndex: -1, visibleCount: 0,
      labelStart: 0, labelEnd: 0, totalNavigableColumns: 0,
      canGoLeft: false, canGoRight: false
    };
  }

  // Clamp starting index first
  let start = Math.max(0, Math.min(p.offset, total - 1));

  // How many fit from 'start' by pixels
  const fitFrom = (s: number) => {
    let used = 0, count = 0;
    for (let i = s; i < total; i++) {
      const next = count === 0 ? widths[i] : used + p.gapPx + widths[i];
      if (next > contentViewportPx) break;
      used = next; count++;
    }
    return Math.max(1, count); // show at least one even if too wide
  };

  // Compute visible at current start
  let visible = fitFrom(start);

  // Trailing-ghost clamp: allow start to go as far as total - visible + ghostSlots
  const maxStart = Math.max(0, total - Math.max(1, visible) + ghostSlots);
  if (start > maxStart) {
    start = maxStart;
    visible = fitFrom(start); // recompute for new start (may drop to 1 at the end)
  }

  const end = Math.min(start + visible - 1, total - 1);

  return {
    contentViewportPx,
    startIndex: start,
    endIndex: end,
    visibleCount: visible,
    labelStart: start + 1,
    labelEnd: end + 1,
    totalNavigableColumns: total,
    canGoLeft: start > 0,
    canGoRight: end < total - 1, // still true until we're really at the last column
  };
}

export type { ColumnId, LayoutParams, LayoutResult };