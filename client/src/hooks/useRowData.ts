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
    // 0. Two-line polish for useRowData (optional but cheap)
    const rowMap = new Map(verses.map((v: BibleVerse) => [v.id, v]));
    
    // Result: O(1) lookup per row, removes the last per-render loop over verses.find()
    const rowData: UseRowDataReturn = {};
    
    for (const verseId of verseIDs) {
      // Use Map lookup instead of verses.find() for O(1) performance
      const verse = rowMap.get(verseId) || verses.find(v => 
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