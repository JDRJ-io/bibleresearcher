export type WindowPolicy = {
  renderAbove: number;
  renderBelow: number;
  prefetchBefore: number;
  prefetchAfter: number;
  extendChunk: number;
  hysteresisRows: number;
  cacheCap: number;
};

export function choosePolicy(
  deviceMemory = (navigator as any).deviceMemory ?? 4, 
  direction: 1 | -1, 
  fast: boolean
): WindowPolicy {
  const mobile = deviceMemory <= 4;
  const fastFactor = fast ? 2 : 1;

  // Balanced prefetching - smooth scrolling without performance issues
  if (mobile) {
    return {
      renderAbove: 50,
      renderBelow: 70,
      prefetchBefore: 200, // Moderate prefetch - sufficient for smooth scrolling
      prefetchAfter: 300 * fastFactor, // 300-600 verses ahead based on speed
      extendChunk: 100, // Smaller chunks for faster individual loads
      hysteresisRows: 80, // Reload when user hits 80 verses from center - responsive but not excessive
      cacheCap: 2000, // Reasonable cache size
    };
  }
  // desktop - slightly more aggressive but still performance-conscious
  return {
    renderAbove: 80,
    renderBelow: 120,
    prefetchBefore: 300, // Decent buffer without overwhelming the browser
    prefetchAfter: 400 * fastFactor, // 400-800 verses ahead based on speed
    extendChunk: 150, // Fast loading without huge downloads
    hysteresisRows: 100, // Reload when user hits 100 verses from center
    cacheCap: 3000, // Good cache size without excessive memory usage
  };
}

export function computeWindows(anchor: number, policy: WindowPolicy) {
  return {
    renderStart: Math.max(0, anchor - policy.renderAbove),
    renderEnd: anchor + policy.renderBelow,
    prefetchStart: Math.max(0, anchor - policy.prefetchBefore),
    prefetchEnd: anchor + policy.prefetchAfter,
  };
}