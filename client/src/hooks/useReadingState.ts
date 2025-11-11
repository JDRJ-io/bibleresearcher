import { useEffect, useRef } from 'react';
import { useVerseNav } from './useVerseNav';

export function useReadingState() {
  // Get current anchor index from localStorage since useVerseNav doesn't expose it
  const getCurrentAnchorIndex = () => {
    const saved = JSON.parse(localStorage.getItem('readingState') ?? 'null');
    return saved?.anchorIndex || 0;
  };
  
  const historyRef = useRef<number[]>(JSON.parse(localStorage.getItem('history') ?? '[]'));

  // TEMPORARILY DISABLED: Restore reading state on mount to fix scroll position issue
  useEffect(() => {
    // const saved = JSON.parse(localStorage.getItem('readingState') ?? 'null');
    // if (saved) {
    //   window.requestAnimationFrame(() => {
    //     const vScroll = document.querySelector('#v-scroll');
    //     const hScroll = document.querySelector('#h-scroll');
    //     if (vScroll) vScroll.scrollTo({ top: saved.scrollY });
    //     if (hScroll) hScroll.scrollTo({ left: saved.scrollX });
    //   });
    // }
  }, []);

  // Debounced autosave every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const currentAnchorIndex = getCurrentAnchorIndex();
      
      // Push anchor into 10-item history
      historyRef.current = [currentAnchorIndex, ...historyRef.current.filter(i => i !== currentAnchorIndex)].slice(0, 10);
      localStorage.setItem('history', JSON.stringify(historyRef.current));

      // Save current scroll positions
      const vScroll = document.querySelector('#v-scroll');
      const hScroll = document.querySelector('#h-scroll');
      
      localStorage.setItem('readingState', JSON.stringify({
        anchorIndex: currentAnchorIndex,
        scrollY: vScroll?.scrollTop ?? 0,
        scrollX: hScroll?.scrollLeft ?? 0,
        timestamp: Date.now()
      }));
    }, 60_000); // 60 seconds

    return () => clearInterval(timer);
  }, []);

  // Save immediately on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentAnchorIndex = getCurrentAnchorIndex();
      const vScroll = document.querySelector('#v-scroll');
      const hScroll = document.querySelector('#h-scroll');
      
      localStorage.setItem('readingState', JSON.stringify({
        anchorIndex: currentAnchorIndex,
        scrollY: vScroll?.scrollTop ?? 0,
        scrollX: hScroll?.scrollLeft ?? 0,
        timestamp: Date.now()
      }));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    history: historyRef.current,
    clearHistory: () => {
      historyRef.current = [];
      localStorage.removeItem('history');
    }
  };
}