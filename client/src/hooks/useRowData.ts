import { useQuery } from "@tanstack/react-query";
import { verseCache } from "@/hooks/data/verseCache";
import { ensureRangeLoaded } from "@/hooks/data/ensureRangeLoaded";
import { getVerseIndex } from "@/lib/verseIndexMap";

export function useRowData(verseIDs: string[], mainTranslation: string) {
  return useQuery({
    queryKey: ["chunk", verseIDs, mainTranslation],
    queryFn: async () => {
      // Convert verse IDs to indices for verseCache lookup
      const verseIndices = verseIDs.map(getVerseIndex);
      const minIndex = Math.min(...verseIndices);
      const maxIndex = Math.max(...verseIndices);
      
      // Ensure range is loaded into verseCache
      // (PrefetchManager already did this in most cases, but double-check for safety)
      await ensureRangeLoaded(minIndex, maxIndex, mainTranslation);
      
      // Read from translation-keyed verseCache instead of loading full translation (31k verses)
      return verseIDs.map(id => {
        const index = getVerseIndex(id);
        const cached = verseCache.get(mainTranslation, index);
        return {
          id,
          text: cached?.text || ''
        };
      });
    },
    staleTime: 30_000,
    gcTime: 10 * 60 * 1000, // Garbage collect after 10 minutes
    enabled: verseIDs.length > 0,
    select: (verses) => Object.fromEntries(verses.map((v: { id: string, text: string }) => [v.id, v])),
  });
}