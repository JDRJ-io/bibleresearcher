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
  verses: BibleVerse[], 
  getGlobalVerseText?: (verseId: string) => string
): UseRowDataReturn {
  
  return useMemo(() => {
    console.log('🔄 useRowData: Processing', verseIDs.length, 'verses for chunk');
    
    const rowData: UseRowDataReturn = {};
    
    for (const verseId of verseIDs) {
      // Find verse by ID or reference - try multiple matching patterns
      const verse = verses.find(v => 
        v.id === verseId || 
        v.reference === verseId ||
        `${v.book}.${v.chapter}:${v.verse}` === verseId
      );
      
      if (verse) {
        // Get text using the global text loader if available
        const text = getGlobalVerseText ? getGlobalVerseText(verseId) : '';
        
        rowData[verseId] = {
          ...verse,
          text: text ? { KJV: text } : verse.text
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
  }, [verseIDs, verses, getGlobalVerseText]);
}