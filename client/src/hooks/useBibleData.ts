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

        setVerses(verseObjects);
        setIsLoading(false);
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