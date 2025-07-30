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
    
    // Try multiple format variations to find the verse
    const variations = [
      ref,                           // Original format (e.g., "John.1:1")
      ref.replace(/\./g, ' '),       // Dot to space (e.g., "John 1:1")  
      ref.replace(/\s/g, '.'),       // Space to dot (e.g., "John.1:1")
      ref.replace(/(\w+)\.(\d+):(\d+)/, '$1 $2:$3'), // "John.1:1" -> "John 1:1"
      ref.replace(/(\w+)\s(\d+):(\d+)/, '$1.$2:$3')  // "John 1:1" -> "John.1:1"
    ];
    
    let idx = -1;
    let foundVariation = '';
    
    for (const variation of variations) {
      idx = verseKeys.findIndex(k => k === variation);
      if (idx !== -1) {
        foundVariation = variation;
        break;
      }
    }
    
    console.log('📜 scrollToVerse variations tried:', variations);
    console.log('📜 scrollToVerse found at index:', idx, 'with variation:', foundVariation);
    
    if (idx === -1) {
      console.log('📜 scrollToVerse: Verse not found:', ref, 'First few keys:', verseKeys.slice(0, 10));
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