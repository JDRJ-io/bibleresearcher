import { getTranslationMap } from "./translationLoader";

export const BibleDataAPI = {
  getTranslationText: async (ids: string[], translation: string) => {
    const translationMap = await getTranslationMap(translation);
    if (!translationMap) return [];
    
    return ids.map(id => ({
      id,
      text: translationMap.get(id) || "Text not found"
    }));
  }
};