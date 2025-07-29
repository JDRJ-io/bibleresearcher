
import { useEffect, useRef } from 'react';
import { getCrossReferences } from '@/data/BibleDataAPI';
import { useBibleStore } from '@/App';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const store = useBibleStore();
  const crossRefsStore = store.crossRefs;
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
        // Only log if we're loading a significant number of verses
        if (neededVerses.length > 10) {
          console.log(`🔄 Loading cross-references for ${neededVerses.length} center-anchored verses`);
        }
        
        // Batch load cross-references
        const batchPromises = neededVerses.map(async verseId => {
          try {
            const refs = await getCrossReferences(verseId);
            return { verseId, refs: refs || [] };
          } catch (error) {
            // Only log errors in development
            if (import.meta.env.DEV) {
              console.warn(`Failed to load cross-refs for ${verseId}:`, error);
            }
            return { verseId, refs: [] };
          }
        });

        const results = await Promise.all(batchPromises);

        // OPTIMIZATION: Store with original dot format keys
        const updatedCrossRefs: Record<string, string[]> = { ...crossRefsStore };
        results.forEach(({ verseId, refs }) => {
          updatedCrossRefs[verseId] = refs;
          // Remove from loading set
          loadingRef.current.delete(verseId);
        });

        // Update the store with the new cross-references
        store.setCrossRefs(updatedCrossRefs);
        
        // Only log completion for significant loads
        if (results.length > 10) {
          console.log(`✅ Loaded cross-references for ${results.length} verses around center anchor`);
        }

      } catch (error) {
        console.error('Failed to batch load cross-references:', error);
        // Clear loading flags on error
        neededVerses.forEach(verseId => {
          loadingRef.current.delete(verseId);
        });
      }
    };

    loadCrossRefs().catch(console.error);
  }, [verseKeys.join(','), cfSet, crossRefsStore, store.setCrossRefs]); // Only re-run when verse list changes
}
