
import { useEffect, useRef } from 'react';
import { getCrossReferences } from '@/data/BibleDataAPI';
import { useBibleStore } from '@/App';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const { crossRefs: crossRefsStore, setCrossRefs } = useBibleStore();
  const loadingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadCrossRefs = async () => {
      if (verseKeys.length === 0) return;

      // CENTER-ANCHORED: Only load cross-refs for verses we don't already have
      const neededVerses = verseKeys.filter(verseId => {
        // OPTIMIZATION: verseId is now in dot format - direct lookup
        return !crossRefsStore[verseId] && !loadingRef.current.has(verseId);
      });

      if (neededVerses.length === 0) return;

      // Mark as loading to prevent duplicate requests
      neededVerses.forEach(verseId => {
        // OPTIMIZATION: verseId is now in dot format - direct use
        loadingRef.current.add(verseId);
      });

      try {
        // Batch load cross-references without logging
        const batchPromises = neededVerses.map(async verseId => {
          try {
            const refs = await getCrossReferences(verseId);
            return { verseId, refs: refs || [] };
          } catch (error) {
            return { verseId, refs: [] };
          }
        });

        const results = await Promise.all(batchPromises);

        // Update UI immediately - logging can happen later
        const updatedCrossRefs: Record<string, string[]> = { ...crossRefsStore };
        results.forEach(({ verseId, refs }) => {
          updatedCrossRefs[verseId] = refs;
          // Remove from loading set
          loadingRef.current.delete(verseId);
        });

        setCrossRefs(updatedCrossRefs);

      } catch (error) {
        console.error('Failed to batch load cross-references:', error);
        // Clear loading flags on error
        neededVerses.forEach(verseId => {
          loadingRef.current.delete(verseId);
        });
      }
    };

    loadCrossRefs().catch(console.error);
  }, [verseKeys.join(','), cfSet, crossRefsStore, setCrossRefs]); // Only re-run when verse list changes
}
