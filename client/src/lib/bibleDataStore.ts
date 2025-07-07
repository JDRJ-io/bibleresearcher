// Foundation implementation - single store pattern using Zustand
import { useBibleStore } from '@/providers/BibleDataProvider';

export const useBibleData = () => {
  const { translations, actives, setTranslations } = useBibleStore();
  return { translations, actives, setTranslations };
};

export const useRowData = () => {
  const { translations } = useBibleStore();
  return { rowData: translations };
};

// Legacy compatibility exports
export const getBibleDataStore = () => ({
  mainTranslation: "KJV",
  altTranslations: [],
  baseTranslations: ["Reference", "KJV", "AMP", "CSB", "Cross", "P", "F", "V"],
  headerOrder: ["Reference", "KJV", "Cross", "P", "F", "V"],
  translationMaps: new Map(),
});

// Foundation implementation placeholder - refactoring hooks integration pending
export const setMainTranslation = (code: string) => {
  console.log(`Setting main translation to: ${code}`);
  // TODO: Integrate with useBibleStore for foundation completion
};

export const toggleAltTranslation = (code: string) => {
  console.log(`Toggling alt translation: ${code}`);
  // TODO: Integrate with useBibleStore for foundation completion
};