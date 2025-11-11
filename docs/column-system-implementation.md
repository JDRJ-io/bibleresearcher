# Column System Implementation Guide

Complete implementation specification with data shapes and pseudocode for the column track system.

## Data Shapes

### Core Types

```typescript
// ===== IDs & Modes =====
type ColumnId = 0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20;

type LayoutMode = "landscape" | "portrait" | "mobile-landscape" | "mobile-portrait";

// ===== Column Meta =====
interface ColumnMeta {
  id: ColumnId;
  name: string;
  orderKey: number;     // default relative order for auto-insert
  required?: boolean;   // e.g., id=2 main translation
  isOverlay?: boolean;  // e.g., id=20 master column
  minWidthPx?: number;  // optional per-column minimum
}

// ===== Tracks =====
// Track is authoritative left->right list of active columns.
// Slot index === array index.
type Track = ColumnId[];

// We keep a separate "headerTrack" reference (same IDs, same order).
// It must always mirror `track` 1:1.
// (You can literally point headerTrack to the same array if your UI allows.)
type HeaderTrack = ColumnId[];

// ===== UI State =====
interface ColumnLayoutState {
  mode: LayoutMode;

  // Authoritative tracks
  track: Track;
  headerTrack: HeaderTrack; // must mirror `track` exactly

  // Viewport/geometry
  viewportWidth: number;         // px
  columnWidth: number;           // px (uniform width assumption for simplicity)
  gapWidth: number;              // px gap between columns (if any)
  basePadding: number;           // px inner padding for the track container

  // Derived
  totalTrackWidth: number;       // computed from track.length and widths/gaps
  viewportCols: number;          // how many columns fit (floor)
  viewportStartSlot: number;     // first visible slot in the viewport (0-based)
  centered: boolean;             // true if totalTrackWidth < viewportWidth (landscape rule)

  // Column registry
  meta: Record<ColumnId, ColumnMeta>;
}
```

## Invariants

1. **Main translation (id=2) is always active** (cannot be toggled off).
2. **Track is authoritative**; headers mirror the track exactly (same order, same slots).
3. **Slot indices are contiguous** 0..track.length-1.
4. **No duplicate ColumnId** in track.
5. **Master column (id=20)** respects its slot for alignment, but renders as an overlay (can have its own vertical scroll).

## Core Helpers

```typescript
function isActive(state: ColumnLayoutState, colId: ColumnId): boolean {
  return state.track.includes(colId);
}

function findInsertIndexByOrderKey(state: ColumnLayoutState, colId: ColumnId): number {
  const ok = state.meta[colId].orderKey;
  for (let i = 0; i < state.track.length; i++) {
    const id = state.track[i];
    if (state.meta[id].orderKey > ok) return i;
  }
  return state.track.length; // append
}

function syncHeaderTrack(state: ColumnLayoutState): void {
  // Mirror exactly. If you keep them separate objects:
  state.headerTrack = [...state.track];
  // If your UI allows, headerTrack can literally reference state.track.
}

function computeTotalTrackWidth(state: ColumnLayoutState): number {
  const n = state.track.length;
  if (n === 0) return 0;
  const colsWidth = n * state.columnWidth;
  const gaps = Math.max(0, n - 1) * state.gapWidth;
  return state.basePadding * 2 + colsWidth + gaps;
}

function computeViewportCols(state: ColumnLayoutState): number {
  const one = state.columnWidth + state.gapWidth;
  if (one <= 0) return 0;
  // Fit as many as possible; at least 1 if any columns exist.
  const inner = Math.max(0, state.viewportWidth - state.basePadding * 2 + state.gapWidth);
  const fit = Math.floor(inner / one);
  return Math.max(1, Math.min(fit, state.track.length));
}

function clampViewportStart(state: ColumnLayoutState, start: number): number {
  const maxStart = Math.max(0, state.track.length - state.viewportCols);
  return Math.min(Math.max(0, start), maxStart);
}
```

## Mutations (Toggle / Reorder)

```typescript
function toggleOn(state: ColumnLayoutState, colId: ColumnId): void {
  if (isActive(state, colId)) return;
  const idx = findInsertIndexByOrderKey(state, colId);
  state.track.splice(idx, 0, colId);
  syncHeaderTrack(state);
  // Recompute geometry
  state.totalTrackWidth = computeTotalTrackWidth(state);
  state.viewportCols = computeViewportCols(state);
  state.centered = state.totalTrackWidth < state.viewportWidth;
  // Keep the main translation visible if you want (optional):
  // ensureVisible(state, state.track.indexOf(2));
  state.viewportStartSlot = clampViewportStart(state, state.viewportStartSlot);
}

function toggleOff(state: ColumnLayoutState, colId: ColumnId): void {
  if (state.meta[colId]?.required) return; // refuse to remove mandatory
  const i = state.track.indexOf(colId);
  if (i === -1) return;
  state.track.splice(i, 1);
  syncHeaderTrack(state);
  // Recompute geometry
  state.totalTrackWidth = computeTotalTrackWidth(state);
  state.viewportCols = computeViewportCols(state);
  state.centered = state.totalTrackWidth < state.viewportWidth;
  state.viewportStartSlot = clampViewportStart(state, state.viewportStartSlot);
}

function reorder(state: ColumnLayoutState, colId: ColumnId, targetSlot: number): void {
  const from = state.track.indexOf(colId);
  if (from === -1) return;
  const to = Math.max(0, Math.min(targetSlot, state.track.length - 1));
  if (from === to) return;
  // Stable splice
  state.track.splice(from, 1);
  state.track.splice(to, 0, colId);
  syncHeaderTrack(state);
  // No change to column sizes; just ensure viewportStart still in range
  state.viewportStartSlot = clampViewportStart(state, state.viewportStartSlot);
}
```

## Horizontal Viewport (one-column shifts)

### Rule:
- If the entire track fits (`totalTrackWidth < viewportWidth`), we center the whole track container (landscape rule) but do not center headers separately. Headers and body share the same origin/transform so headers stay directly above their column.
- If it doesn't fit, we show left/right controls that shift by exactly one slot.

```typescript
function canScrollLeft(state: ColumnLayoutState): boolean {
  if (state.centered) return false;
  return state.viewportStartSlot > 0;
}

function canScrollRight(state: ColumnLayoutState): boolean {
  if (state.centered) return false;
  return state.viewportStartSlot + state.viewportCols < state.track.length;
}

function scrollLeftOne(state: ColumnLayoutState): void {
  if (!canScrollLeft(state)) return;
  state.viewportStartSlot = clampViewportStart(state, state.viewportStartSlot - 1);
}

function scrollRightOne(state: ColumnLayoutState): void {
  if (!canScrollRight(state)) return;
  state.viewportStartSlot = clampViewportStart(state, state.viewportStartSlot + 1);
}

// Optional: ensure a particular slot is visible (e.g., keep main translation in view)
function ensureVisible(state: ColumnLayoutState, slot: number): void {
  const start = state.viewportStartSlot;
  const end = start + state.viewportCols - 1;
  if (slot < start) {
    state.viewportStartSlot = clampViewportStart(state, slot);
  } else if (slot > end) {
    state.viewportStartSlot = clampViewportStart(state, slot - (state.viewportCols - 1));
  }
}
```

## Header & Body Sync (no drift)

**Principle:** Headers must track 1:1 with their column slots. They never have an independent centering rule. We achieve this by sharing the same horizontal origin (either a `transform: translateX(...)` or `scrollLeft` value).

```typescript
// Compute x-offset (in pixels) for a given slot within the current viewport.
function slotX(state: ColumnLayoutState, slot: number): number {
  // Base offset if centered; else 0 for left-aligned.
  const trackVisibleWidth = state.viewportCols * state.columnWidth +
                            Math.max(0, state.viewportCols - 1) * state.gapWidth;
  const total = state.totalTrackWidth;
  const centeredOffset = state.centered
    ? Math.floor((state.viewportWidth - trackVisibleWidth) / 2)
    : 0;

  const relativeIndex = slot - state.viewportStartSlot;
  if (relativeIndex < 0 || relativeIndex >= state.viewportCols) {
    // Offscreen; caller may choose not to render or to virtualize.
    return Infinity; // sentinel
  }

  const pos = state.basePadding + centeredOffset +
              relativeIndex * (state.columnWidth + state.gapWidth);

  return pos; // px from the left edge of the viewport container
}

// Render loop concept (both body cells and headers use the same slotX)
function render(state: ColumnLayoutState) {
  for (let slot = state.viewportStartSlot;
       slot < state.viewportStartSlot + state.viewportCols; slot++) {

    const colId = state.track[slot];
    const x = slotX(state, slot);
    if (!isFinite(x)) continue;

    // Body column container
    positionBodyColumn(colId, x, state.columnWidth);

    // Header column container — SAME x, SAME width
    positionHeaderColumn(colId, x, state.columnWidth);

    // If this is the Master (overlay) column:
    if (state.meta[colId]?.isOverlay) {
      positionOverlayColumn(colId, x, state.columnWidth);
      // Overlay can manage its own vertical scroll; horizontal alignment uses x.
    }
  }
}
```

**Key point:** Because both headers and body call the same `slotX()` with the same `viewportStartSlot`, `centered` flag, and dimensions, they cannot drift. If centered, the entire track (headers + body) receives the same offset. No separate centering for headers—alignment over their column takes priority.

## Resize Handling

```typescript
function onResize(state: ColumnLayoutState, newViewportWidth: number): void {
  state.viewportWidth = newViewportWidth;
  state.totalTrackWidth = computeTotalTrackWidth(state);
  state.viewportCols = computeViewportCols(state);
  state.centered = state.totalTrackWidth < state.viewportWidth;
  state.viewportStartSlot = clampViewportStart(state, state.viewportStartSlot);
}
```

We will only allow x2 resizing for now, either 2x the size of column width or original.

## Portrait Mode Nuance

If you enforce "# column + exactly 2 more columns" in portrait:

```typescript
function enforcePortraitWindow(state: ColumnLayoutState): void {
  if (state.mode === "portrait" || state.mode === "mobile-portrait") {
    state.viewportCols = Math.min(3, state.track.length); // # + 2 columns
    // If you require # column always visible at slot 0:
    const hashSlot = state.track.indexOf(0);
    if (hashSlot !== -1) {
      // Keep # column inside visible window (e.g., always the first visible)
      state.viewportStartSlot = clampViewportStart(state, hashSlot);
    }
  }
}
```

Call `enforcePortraitWindow(state)` after resize or mode changes.

## Example Defaults (orderKey & meta)

```typescript
const meta: Record<ColumnId, ColumnMeta> = {
  0:  { id: 0,  name: "# (Index)",        orderKey: 0 },
  1:  { id: 1,  name: "Notes",            orderKey: 10 },
  2:  { id: 2,  name: "Main",             orderKey: 20, required: true },
  3:  { id: 3,  name: "Alt 1",            orderKey: 30 },
  4:  { id: 4,  name: "Alt 2",            orderKey: 31 },
  // ...
  16: { id: 16, name: "Cross Refs",       orderKey: 80 },
  17: { id: 17, name: "Prophecy: Pred.",  orderKey: 90 },
  18: { id: 18, name: "Prophecy: Ful.",   orderKey: 91 },
  19: { id: 19, name: "Prophecy: Verify", orderKey: 92 },
  20: { id: 20, name: "Master (Overlay)", orderKey: 95, isOverlay: true },
};
```

## Minimal Lifecycle

```typescript
function initState(): ColumnLayoutState {
  const state: ColumnLayoutState = {
    mode: "landscape",
    track: [0, 2],          // at least Main; include # if desired
    headerTrack: [0, 2],
    viewportWidth: 1280,
    columnWidth: 420,
    gapWidth: 12,
    basePadding: 16,
    totalTrackWidth: 0,
    viewportCols: 0,
    viewportStartSlot: 0,
    centered: false,
    meta,
  };
  state.totalTrackWidth = computeTotalTrackWidth(state);
  state.viewportCols = computeViewportCols(state);
  state.centered = state.totalTrackWidth < state.viewportWidth;
  return state;
}
```

## TL;DR for Implementation

- **Maintain a single authoritative track**; keep headerTrack mirrored exactly.
- **Toggle ON** inserts by orderKey; **toggle OFF** removes (except id=2).
- **Reorder** performs a stable splice to a targetSlot.
- **When the track fits**, center the whole track container (not headers separately).
- **When it doesn't**, left align and use ← / → to shift viewportStartSlot by 1.
- **Compute both header and body x-positions** via the same `slotX()`, so headers can't drift from their columns.
- **Master (20)** aligns horizontally by slot, but can manage its own vertical scroll.