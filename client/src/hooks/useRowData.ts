
import { useMemo } from 'react';
import type { BibleVerse } from '@/types/bible';

// CLEAN IMPLEMENTATION: Use ONLY BibleDataAPI facade
export function useRowData(verses: BibleVerse[]) {
  const rowData = useMemo(() => {
    return verses.map((verse, index) => ({
      ...verse,
      index,
      // Text loading delegated to BibleDataAPI on-demand
    }));
  }, [verses]);

  return {
    rowData,
    totalRows: verses.length
  };
}
