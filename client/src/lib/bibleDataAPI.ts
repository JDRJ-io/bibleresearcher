import { loadTranslation } from "./translationLoader";

export const BibleDataAPI = {
  getTranslationText: async (ids: string[], translation: string) => {
    // 1. try in-memory cache first
    const map = await loadTranslation(translation);
    if (!map) return [];
    
    // 2. ensure the translation map is loaded
    if (map.size === 0) {
      console.warn(`Translation map for ${translation} is empty`);
      return [];
    }
    
    // 3. hydrate any missing verses into the store and return
    const hydrated = ids.map((id) => {
      const text = map.get(id);
      if (text) {
        return { id, text };  // returns verse object
      }
      return { id, text: "Loading..." };
    });
    
    return hydrated;
  }
};