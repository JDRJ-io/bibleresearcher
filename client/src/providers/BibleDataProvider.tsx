import { create } from 'zustand';

export const useBibleStore = create<{
  translations: Record<string, Map<number, string>>;
  actives: string[];
  setTranslations: (id: string, data: Map<number, string>) => void;
}>(set => ({
  translations: {},
  actives: ["KJV"], 
  setTranslations: (id, data) => {
    set(s => ({ translations: { ...s.translations, [id]: data } }));
  }
}));