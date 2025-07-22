import { useEffect, useRef } from 'react';
import { getCfOffsets, getCrossRefSlice, loadTranslation } from '@/data/BibleDataAPI';
import { getCrossRefWorker } from '@/lib/workers';
import { useBibleStore } from '@/App';

export function useCrossRefLoader(verseKeys: string[], cfSet: 'cf1' | 'cf2' = 'cf1') {
  const processedKeys = useRef<Set<string>>(new Set());
  const { crossRefs: crossRefsStore, setCrossRefs } = useBibleStore();

  useEffect(() => {
    const loadCrossRefs = async () => {
      // Load cross-references for the current verse slice
      if (verseKeys.length === 0) return;

      // Check which verses need cross-reference data
      const neededVerses = verseKeys.filter(verseId => {
        const spaceFormat = verseId.replace(/\./g, ' ');
        const dotFormat = verseId.replace(/\s/g, '.');
        return !crossRefsStore[spaceFormat] && !crossRefsStore[dotFormat];
      });

      if (neededVerses.length === 0) {
        console.log('✅ All cross-references already loaded for current slice');
        return;
      }

      // Silent batch loading for instant feel
        // console.log(`📚 BATCH Loading cross-references for ${neededVerses.length}/${verseKeys.length} verses in slice`);

      try {
        // OPTIMIZATION: Batch load all cross-references at once instead of one-by-one
        const { getCrossReferences } = await import('@/data/BibleDataAPI');
        const batchPromises = neededVerses.map(async verseId => {
          try {
            const refs = await getCrossReferences(verseId);
            return { verseId, refs: refs || [] };
          } catch (error) {
            console.warn(`Failed to load cross-refs for ${verseId}:`, error);
            return { verseId, refs: [] };
          }
        });

        const results = await Promise.all(batchPromises);

        // Update store with all results at once
        const newCrossRefs: Record<string, string[]> = { ...crossRefsStore };
        results.forEach(({ verseId, refs }) => {
          if (refs.length > 0) {
            const spaceFormat = verseId.replace(/\./g, ' ');
            const dotFormat = verseId.replace(/\s/g, '.');
            newCrossRefs[spaceFormat] = refs;
            newCrossRefs[dotFormat] = refs;
          }
        });

        // Update store once with all new cross-references
        setCrossRefs(newCrossRefs);

        // Silent completion for instant feel
        // console.log(`✅ BATCH Cross-references loaded for ${results.filter(r => r.refs.length > 0).length} verses`);

        // Pre-load verse text for cross-references that point to verses outside current slice
        const allCrossRefs = results.flatMap(r => r.refs);

        // Load the KJV translation for cross-reference snippets if needed
        if (allCrossRefs.length > 0) {
          // Silent eager-loading for instant feel
          // console.log(`📖 Eager-loading cross-ref translations for ${allCrossRefs.length} references`);
          await loadTranslation('KJV'); // This ensures the translation map includes the referenced verses
        }
      } catch (error) {
        console.error('Failed to batch load cross-references:', error);
      }
    };

    if (verseKeys.length > 0) {
      loadCrossRefs().catch(console.error);
    }
  }, [verseKeys, cfSet, crossRefsStore, setCrossRefs])
}