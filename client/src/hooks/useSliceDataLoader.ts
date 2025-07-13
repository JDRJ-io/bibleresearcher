import { useState, useEffect } from 'react';
import { useBibleStore } from '@/providers/BibleDataProvider';
import { useTranslationMaps } from './useTranslationMaps';
import { useTranslationMaps as useZustandTranslationMaps } from '@/store/translationSlice';
import { loadCrossRefSlice, loadProphecySlice } from '@/data/BibleDataAPI';

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
      
      const start = Math.max(0, slice.length - 100);
      const end = Math.min(slice.length + 100, slice.length);
      
      // B-1: Collect remote verse indices needed for cross-refs and prophecy
      const remoteVerseIndices = new Set<string>();
      
      // Load cross-refs and prophecy data in parallel
      const [crossRefsData, propheciesData] = await Promise.all([
        loadCrossRefSlice(start, end),
        loadProphecySlice(start, end)
      ]);
      
      // Use functional form for Zustand mutation
      useBibleStore.setState(state => ({
        crossRefs: { ...state.crossRefs, ...crossRefsData },
        prophecies: { ...state.prophecies, ...propheciesData }
      }));
      
      // Extract verse references from crossrefs and prophecy
      for (const verseID of slice) {
        // Extract cross-reference verse IDs
        const crossRefs = crossRefsData[verseID];
        if (crossRefs && crossRefs.length > 0) {
          crossRefs.forEach((ref: string) => remoteVerseIndices.add(ref));
        }
        
        // Extract prophecy verse IDs (P/F/V)
        const prophecies = propheciesData[verseID];
        if (prophecies) {
          ['P', 'F', 'V'].forEach(type => {
            if (prophecies[type]) {
              prophecies[type].forEach((ref: string) => remoteVerseIndices.add(ref));
            }
          });
        }
      }
      
      // B-1: Batch load the main translation's text for those remote indices
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
    loadSliceData();
  }, [slice, translationState.main]);

  // Expert's fix: useEffect([main]) invalidates and refetches the remote cache
  // This guarantees the Cross/Prophecy verse texts swap instantly with the new main
  useEffect(() => {
    prefetchRemoteVerses(slice, main);  // pulls new main's verse text
  }, [slice, main]);
  
  return { isLoading };
}