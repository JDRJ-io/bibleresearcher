
import { useMemo } from 'react';
import type { BibleVerse } from '@/types/bible';

// Simple row data preparation - text loading handled by individual components
export function useRowData(verses: BibleVerse[]) {
  const rowData = useMemo(() => {
    return verses.map((verse, index) => ({
      ...verse,
      index,
    }));
  }, [verses]);

  return {
    rowData,
    totalRows: verses.length
  };
}
