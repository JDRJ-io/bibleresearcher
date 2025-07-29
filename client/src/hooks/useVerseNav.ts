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
    console.log('🚀 useVerseNav goTo called with:', ref, 'normalized:', norm, 'lastPushed:', lastPushed.current);
    
    if (norm && norm !== lastPushed.current) {
      window.history.pushState({ ref: norm }, '', `#${norm}`);
      lastPushed.current = norm;
      console.log('🚀 useVerseNav pushed to history:', norm, 'total history length:', window.history.length);
    }
    scrollToVerse(norm);
  };

  // Handle back/forward (or manual history.back())
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      console.log('🔙 useVerseNav popstate triggered:', e.state, 'hash:', window.location.hash);
      const ref = (e.state && e.state.ref) || window.location.hash.slice(1);
      if (ref) {
        console.log('🔙 useVerseNav navigating to:', ref);
        scrollToVerse(ref);
        lastPushed.current = ref; // keep sync
      } else {
        console.log('🔙 useVerseNav no ref found in popstate');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [scrollToVerse]);

  return { goTo };
}