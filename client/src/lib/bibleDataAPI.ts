import { loadTranslation } from "./translationLoader";

export const BibleDataAPI = {
  getTranslationText: async (ids: string[], translation: string) => {
    // 1. try in-memory cache first
    const translationMap = await loadTranslation(translation);
    if (!translationMap) return [];
    
    // 2. ensure the translation map is loaded
    if (translationMap.size === 0) {
      console.warn(`Translation map for ${translation} is empty`);
      return [];
    }
    
    // 3. hydrate any missing verses into the store
    const hydrated = ids.map((id) => {
      const verse = translationMap.get(id);
      if (verse) {
        return { id, text: verse };
      }
      return { id, text: "Loading..." };
    });
    
    return hydrated;
  }
};