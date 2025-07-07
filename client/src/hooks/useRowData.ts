import { BibleDataAPI } from "@/lib/bibleDataAPI";
import { useQuery } from "@tanstack/react-query";

export function useRowData(verseIDs: string[], mainTranslation: string) {
  return useQuery({
    queryKey: ["chunk", verseIDs, mainTranslation],
    queryFn: () => BibleDataAPI.getTranslationText(verseIDs, mainTranslation),
    staleTime: 30_000,
    enabled: verseIDs.length > 0,
    select: (verses) => Object.fromEntries(verses.map((v: { id: string, text: string }) => [v.id, v])),
  });
}