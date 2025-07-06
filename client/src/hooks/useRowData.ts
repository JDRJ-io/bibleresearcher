import { useMemo } from 'react';
import { BibleVerse } from '../types/bible';

/**
 * Hook that loads data for verses in the current chunk
 * Side-effect fetches inside useRowData only request missing verses for the current slice
 */
export function useRowData(verseIDs: string[], verses: BibleVerse[], getGlobalVerseText?: (verseId: string, translation: string) => string) {
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

  // Enhanced row data with text loading using existing translation maps
  const enrichedRowData = useMemo(() => {
    console.log(`🔄 useRowData: Processing ${verseIDs.length} verses for chunk`);
    const enriched: Record<string, BibleVerse> = {};
    
    verseIDs.forEach(verseId => {
      const verse = rowData[verseId];
      if (verse) {
        // Use existing getGlobalVerseText function which has translation maps
        const kjvText = getGlobalVerseText ? getGlobalVerseText(verseId, 'KJV') : '';
        
        enriched[verseId] = {
          ...verse,
          text: {
            ...verse.text,
            KJV: kjvText && kjvText !== 'Loading...' ? kjvText : `Loading ${verse.reference}...`
          }
        };
      }
    });
    
    console.log(`✓ useRowData: Processed ${Object.keys(enriched).length} verses with text`);
    return enriched;
  }, [verseIDs, rowData, getGlobalVerseText]);

  return enrichedRowData;
}