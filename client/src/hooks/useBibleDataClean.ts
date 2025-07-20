import { useState, useEffect, useCallback } from "react";
import type { BibleVerse, Translation } from "@/types/bible";

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade as per documentation
// No global variables, no duplicate loading, single source of truth

export function useBibleData() {
  const [isLoading, setIsLoading] = useState(true);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTranslations, setActiveTranslations] = useState<Translation[]>([]);
  const [mainTranslation, setMainTranslation] = useState("KJV");

  // Get verse text using ONLY BibleDataAPI cache
  const getVerseText = useCallback(async (reference: string, translationCode: string): Promise<string> => {
    try {
      const { getTranslation } = await import('@/data/BibleDataAPI');
      const translationMap = getTranslation(translationCode);
      
      if (!translationMap) {
        return `[${reference} - Loading...]`;
      }
      
      // Try different reference formats
      const formats = [
        reference,
        reference.replace(/\s/g, "."), // "Gen 1:1" -> "Gen.1:1"
        reference.replace(/\./g, " "), // "Gen.1:1" -> "Gen 1:1"
      ];
      
      for (const format of formats) {
        const text = translationMap.get(format);
        if (text) {
          return text;
        }
      }
      
      return `[${reference} - Loading...]`;
    } catch (error) {
      console.error(`Error getting verse text for ${reference}:`, error);
      return `[${reference} - Error]`;
    }
  }, []);

  // Load translation using ONLY BibleDataAPI
  const ensureTranslationLoaded = useCallback(async (translationCode: string) => {
    try {
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      const translationMap = await loadTranslation(translationCode);
      console.log(`✅ Translation ${translationCode} ensured loaded: ${translationMap.size} verses`);
      return translationMap;
    } catch (error) {
      console.error(`Failed to load translation ${translationCode}:`, error);
      throw error;
    }
  }, []);

  // Initialize with verse keys only - text loads on demand
  useEffect(() => {
    const initializeBible = async () => {
      try {
        setIsLoading(true);
        
        // Load verse keys foundation
        const { loadVerseKeys } = await import('@/data/BibleDataAPI');
        const verseKeys = await loadVerseKeys();
        
        // Create verse objects from keys
        const verseObjects = verseKeys.map((key, index) => {
          const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
          if (!match) return null;
          
          const [, book, chapter, verse] = match;
          return {
            id: `${book.toLowerCase()}-${chapter}-${verse}-${index}`,
            index,
            book,
            chapter: parseInt(chapter),
            verse: parseInt(verse),
            reference: `${book} ${chapter}:${verse}`,
            text: {},
            crossReferences: [],
            strongsWords: [],
            labels: [],
            contextGroup: "standard"
          };
        }).filter(Boolean) as BibleVerse[];
        
        setVerses(verseObjects);
        
        // Ensure KJV is loaded for main translation
        await ensureTranslationLoaded('KJV');
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing Bible:", err);
        setError(err instanceof Error ? err.message : "Failed to load Bible data");
        setIsLoading(false);
      }
    };

    initializeBible();
  }, [ensureTranslationLoaded]);

  return {
    isLoading,
    verses,
    error,
    activeTranslations,
    mainTranslation,
    getVerseText,
    ensureTranslationLoaded,
    // Simplified interface - only essential functions
    setMainTranslation,
    setActiveTranslations
  };
}