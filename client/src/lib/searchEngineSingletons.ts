import { BibleSearchEngine } from '@/lib/bibleSearchEngine';
import { loadTranslationOnce } from '@/lib/translationLoader';

const engines = new Map<string, Promise<BibleSearchEngine>>();

export function getEngineOnce(trCode: string): Promise<BibleSearchEngine> {
  if (!engines.has(trCode)) {
    engines.set(trCode, (async () => {
      const translationMap = await loadTranslationOnce(trCode);
      
      const versesWithText = Array.from(translationMap.entries()).map(([reference, text], index) => ({
        id: reference,
        reference: reference,
        text: { [trCode]: text },
        index
      }));
      
      return new BibleSearchEngine(versesWithText);
    })());
  }
  return engines.get(trCode)!;
}
