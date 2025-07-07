import { create } from 'zustand';

export const useBibleStore = create<{
  translations: Record<string, Map<number, string>>;
  actives: string[];
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: Map<number, string>) => void;
}>(set => ({
  translations: {},
  actives: ["KJV"], 
  setActives: (ids) => set({ actives: ids }),
  setTranslations: (id, data) => {
    set(s => ({ translations: { ...s.translations, [id]: data } }));
  }
}));