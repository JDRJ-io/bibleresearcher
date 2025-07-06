import { useMemo } from 'react';
import { BibleVerse } from '../types/bible';

interface UseRowDataReturn {
  [verseId: string]: BibleVerse;
}

/**
 * useRowData: TanStack Query caches maps
 * Direct map.get(id) lookups against existing verse data - maintains current interface
 */
export function useRowData(
  verseIDs: string[], 
  verses: BibleVerse[]
): UseRowDataReturn {
  
  return useMemo(() => {
    // 2-C. Performance guard
    if (process.env.NODE_ENV === 'development' && verseIDs.length > 250) {
      console.warn('Anchor slice too large:', verseIDs.length);
    }
    
    console.log('🔄 useRowData: Processing', verseIDs.length, 'verses for chunk');
    
    // 2-B. replace the verses.find() loop with:
    const verseMap = new Map(verses.map(v => [v.id, v]));
    
    const rowData: UseRowDataReturn = {};
    
    for (const verseId of verseIDs) {
      // 2-B. Use Map lookup instead of verses.find() for O(1) performance
      const verse = verseMap.get(verseId) || verses.find(v => 
        v.reference === verseId ||
        `${v.book}.${v.chapter}:${v.verse}` === verseId
      );
      
      if (verse) {
        // Use existing verse text - translation maps will handle text loading separately
        rowData[verseId] = {
          ...verse,
          text: verse.text || {}
        };
      } else {
        // Create fallback verse data if not found
        console.warn(`⚠️ Verse not found for ID: ${verseId}`);
        const [bookChapter, verseNum] = verseId.split(':');
        const [book, chapter] = bookChapter?.split('.') || ['Unknown', '1'];
        
        rowData[verseId] = {
          id: verseId,
          index: 0,
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
    }
    
    console.log('✓ useRowData: Processed', Object.keys(rowData).length, 'verses with text');
    return rowData;
  }, [verseIDs, verses]);
}