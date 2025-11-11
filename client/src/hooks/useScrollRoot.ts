import { useEffect, useMemo, useRef, useCallback } from 'react';

// Always use container scroll for consistent behavior across all orientations
// Container will be made scrollable via CSS in portrait mode
function defaultSelector(): 'window' | 'container' {
  return 'container';
}

export type ScrollRoot = {
  // read
  getScrollTop(): number;
  getScrollHeight(): number;
  getClientHeight(): number;
  // write
  scrollToTop(y: number, smooth?: boolean): void;
  // events
  addScrollListener(fn: () => void): () => void;
  // element (useful for refs / scrollIntoView)
  node(): HTMLElement | Window;
  // id
  kind: 'window' | 'container';
};

export function useScrollRoot(containerRef: React.RefObject<HTMLElement>, force?: 'window'|'container'): ScrollRoot {
  const kind = force ?? defaultSelector();

  const getScrollTop = useCallback(() => {
    if (kind === 'window') return window.scrollY || document.documentElement.scrollTop || 0;
    const el = containerRef.current;
    return el?.scrollTop ?? 0;
  }, [kind, containerRef]);

  const getScrollHeight = useCallback(() => {
    if (kind === 'window') return Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
    const el = containerRef.current;
    return el?.scrollHeight ?? 0;
  }, [kind, containerRef]);

  const getClientHeight = useCallback(() => {
    if (kind === 'window') return window.innerHeight;
    const el = containerRef.current;
    return el?.clientHeight ?? 0;
  }, [kind, containerRef]);

  const scrollToTop = useCallback((y: number, smooth = true) => {
    if (kind === 'window') {
      window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    } else {
      const el = containerRef.current;
      if (el) el.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
    }
  }, [kind, containerRef]);

  const addScrollListener = useCallback((fn: () => void) => {
    const target: any = kind === 'window' ? window : containerRef.current;
    if (!target) return () => {};
    // passive, rAF-throttled
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; fn(); });
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [kind, containerRef]);

  const node = useCallback(() => (kind === 'window' ? window : (containerRef.current as HTMLElement)), [kind, containerRef]);

  return useMemo(() => ({
    getScrollTop, getScrollHeight, getClientHeight, scrollToTop, addScrollListener, node, kind
  }), [getScrollTop, getScrollHeight, getClientHeight, scrollToTop, addScrollListener, node, kind]);
}