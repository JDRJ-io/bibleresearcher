import { create } from 'zustand';

type Visibility = Record<string, boolean>;

interface MasterMenuUIStore {
  open: boolean;
  staged: Visibility;
  setOpen: (v: boolean) => void;
  loadFrom: (live: Visibility) => void;
  setStaged: (id: string, v: boolean) => void;
  resetStage: (defaults: Visibility) => void;
}

export const useMasterMenuUI = create<MasterMenuUIStore>((set) => ({
  open: false,
  staged: {},
  setOpen: (v) => set({ open: v }),
  loadFrom: (live) => set({ staged: { ...live } }),
  setStaged: (id, v) => set((s) => ({ staged: { ...s.staged, [id]: v } })),
  resetStage: (defaults) => set({ staged: { ...defaults } }),
}));
