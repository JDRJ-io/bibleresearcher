import React from 'react';
import { ROW_HEIGHT } from '@/constants/layout';
import { getVerseKeys } from '@/lib/verseKeysLoader';

export function makeScrollToVerse(containerRef: React.RefObject<HTMLDivElement>) {
  const verseKeys = getVerseKeys();

  return (ref: string) => {
    const container = containerRef.current;
    if (!container) return;
    
    const idx = verseKeys.findIndex(k => k === ref || k.replace(/\./g,' ') === ref || k.replace(/\s/g,'.') === ref);
    if (idx === -1) return;

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