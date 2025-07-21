import { useState, useEffect } from "react";
import type { BibleVerse, Translation } from "@/types/bible";

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade as per documentation
// Remove all legacy loading methods

export function useBibleData() {
  const [isLoading, setIsLoading] = useState(true);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBibleStructure = async () => {
      try {
        // Use ONLY BibleDataAPI - single source of truth
        const { loadVerseKeys } = await import('@/data/BibleDataAPI');
        const verseKeys = await loadVerseKeys();

        // Convert keys to verse objects with robust reference parsing
        const verseObjects = verseKeys.map((reference, index) => {
          // Safety check for valid reference string
          if (!reference || typeof reference !== 'string') {
            console.warn(`Invalid reference at index ${index}:`, reference);
            return {
              id: `${index}`,
              reference: reference || '',
              book: 'Unknown',
              chapter: 0,
              verse: 0,
              text: {}
            };
          }

          // Robust parser - supports "Gen.1:1" or "Genesis 1:1"
          const [bookPart, chapterVerse] = reference.includes(' ')
            ? reference.split(' ')
            : reference.split('.');

          if (!chapterVerse || !chapterVerse.includes(':')) {
            console.warn(`Invalid chapter:verse format in reference: ${reference}`);
            return {
              id: `${index}`,
              reference,
              book: bookPart || 'Unknown',
              chapter: 0,
              verse: 0,
              text: {}
            };
          }

          const [chapterStr, verseStr] = chapterVerse.split(':');
          const book = bookPart || 'Unknown';
          const chapter = Number(chapterStr) || 0;
          const verse = Number(verseStr) || 0;

          return {
            id: `${index}`,
            reference,
            book,
            chapter,
            verse,
            text: {} // Text loaded on-demand via BibleDataAPI
          };
        });

        // Ensure we have all verses loaded
        console.log(`📊 Loaded ${verseObjects.length} verse objects`);
        setVerses(verseObjects);
        setIsLoading(false);
        
        // Pre-load main translation for first 100 verses for immediate display
        if (verseObjects.length > 0) {
          const { loadTranslation } = await import('@/data/BibleDataAPI');
          try {
            const kjvMap = await loadTranslation('KJV');
            const updatedVerses = verseObjects.slice(0, 100).map(verse => ({
              ...verse,
              text: {
                ...verse.text,
                KJV: kjvMap.get(verse.reference) || ''
              }
            }));
            
            // Update just the first 100 verses with actual text
            setVerses(prev => [
              ...updatedVerses,
              ...prev.slice(100)
            ]);
          } catch (error) {
            console.warn('Failed to pre-load KJV text:', error);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Bible structure');
        setIsLoading(false);
      }
    };

    loadBibleStructure();
  }, []);

  return {
    isLoading,
    verses,
    error
  };
}