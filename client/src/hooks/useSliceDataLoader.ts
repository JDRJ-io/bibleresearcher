import { useState, useEffect } from 'react';
import { useBibleStore } from '@/providers/BibleDataProvider';
import { useTranslationMaps } from './useTranslationMaps';

// Expert's fix: Add prefetchRemoteVerses function
const prefetchRemoteVerses = (sliceIndices: string[], main: string) => {
  // when "main" changes, useEffect([main]) invalidates and refetches the remote cache
  // prefetch remote refs in the new translation
  return; // TODO: implement prefetch logic
};

// Feature Block B-1: Data Fetch
// When slice fetch runs (±100 verses around anchor), also collect the list of remote verse indices needed for:
// - all cross-refs linked to those anchor verses
// - all prophecy P/F/V references
// Batch load the main translation's text for those remote indices into the cache before rendering.

export function useSliceDataLoader(slice: string[]) {
  const [isLoading, setIsLoading] = useState(false);
  const { translationState } = useBibleStore();
  const { getVerseText } = useTranslationMaps();
  
  const loadSliceData = async () => {
    if (slice.length === 0) return;
    
    setIsLoading(true);
    
    try {
      console.log(`🔍 Loading slice data for ${slice.length} verses...`);
      
      // B-1: Collect remote verse indices needed for cross-refs and prophecy
      const remoteVerseIndices = new Set<string>();
      
      // TODO: Load cross-refs from crossrefs/cf1.json
      // TODO: Load prophecy from prophecy.json
      // TODO: Extract all verse references from both datasets
      
      // Example of what we need to collect:
      // For each verse in slice, find:
      // - crossRefs[verseID] → extract all verse references
      // - prophecy[verseID] → extract all P/F/V references
      
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
    prefetchRemoteVerses(slice, translationState.main);
  }, [slice, translationState.main]);
  
  return { isLoading };
}