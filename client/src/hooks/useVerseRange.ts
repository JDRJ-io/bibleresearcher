import { useEffect, useState } from 'react';
import { VerseData } from '@/types/bible';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';

interface UseVerseRangeReturn {
  verses: VerseData[];
  crossRefs: Map<string, any>;
  prophecy: Map<string, any>;
  isLoading: boolean;
}

export function useVerseRange(slice: string[]): UseVerseRangeReturn {
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [crossRefs, setCrossRefs] = useState<Map<string, any>>(new Map());
  const [prophecy, setProphecy] = useState<Map<string, any>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const { mainTranslation, alternates } = useTranslationMaps();

  useEffect(() => {
    if (slice.length === 0) return;

    const loadVerseRange = async () => {
      setIsLoading(true);
      try {
        // Combine loaders - when fetching verses for the visible slice, also fire parallel calls
        const [versesData, crossRefsData, prophecyData] = await Promise.all([
          loadVerses(slice),
          loadCrossRefs(slice),
          loadProphecy(slice)
        ]);

        setVerses(versesData);
        setCrossRefs(crossRefsData);
        setProphecy(prophecyData);
      } catch (error) {
        console.error('Failed to load verse range:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVerseRange();
  }, [slice, mainTranslation, alternates]);

  const loadVerses = async (verseIds: string[]): Promise<VerseData[]> => {
    // Load verse text for all active translations
    const activeTranslations = [mainTranslation, ...alternates];
    const versePromises = verseIds.map(async (id) => {
      const textMap: Record<string, string> = {};
      
      // Load text for each active translation
      for (const translation of activeTranslations) {
        try {
          const text = await loadVerseText(id, translation);
          textMap[translation] = text;
        } catch (error) {
          textMap[translation] = 'Loading...';
        }
      }

      return {
        id,
        index: parseInt(id.split('-')[3]) || 0,
        book: id.split('-')[0],
        chapter: parseInt(id.split('-')[1]) || 1,
        verse: parseInt(id.split('-')[2]) || 1,
        reference: `${id.split('-')[0]} ${id.split('-')[1]}:${id.split('-')[2]}`,
        text: textMap,
        crossReferences: [],
        strongsWords: [],
        labels: [],
        contextGroup: 'standard'
      };
    });

    return Promise.all(versePromises);
  };

  const loadVerseText = async (verseId: string, translation: string): Promise<string> => {
    // This would normally fetch from your Bible data API
    return `Sample text for ${verseId} in ${translation}`;
  };

  const loadCrossRefs = async (verseIds: string[]): Promise<Map<string, any>> => {
    // Load cross-references for the slice
    const crossRefsMap = new Map();
    // Implementation would fetch actual cross-reference data
    return crossRefsMap;
  };

  const loadProphecy = async (verseIds: string[]): Promise<Map<string, any>> => {
    // Load prophecy data for the slice
    const prophecyMap = new Map();
    // Implementation would fetch actual prophecy data
    return prophecyMap;
  };

  return {
    verses,
    crossRefs,
    prophecy,
    isLoading
  };
}