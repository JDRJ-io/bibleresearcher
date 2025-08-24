// Column scroll navigation utility
// Enables horizontal scrolling by exact column positions instead of slicing

export type ScrollNavOpts = {
  headerEl: HTMLElement;    // sticky header scroller
  bodyEl: HTMLElement;      // rows scroller  
  navigableKeys: string[];  // everything except 'reference' (and 'index' if you have it)
};

export function makeColumnScroller({ headerEl, bodyEl, navigableKeys }: ScrollNavOpts) {
  const getTrackLefts = () => {
    // read left positions from header cells (use a data attribute on each header cell)
    const lefts: number[] = [];
    for (const key of navigableKeys) {
      // Try multiple selectors to find the column header
      const cell = headerEl.querySelector<HTMLElement>(`.col-header[data-col-key="${key}"]`) ||
                   headerEl.querySelector<HTMLElement>(`[data-column="${key}"]`) ||
                   headerEl.querySelector<HTMLElement>(`[data-type="${key}"]`) ||
                   headerEl.querySelector<HTMLElement>(`.column-header-cell[data-column="${key}"]`);
      if (!cell) {
        console.log(`Column header not found for key: ${key}`);
        continue;
      }
      // left position relative to the scrolling container
      lefts.push(cell.offsetLeft);
    }
    return lefts.sort((a, b) => a - b);
  };

  const sync = () => { 
    headerEl.scrollLeft = bodyEl.scrollLeft; 
  };
  
  // Set up bidirectional sync
  bodyEl.addEventListener('scroll', sync, { passive: true });
  
  const step = (dir: -1 | 1) => {
    const lefts = getTrackLefts();
    const curr = bodyEl.scrollLeft;
    if (!lefts.length) return;

    if (dir > 0) {
      // next visible track strictly to the right
      const next = lefts.find(L => L > curr + 1);
      if (next != null) bodyEl.scrollTo({ left: next, behavior: 'smooth' });
    } else {
      // nearest track strictly to the left
      const prev = [...lefts].reverse().find(L => L < curr - 1);
      if (prev != null) bodyEl.scrollTo({ left: prev, behavior: 'smooth' });
    }
  };

  const getVisibleRange = () => {
    const lefts = getTrackLefts();
    const curr = bodyEl.scrollLeft;
    const containerWidth = bodyEl.clientWidth;
    
    // Find first visible column
    const startIdx = Math.max(0, lefts.findIndex(L => L >= curr - 10)); // -10px tolerance
    
    // Find last visible column
    let endIdx = startIdx;
    for (let i = startIdx; i < lefts.length; i++) {
      if (lefts[i] <= curr + containerWidth + 10) { // +10px tolerance
        endIdx = i;
      } else {
        break;
      }
    }
    
    return {
      start: startIdx + 1, // 1-based for display
      end: endIdx + 1,
      total: navigableKeys.length,
      canGoLeft: curr > 10,
      canGoRight: curr + containerWidth < (lefts[lefts.length - 1] || 0) + 100
    };
  };

  return {
    left: () => step(-1),
    right: () => step(1),
    getVisibleRange,
    destroy: () => bodyEl.removeEventListener('scroll', sync),
  };
}