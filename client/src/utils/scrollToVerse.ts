import React from 'react';
import { ROW_HEIGHT } from '@/constants/layout';
import { getVerseKeys } from '@/lib/verseKeysLoader';

export function makeScrollToVerse(containerRef: React.RefObject<HTMLDivElement>) {
  const verseKeys = getVerseKeys();

  return (ref: string) => {
    const container = containerRef.current;
    if (!container) {
      console.log('📜 scrollToVerse: No container found');
      return;
    }
    
    console.log('📜 scrollToVerse called with:', ref);
    
    // Direct lookup - all verses are in dot format "Gen.1:1"
    const idx = verseKeys.findIndex(k => k === ref);
    console.log('📜 scrollToVerse verse index:', idx, 'out of', verseKeys.length, 'verses');
    
    if (idx === -1) {
      console.log('📜 scrollToVerse: Verse not found:', ref);
      console.log('📜 First few verseKeys:', verseKeys.slice(0, 10));
      console.log('📜 Sample keys around John:', verseKeys.filter(k => k.includes('John')).slice(0, 5));
      return;
    }

    const containerH = container.clientHeight;
    const target = (idx * ROW_HEIGHT) - (containerH / 2) + (ROW_HEIGHT / 2);

    // Use scrollTop assignment for better compatibility
    container.scrollTop = Math.max(0, target);

    // optional flash
    setTimeout(() => {
      const el = document.querySelector(`[data-verse-ref="${ref}"]`) as HTMLElement | null;
      if (el) {
        el.classList.add('verse-highlight-flash');
        setTimeout(() => el.classList.remove('verse-highlight-flash'), 400);
      }
    }, 25);
  };
}