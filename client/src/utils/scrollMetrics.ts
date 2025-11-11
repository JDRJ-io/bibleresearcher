/**
 * Scroll metrics utilities for proper anchor calculation
 * Accounts for sticky headers, content offset, and viewport in all scroll modes
 */

export type ScrollMetrics = {
  scrollTop: number;
  viewport: number;
  contentTopInPage: number; // pageY of the content root
};

/**
 * Get scroll metrics accounting for page vs container scroll
 * In portrait mode with container scroll, we need to account for:
 * - Fixed header offset
 * - Content position in page
 * - Visual viewport height (iOS Safari)
 */
export function getScrollMetrics(contentEl: HTMLElement | null): ScrollMetrics {
  if (!contentEl) {
    return {
      scrollTop: 0,
      viewport: typeof window !== 'undefined' ? window.innerHeight : 600,
      contentTopInPage: 0
    };
  }

  // Read actual scroll position from container
  const scrollTop = contentEl.scrollTop || 0;

  // Get viewport height (iOS Safari safe)
  const viewport = (typeof window !== 'undefined' 
    ? (window.visualViewport?.height ?? window.innerHeight)
    : 600) | 0;

  // Get where content starts relative to page (accounts for margin-top)
  const rect = contentEl.getBoundingClientRect();
  const pageYOffset = window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
  const contentTopInPage = Math.round(rect.top + pageYOffset);

  return {
    scrollTop,
    viewport,
    contentTopInPage
  };
}

/**
 * Get total height of sticky/fixed headers from CSS variables
 * Portrait mode: top-header + column-header + preset-bar
 */
export function getStickyOffsetsPx(): number {
  if (typeof window === 'undefined') return 0;

  const cs = getComputedStyle(document.documentElement);
  
  // Read from CSS variables
  const topHeader = parseInt(cs.getPropertyValue('--top-header-height-mobile')) || 48;
  const columnHeader = parseInt(cs.getPropertyValue('--column-header-height')) || 20;
  // Preset bar height is included in column header area in portrait mode
  
  return topHeader + columnHeader;
}

/**
 * Calculate effective scroll position within the Bible content
 * This accounts for:
 * - Container scroll position
 * - Fixed header heights (only relevant if headers overlap content)
 * - Content offset from page top (margin-top in portrait)
 */
export function getEffectiveScrollTop(contentEl: HTMLElement | null): number {
  const { scrollTop } = getScrollMetrics(contentEl);
  
  // For container scroll, scrollTop is already relative to content start
  // No offset adjustment needed since container.scrollTop = 0 is already at first verse
  return Math.max(0, scrollTop);
}
