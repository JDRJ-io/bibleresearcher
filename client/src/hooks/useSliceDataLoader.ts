import { useState, useEffect } from 'react';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from './useTranslationMaps';
import { useTranslationMaps as useZustandTranslationMaps } from '@/store/translationSlice';
import { getProphecyRows } from '@/data/BibleDataAPI';
import { getProphecyForVerse } from '@/lib/prophecyCache';
import { getCrossRefWorker } from '@/lib/workers';
import { useEnsureTranslationLoaded } from './useEnsureTranslationLoaded';

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

export function useSliceDataLoader(verseIDs: string[], mainTranslation?: string) {
  const ensureTranslationLoaded = useEnsureTranslationLoaded();

  // Preload main translation when slice changes
  useEffect(() => {
    if (mainTranslation && verseIDs.length > 0) {
      ensureTranslationLoaded(mainTranslation);
    }
  }, [verseIDs, mainTranslation, ensureTranslationLoaded]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/slice-data', verseIDs],
    queryFn: async () => {
      if (verseIDs.length === 0) return {};
      return apiRequest(`/api/slice-data`, 'POST', { verseIDs });
    },
    enabled: verseIDs.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { data, isLoading, error };
}