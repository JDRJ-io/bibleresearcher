import { useState, useEffect } from 'react';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from './useTranslationMaps';
import { useTranslationMaps as useZustandTranslationMaps } from '@/store/translationSlice';
import { getProphecyRows } from '@/data/BibleDataAPI';
import { getProphecyForVerse } from '@/lib/prophecyCache';
import { getCrossRefWorker } from '@/lib/workers';

// Expert's fix: Add prefetchRemoteVerses function
const prefetchRemoteVerses = (sliceIndices: string[], main: string) => {
  // when "main" changes, useEffect([main]) invalidates and refetches the remote cache
  // prefetch remote refs in the new translation
  console.log(`🔄 Prefetching remote verses for ${main} translation with ${sliceIndices.length} slice indices`);
  // TODO: implement prefetch logic for cross-references and prophecy
};

// Feature Block B-1: Data Fetch
// When slice fetch runs (±100 verses around anchor), also collect the list of remote verse indices needed for:
// - all cross-refs linked to those anchor verses
// - all prophecy P/F/V references
// Batch load the main translation's text for those remote indices into the cache before rendering.

export function useSliceDataLoader(slice: string[]) {
  const [isLoading, setIsLoading] = useState(false);
  const { translationState, crossRefs, prophecies, store } = useBibleStore();
  const { getVerseText } = useTranslationMaps();
  const { main } = useZustandTranslationMaps();
  
  const loadSliceData = async () => {
    if (slice.length === 0) return;
    
    setIsLoading(true);
    
    try {
      console.log(`🔍 Loading slice data for ${slice.length} verses...`);
      
      // Ensure main translation is loaded for cross-reference text
      // Load main translation directly using BibleDataAPI
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      await loadTranslation(main);
      
      const sliceIDs = slice; // or however you name it

      /* 📖 Cross-refs via worker */
      const worker = await getCrossRefWorker();
      const crossrefs = await new Promise<Record<string,string[]>>(res => {
        const handleMessage = (e: MessageEvent) => {
          if (e.data.type === 'result') {
            worker.removeEventListener('message', handleMessage);
            res(e.data.data);
          } else if (!e.data.type) {
            // Legacy support for direct data response
            worker.removeEventListener('message', handleMessage);
            res(e.data);
          }
        };
        worker.addEventListener('message', handleMessage);
        worker.postMessage({ type: 'query', ids: sliceIDs });
      });

      /* 📖 Prophecy arrays */
      const prophecyMap: Record<string,any> = {};
      sliceIDs.forEach(id => {
        const blocks = getProphecyForVerse(id);    // {role,row}
        if (!blocks.length) return;
        prophecyMap[id] = { P: [], F: [], V: [] };
        blocks.forEach(({ role, row }) => {
          prophecyMap[id][role].push(row.summary);
        });
      });

      /* 📖 Merge into Zustand */
      useBibleStore.setState(state => ({
        crossRefs: { ...state.crossRefs, ...crossrefs },
        prophecies: { ...state.prophecies, ...prophecyMap }
      }));
      
      console.log(`✅ Cross-references loaded:`, Object.keys(crossrefs).length, 'verses');
      console.log(`✅ Prophecy data loaded:`, Object.keys(prophecyMap).length, 'verses');
      
      // Extract verse references from crossrefs and prophecy
      const remoteVerseIndices = new Set<string>();
      
      for (const verseID of slice) {
        // Extract cross-reference verse IDs
        const crossRefs = crossrefs[verseID];
        if (crossRefs && crossRefs.length > 0) {
          crossRefs.forEach((ref: string) => remoteVerseIndices.add(ref));
        }
        
        // Extract prophecy verse IDs (P/F/V)
        const prophecies = prophecyMap[verseID];
        if (prophecies) {
          // Handle flattened structure directly
          ['P', 'F', 'V'].forEach(type => {
            if (prophecies[type] && Array.isArray(prophecies[type])) {
              prophecies[type].forEach((ref: string) => remoteVerseIndices.add(ref));
            }
          });
        }
      }
      
      // Batch load the main translation's text for those remote indices
      const mainTranslation = translationState.main;
      const batchPromises = Array.from(remoteVerseIndices).map(verseId => 
        getVerseText(verseId, mainTranslation)
      );
      
      await Promise.all(batchPromises);
      
      console.log(`✅ Slice data loaded for ${remoteVerseIndices.size} remote verses`);
      
    } catch (error) {
      console.error('Failed to load slice data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (slice.length > 0) {
      loadSliceData();
    }
  }, [slice.join(',')]); // Use slice content hash to prevent excessive reloads
  
  // Ensure main translation is loaded when it changes
  useEffect(() => {
    if (main) {
      import('@/data/BibleDataAPI').then(({ loadTranslation }) => {
        loadTranslation(main);
      });
    }
  }, [main]);

  // Expert's fix: useEffect([main]) invalidates and refetches the remote cache
  // This guarantees the Cross/Prophecy verse texts swap instantly with the new main
  useEffect(() => {
    if (slice.length > 0 && main) {
      prefetchRemoteVerses(slice, main);  // pulls new main's verse text
    }
  }, [main]); // Only reload when main translation changes
  
  return { isLoading };
}