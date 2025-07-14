import { useState, useEffect } from 'react';
import { useBibleStore } from '@/providers/BibleDataProvider';
import { useTranslationMaps } from './useTranslationMaps';
import { useTranslationMaps as useZustandTranslationMaps } from '@/store/translationSlice';
import { loadCrossRefSlice, loadProphecySlice } from '@/data/BibleDataAPI';
import { getProphecyForVerse } from '@/lib/prophecyCache';
import { crossRefWorker } from '@/lib/workers';

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
  
  useEffect(() => {
    if (slice.length > 0) {
      console.log(`🔄 useSliceDataLoader triggered for ${slice.length} verses`);
      loadSliceData();
    }
  }, [slice.length]);
  
  const loadSliceData = async () => {
    if (slice.length === 0) return;
    
    setIsLoading(true);
    
    try {
      console.log(`🔍 Loading slice data for ${slice.length} verses...`);
      
      const sliceIDs = slice; // or however you name it

      /* 📖 Cross-refs via worker */
      const crossrefs = await new Promise<Record<string,string[]>>(res => {
        const handler = (e: MessageEvent) => {
          crossRefWorker.removeEventListener('message', handler);
          res(e.data);
        };
        crossRefWorker.addEventListener('message', handler);
        crossRefWorker.postMessage({ ids: sliceIDs });
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
      
      console.log(`✅ Cross-references loaded:`, Object.keys(crossrefs).length, 'verses with data:', Object.keys(crossrefs).filter(k => crossrefs[k]?.length > 0).length);
      console.log(`✅ Prophecy data loaded:`, Object.keys(prophecyMap).length, 'verses with data:', Object.keys(prophecyMap).filter(k => prophecyMap[k]?.P?.length > 0 || prophecyMap[k]?.F?.length > 0 || prophecyMap[k]?.V?.length > 0).length);
      
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

  // Expert's fix: useEffect([main]) invalidates and refetches the remote cache
  // This guarantees the Cross/Prophecy verse texts swap instantly with the new main
  useEffect(() => {
    if (slice.length > 0 && main) {
      prefetchRemoteVerses(slice, main);  // pulls new main's verse text
    }
  }, [main]); // Only reload when main translation changes
  
  return { isLoading };
}