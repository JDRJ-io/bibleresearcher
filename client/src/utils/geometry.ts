/**
 * Single source of truth for scroll position and verse index calculations.
 * These helpers ensure consistency between anchor tracking and verse navigation.
 * 
 * Uses "row-middle anchor mode": verses are centered at (k + 0.5) * rowHeight
 */

/**
 * Calculate the sticky header offset for the current viewport
 * This must be consistent across all scroll calculations
 * @param scrollRootKind - Whether scrolling the window or a container
 * @returns The sticky header offset in pixels
 */
export function getStickyHeaderOffset(scrollRootKind: 'window' | 'container'): number {
  // No sticky headers when scrolling a container element
  if (scrollRootKind !== 'window') return 0;
  
  const isMobile = window.innerWidth <= 768;
  const isPortrait = window.innerHeight > window.innerWidth;
  
  // These values match the sticky header positions from bible.tsx
  if (!isPortrait) {
    // Landscape: TopHeader (50px) + PresetBar (48px) + ColumnHeaders (~40px) = ~138px
    return 138;
  } else if (isMobile) {
    // Mobile portrait: TopHeader (50px) + PresetBar (48px) + ColumnHeaders (~40px) = ~138px
    return 138;
  } else {
    // Desktop portrait: TopHeader (60px) + PresetBar (60px) + ColumnHeaders (~40px) = ~160px
    return 160;
  }
}

/**
 * Calculate which verse index is centered at a given scroll position
 * @param top - Current scroll top position
 * @param H - Container/viewport height
 * @param rowH - Current row height (may be scaled)
 * @param sticky - Sticky header offset (occludes top of viewport, shifts center down)
 * @returns The verse index that should be considered "centered"
 */
export function centerIndexFrom(
  top: number,
  H: number,
  rowH: number,
  sticky: number
): number {
  // Sticky header at top occludes viewport, so visible center is at top + (H + sticky)/2
  const centerY = top + (H + sticky) / 2;
  return Math.round(centerY / rowH - 0.5);
}

/**
 * Calculate the scroll position needed to center a specific verse index
 * @param k - Verse index to center
 * @param H - Container/viewport height
 * @param rowH - Current row height (may be scaled)
 * @param sticky - Sticky header offset (occludes top of viewport, shifts center down)
 * @returns The scroll top position that will center verse k
 */
export function scrollTopForIndex(
  k: number,
  H: number,
  rowH: number,
  sticky: number
): number {
  // Inverse of centerIndexFrom: place verse k's center at the visible center
  return (k + 0.5) * rowH - (H + sticky) / 2;
}

/**
 * Calculate effective row height in pixels (always integer)
 * @param base - Base row height in pixels
 * @param mult - Multiplier (0.5 to 2.0)
 * @returns Integer pixel value
 */
export function effectiveRowHeightPx(base: number, mult: number): number {
  return Math.round(base * mult);
}

/**
 * Calculate pixel position for a given verse index
 * @param idx - Verse index
 * @param rowH - Row height in pixels
 * @returns Pixel position
 */
export function pixelForIndex(idx: number, rowH: number): number {
  return idx * rowH;
}

/**
 * Calculate verse index for a given pixel position
 * @param y - Pixel position
 * @param rowH - Row height in pixels
 * @returns Verse index (clamped to 0)
 */
export function indexForPixel(y: number, rowH: number): number {
  return Math.max(0, Math.floor(y / rowH));
}
