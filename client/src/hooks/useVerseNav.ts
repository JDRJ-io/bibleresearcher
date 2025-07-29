import { useEffect, useRef } from 'react';
import { getVerseKeys } from '@/lib/verseKeysLoader';

type ScrollToFn = (ref: string) => void;

export function useVerseNav(scrollToVerse: ScrollToFn) {
  const verseKeys = getVerseKeys();
  const lastPushed = useRef<string | null>(null);

  // Call this when a link is clicked
  const goTo = (ref: string) => {
    // Normalize ref if you have dot/space formats
    const norm = ref.trim();
    if (norm && norm !== lastPushed.current) {
      window.history.pushState({ ref: norm }, '', `#${norm}`);
      lastPushed.current = norm;
    }
    scrollToVerse(norm);
  };

  // Handle back/forward (or manual history.back())
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const ref = (e.state && e.state.ref) || window.location.hash.slice(1);
      if (ref) {
        scrollToVerse(ref);
        lastPushed.current = ref; // keep sync
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [scrollToVerse]);

  return { goTo };
}