import { useEffect, useRef } from 'react';
import { getCfOffsets, getCrossRefSlice, loadTranslation } from '@/data/BibleDataAPI';
import { getCrossRefWorker } from '@/lib/workers';
import { useBibleStore } from '@/App';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const { crossRefs: crossRefsStore, setCrossRefs } = useBibleStore();

  useEffect(() => {
    const loadCrossRefs = async () => {
      if (verseKeys.length === 0) return;

      // INSTANT UI: Pre-populate with empty arrays to show "No cross references" immediately
      const newCrossRefs: Record<string, string[]> = { ...crossRefsStore };
      const neededVerses: string[] = [];

      verseKeys.forEach(verseId => {
        const spaceFormat = verseId.replace(/\./g, ' ');
        const dotFormat = verseId.replace(/\s/g, '.');
        
        if (!crossRefsStore[spaceFormat] && !crossRefsStore[dotFormat]) {
          // Pre-populate with empty array for instant UI
          newCrossRefs[spaceFormat] = [];
          newCrossRefs[dotFormat] = [];
          neededVerses.push(verseId);
        }
      });

      // Update UI immediately with empty arrays
      if (neededVerses.length > 0) {
        setCrossRefs(newCrossRefs);
      }

      if (neededVerses.length === 0) return;

      try {
        // Load actual cross-references in background
        const { getCrossReferences } = await import('@/data/BibleDataAPI');
        const batchPromises = neededVerses.map(async verseId => {
          try {
            const refs = await getCrossReferences(verseId);
            return { verseId, refs: refs || [] };
          } catch (error) {
            return { verseId, refs: [] };
          }
        });

        const results = await Promise.all(batchPromises);

        // Update with actual data
        const updatedCrossRefs: Record<string, string[]> = { ...newCrossRefs };
        results.forEach(({ verseId, refs }) => {
          const spaceFormat = verseId.replace(/\./g, ' ');
          const dotFormat = verseId.replace(/\s/g, '.');
          updatedCrossRefs[spaceFormat] = refs;
          updatedCrossRefs[dotFormat] = refs;
        });

        setCrossRefs(updatedCrossRefs);

        // Pre-load verse text for cross-references
        const allCrossRefs = results.flatMap(r => r.refs);
        if (allCrossRefs.length > 0) {
          await loadTranslation('KJV');
        }
      } catch (error) {
        console.error('Failed to batch load cross-references:', error);
      }
    };

    loadCrossRefs().catch(console.error);
  }, [verseKeys, cfSet, crossRefsStore, setCrossRefs])
}