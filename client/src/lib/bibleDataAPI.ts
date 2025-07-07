import { getBibleDataStore } from '@/lib/bibleDataStore';

export async function getTranslationText(ids: string[], translation: string) {
  return getBibleDataStore().getVerses(ids, translation); // existing loader
}