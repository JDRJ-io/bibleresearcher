import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BibleVerse } from '../types/bible';
import { loadTranslation } from '../lib/translationLoader';

/**
 * Hook that loads data for verses in the current chunk
 * Side-effect fetches inside useRowData only request missing verses for the current slice
 */
export function useRowData(verseIDs: string[], verses: BibleVerse[]) {
  // Create a map of verse data keyed by verse ID
  const rowData = useMemo(() => {
    const dataMap: Record<string, BibleVerse> = {};
    
    verseIDs.forEach(verseId => {
      // Find the verse in the main verses array
      const verse = verses.find(v => 
        v.reference === verseId || 
        v.id === verseId ||
        `${v.book}.${v.chapter}:${v.verse}` === verseId
      );
      
      if (verse) {
        dataMap[verseId] = verse;
      } else {
        // Create a skeleton verse for missing data
        const [bookChapter, verseNum] = verseId.split(':');
        const [book, chapter] = bookChapter.split('.');
        
        dataMap[verseId] = {
          id: verseId,
          book: book || 'Unknown',
          chapter: parseInt(chapter) || 1,
          verse: parseInt(verseNum) || 1,
          reference: verseId,
          text: {},
          crossReferences: [],
          strongsWords: [],
          labels: [],
          contextGroup: 'standard'
        };
      }
    });
    
    return dataMap;
  }, [verseIDs, verses]);

  // Query to load verse text for missing translations
  const { data: verseTextData, isLoading } = useQuery({
    queryKey: ['verse-text', verseIDs],
    queryFn: async () => {
      console.log(`🔄 useRowData: Loading text for ${verseIDs.length} verses:`, verseIDs.slice(0, 5));
      const textData: Record<string, Record<string, string>> = {};
      
      for (const verseId of verseIDs) {
        const verse = rowData[verseId];
        if (verse) {
          textData[verseId] = { ...verse.text };
          
          // Try to load KJV text if missing
          if (!verse.text.KJV) {
            try {
              // Load KJV translation and get text for this verse
              const kjvMap = await loadTranslation('KJV');
              const kjvText = kjvMap.get(verseId) || kjvMap.get(verse.reference) || kjvMap.get(`${verse.book}.${verse.chapter}:${verse.verse}`);
              if (kjvText && kjvText !== 'Loading...' && kjvText !== 'Verse not found') {
                textData[verseId].KJV = kjvText;
              }
            } catch (error) {
              console.warn(`Failed to load KJV text for ${verseId}:`, error);
            }
          }
        }
      }
      
      console.log(`✓ useRowData: Loaded text for ${Object.keys(textData).length} verses`);
      return textData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: verseIDs.length > 0
  });

  // Merge text data back into row data
  const enrichedRowData = useMemo(() => {
    if (!verseTextData) return rowData;
    
    const enriched: Record<string, BibleVerse> = {};
    
    Object.keys(rowData).forEach(verseId => {
      enriched[verseId] = {
        ...rowData[verseId],
        text: {
          ...rowData[verseId].text,
          ...verseTextData[verseId]
        }
      };
    });
    
    return enriched;
  }, [rowData, verseTextData]);

  return enrichedRowData;
}