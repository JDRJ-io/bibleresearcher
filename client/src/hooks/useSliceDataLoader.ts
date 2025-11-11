import { useBibleStore } from '@/App';
import { useEnsureTranslationLoaded } from './useEnsureTranslationLoaded';


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
  // Cross-reference and prophecy data loading handled by dedicated hooks (useCrossRefLoader, etc.)
  
  // This hook was making requests to a non-existent /api/slice-data endpoint
  // Since we're client-side only and use Supabase directly, we return a simple success state
  // The actual data loading is handled by other dedicated hooks and BibleDataAPI
  
  return { 
    data: {}, 
    isLoading: false, 
    error: null 
  };
}