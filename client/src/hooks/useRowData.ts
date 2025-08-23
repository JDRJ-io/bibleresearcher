import { BibleDataAPI } from "@/data/BibleDataAPI";
import { useQuery } from "@tanstack/react-query";
import { masterCache } from "@/lib/supabaseClient";
import { useMemo } from "react";

export function useRowData(verseIDs: string[], mainTranslation: string) {
  // SEAMLESS LOADING: Check if translation is already cached for instant access
  const translationMap = masterCache.get(`translation-${mainTranslation}`);
  
  // If translation is cached, return data immediately without loading states
  const cachedData = useMemo(() => {
    if (!translationMap || verseIDs.length === 0) return null;
    
    const verses = verseIDs.map(id => ({
      id,
      text: translationMap.get(id) || ''
    }));
    
    return Object.fromEntries(verses.map(v => [v.id, v]));
  }, [translationMap, verseIDs]);

  // Use query only when translation is not cached yet
  const queryResult = useQuery({
    queryKey: ["chunk", verseIDs, mainTranslation],
    queryFn: () => BibleDataAPI.getTranslationText(verseIDs, mainTranslation),
    staleTime: 30_000,
    enabled: verseIDs.length > 0 && !translationMap,
    select: (verses) => Object.fromEntries(verses.map((v: { id: string, text: string }) => [v.id, v])),
  });

  // Return cached data immediately if available, otherwise use query result
  if (cachedData) {
    return {
      data: cachedData,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true
    };
  }

  return queryResult;
}