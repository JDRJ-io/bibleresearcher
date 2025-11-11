import { loadTranslationOnce } from '@/lib/translationLoader';

const versesCache = new Map<string, Promise<any[]>>();

export function getVersesWithTextOnce(trCode: string): Promise<any[]> {
  if (!versesCache.has(trCode)) {
    versesCache.set(trCode, (async () => {
      const translationMap = await loadTranslationOnce(trCode);
      
      return Array.from(translationMap.entries()).map(([reference, text], index) => ({
        id: reference,
        reference: reference,
        text: text,
        index
      }));
    })());
  }
  return versesCache.get(trCode)!;
}
