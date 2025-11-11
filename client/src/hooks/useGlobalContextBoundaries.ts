import { useQuery } from '@tanstack/react-query';
import { getContextGroups } from '@/data/BibleDataAPI';
import { useBibleStore } from '@/App';

interface ContextBoundary {
  startVerse: string;
  endVerse: string;
  groupIndex: number;
}

// Convert pipe format to dot format for consistency
function convertToDotFormat(verseId: string): string {
  // Convert "Gen|1|1" to "Gen.1:1"
  const parts = verseId.split('|');
  if (parts.length !== 3) return verseId;
  return `${parts[0]}.${parts[1]}:${parts[2]}`;
}

// Global hook that processes context boundaries once and shares across all components
export function useGlobalContextBoundaries() {
  const { showContext } = useBibleStore();
  
  return useQuery({
    queryKey: ['context-boundaries'],
    queryFn: () => {
      console.log('🔵 Loading context boundaries from Supabase...');
      return getContextGroups().then((contextGroups: string[][]) => {
        const contextMap = new Map<string, ContextBoundary>();
        
        console.log(`🔵 Processing ${contextGroups.length} context groups...`);
        
        // Process each context group
        contextGroups.forEach((group, groupIndex) => {
          if (group.length === 0) return;
          
          // Convert all verses in the group to dot format
          const dotFormatVerses = group.map(v => convertToDotFormat(v));
          const startVerse = dotFormatVerses[0];
          const endVerse = dotFormatVerses[dotFormatVerses.length - 1];
          
          // Map each verse in the group to its boundary info
          dotFormatVerses.forEach(verse => {
            contextMap.set(verse, {
              startVerse,
              endVerse,
              groupIndex
            });
          });
        });
        
        console.log(`✅ Context boundaries loaded: ${contextMap.size} verses mapped`);
        return contextMap;
      }).catch(error => {
        console.error('❌ Failed to load context boundaries:', error);
        throw error;
      });
    },
    enabled: showContext, // Only fetch when showContext is enabled
    staleTime: Infinity, // Context boundaries never change during session
    gcTime: Infinity,    // Keep cached indefinitely
    retry: false, // Don't retry failed loads
  });
}

// Updated hook that uses the global context boundaries
export function useContextBoundaries() {
  const { data: contextMap = new Map(), isLoading, error } = useGlobalContextBoundaries();

  // Get the context boundary for a specific verse
  const getContextBoundary = (verseId: string): ContextBoundary | null => {
    return contextMap.get(verseId) || null;
  };

  // Check if a verse is at the start of a context group
  const isContextStart = (verseId: string): boolean => {
    const boundary = contextMap.get(verseId);
    return boundary ? boundary.startVerse === verseId : false;
  };

  // Check if a verse is at the end of a context group
  const isContextEnd = (verseId: string): boolean => {
    const boundary = contextMap.get(verseId);
    return boundary ? boundary.endVerse === verseId : false;
  };

  // Get all verses in the same context group
  const getContextGroup = (verseId: string): string[] => {
    const boundary = contextMap.get(verseId);
    if (!boundary) return [verseId];
    
    // Find all verses with the same groupIndex
    const group: string[] = [];
    contextMap.forEach((b, v) => {
      if (b.groupIndex === boundary.groupIndex) {
        group.push(v);
      }
    });
    
    return group;
  };

  return {
    contextMap,
    isLoading,
    error: error as string | null,
    getContextBoundary,
    isContextStart,
    isContextEnd,
    getContextGroup
  };
}