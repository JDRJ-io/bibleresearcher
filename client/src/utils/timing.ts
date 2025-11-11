/**
 * Timing utilities for debouncing and throttling
 * Optimizes scroll-triggered operations to prevent performance lag
 */

/**
 * Debounces a function - delays execution until after the specified time has elapsed
 * since the last call. Useful for expensive operations that shouldn't run on every event.
 * 
 * @param fn Function to debounce
 * @param ms Delay in milliseconds
 * @returns Debounced function
 * 
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   // This only runs 300ms after the user stops typing
 *   searchAPI(query);
 * }, 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function debounced(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Throttles a function - ensures it runs at most once per specified time period.
 * Useful for high-frequency events like scroll where you need regular updates
 * but not on every single event.
 * 
 * @param fn Function to throttle
 * @param ms Minimum time between executions in milliseconds
 * @returns Throttled function
 * 
 * @example
 * const throttledScroll = throttle(() => {
 *   // This runs at most once every 100ms during scroll
 *   updateScrollPosition();
 * }, 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  let queued: Parameters<T> | null = null;
  let queuedTimeout: ReturnType<typeof setTimeout> | null = null;
  
  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun;
    
    // If enough time has passed, run immediately
    if (timeSinceLastRun >= ms) {
      lastRun = now;
      fn(...args);
      return;
    }
    
    // Otherwise, queue it to run after the remaining time
    queued = args;
    
    if (!queuedTimeout) {
      queuedTimeout = setTimeout(() => {
        const timeNow = Date.now();
        if (timeNow - lastRun >= ms && queued) {
          lastRun = timeNow;
          fn(...queued);
          queued = null;
        }
        queuedTimeout = null;
      }, ms - timeSinceLastRun);
    }
  };
}

/**
 * Creates a stable token from an array to use in React dependency arrays.
 * Avoids expensive array.join() operations on every render.
 * 
 * @param arr Array to create token from
 * @returns Stable string token
 * 
 * @example
 * const token = useMemo(() => 
 *   createArrayToken(verseKeys), 
 *   [verseKeys.length, verseKeys[0], verseKeys[verseKeys.length - 1]]
 * );
 */
export function createArrayToken(arr: string[]): string {
  if (arr.length === 0) return 'empty';
  if (arr.length === 1) return arr[0];
  return `${arr[0]}-${arr[arr.length - 1]}-${arr.length}`;
}

/**
 * Creates a stable token from multiple arrays/values for dependency tracking
 * 
 * @param items Items to create token from
 * @returns Stable string token
 */
export function createDependencyToken(...items: any[]): string {
  return items.map(item => {
    if (Array.isArray(item)) return createArrayToken(item);
    if (typeof item === 'object' && item !== null) return JSON.stringify(item);
    return String(item);
  }).join('|');
}
