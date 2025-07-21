
import { create } from 'zustand';

interface TranslationState {
  main: string;
  alternates: string[];
  /** swap in a new main, old main is removed */
  setMain: (id: string) => void;
  /** toggle an alternate on/off */
  toggleAlternate: (id: string) => void;
  /** reset to mobile defaults: main + no alternates */
  resetMobileDefaults: (mainId: string) => void;
}

// GUEST MODE: Remove persistence to prevent session memory
export const useTranslationMaps = create<TranslationState>()((set, get) => ({
  main: 'KJV',
  alternates: [],  // GUEST: No alternates by default
  setMain: (id: string) => {
    const current = get();
    if (id === current.main) return;  // no-op

    set({
      main: id,
      alternates: current.alternates.filter((t) => t !== id),  // 1. remove new main
    });
  },
  toggleAlternate: (id: string) => {
    const current = get();
    if (id === current.main) return;  // cannot demote main here

    const isActive = current.alternates.includes(id);
    set({
      alternates: isActive 
        ? current.alternates.filter((t) => t !== id)  // remove
        : [...current.alternates, id]  // add
    });
  },
  resetMobileDefaults: (mainId: string) => {
    set({
      main: mainId,
      alternates: []  // MOBILE: No alternates by default
    });
  },
}));

// Helper function to get column order for UI components
export function getColumnOrder(): string[] {
  const store = useTranslationMaps.getState();
  return [store.main, ...store.alternates];  // column order: main first, then alternates
}
