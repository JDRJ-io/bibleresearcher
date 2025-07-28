import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBibleStore } from '@/App';
import { useTranslationMaps } from './useTranslationMaps';
import { useTranslationMaps as useZustandTranslationMaps } from '@/store/translationSlice';
import { getProphecyRows } from '@/data/BibleDataAPI';
import { getProphecyForVerse } from '@/lib/prophecyCache';
import { getCrossRefWorker } from '@/lib/workers';
import { useEnsureTranslationLoaded } from './useEnsureTranslationLoaded';

// API request helper function
const apiRequest = async (url: string, method: string = 'GET', body?: any) => {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  
  return response.json();
};

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
  const { translationState } = useBibleStore();
  const { main } = translationState;

  // Translation loading handled centrally by useBibleData - no duplication

  // Remove duplicate translation loading - handled by main useBibleData hook

  // REMOVED: Old API endpoint that no longer exists
  // The app is now client-side only, no need for slice-data API calls
  // Cross-references and prophecy data are loaded directly from Supabase
  
  return { data: {}, isLoading: false, error: null };
}