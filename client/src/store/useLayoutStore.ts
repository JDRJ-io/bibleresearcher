import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ColumnId =
  | 'ref'            // always in locked array – front-pinned
  | 'dates'
  | 'notes'
  | 'main'
  | 'crossRefs'
  | 'prediction'
  | 'verification'
  | 'fulfillment'
  | 'alt-1' | 'alt-2' | 'alt-3' | 'alt-4' | 'alt-5' | 'alt-6' | 'alt-7' | 'alt-8';

export type LayoutMode = 'grid' | 'carousel' | 'context-lens';

type LayoutState = {
  /* ----- layout mode ----- */
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
  
  /* ----- column layout (for carousel mode) ----- */
  locked: ColumnId[];      // pinned left – ordered
  carousel: ColumnId[];    // scrollable set – ordered
  start: number;           // first visible index inside carousel
  
  /* derived selector you'll use everywhere */
  visible(windowPx: number): ColumnId[];
  
  /* mutations */
  pin(id: ColumnId): void;
  unpin(id: ColumnId): void;
  page(dir: -1 | 1, windowPx: number): void; // ← / →
  
  /* ----- context lens panel ----- */
  panelOpen: boolean;
  panelVerse: string | null;           // 'Gen.1:1'
  openPanel(verseKey: string): void;
  closePanel(): void;
};

/* ---------------------------------------------------------------
   Column width tokens – keep these central so layout math
   is identical everywhere
---------------------------------------------------------------- */
export const COL_WIDTH: Record<ColumnId, number> = {
  ref: 80,
  dates: 140,
  notes: 320,
  main: 320,
  crossRefs: 360,
  prediction: 360,
  verification: 360,
  fulfillment: 360,
  'alt-1': 320,
  'alt-2': 320,
  'alt-3': 320,
  'alt-4': 320,
  'alt-5': 320,
  'alt-6': 320,
  'alt-7': 320,
  'alt-8': 320,
};

const ARROW_GUTTER = 48;     // width of ← / → buttons

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      /* defaults ---------------------------------------------------- */
      mode: 'grid', // Default to existing grid mode
      
      locked: ['ref', 'dates', 'notes', 'main'],
      carousel: [
        'crossRefs',
        'prediction',
        'verification',
        'fulfillment',
        'alt-1',
        'alt-2',
        'alt-3',
        'alt-4',
        'alt-5',
        'alt-6',
        'alt-7',
        'alt-8',
      ],
      start: 0,

      /* mode setter ------------------------------------------------- */
      setMode: (mode) => set({ mode, start: 0 }),

      /* selectors --------------------------------------------------- */
      visible: (windowPx) => {
        const { mode, locked, carousel, start } = get();
        
        // In grid mode, return all columns (let existing logic handle visibility)
        if (mode === 'grid') {
          return ['ref', 'main', 'crossRefs', 'prediction', 'verification', 'fulfillment', 
                  'alt-1', 'alt-2', 'alt-3', 'alt-4', 'alt-5', 'alt-6', 'alt-7', 'alt-8',
                  'dates', 'notes'];
        }
        
        // In context-lens mode, only show ref and main
        if (mode === 'context-lens') {
          return ['ref', 'main'];
        }
        
        // Carousel mode logic
        const PINNED_WIDTH = locked.reduce((w, id) => w + COL_WIDTH[id], 0) + ARROW_GUTTER;
        let avail = windowPx - PINNED_WIDTH;
        const vis: ColumnId[] = [];
        for (let i = start; i < carousel.length && avail > 0; i++) {
          const id = carousel[i];
          const w = COL_WIDTH[id];
          if (w <= avail) {
            vis.push(id);
            avail -= w;
          } else break;
        }
        return [...locked, ...vis];
      },

      /* mutations --------------------------------------------------- */
      pin: (id) =>
        set((s) => {
          if (s.locked.includes(id)) return {};
          return {
            locked: [...s.locked, id],
            carousel: s.carousel.filter((c) => c !== id),
            start: 0,
          };
        }),
        
      unpin: (id) =>
        set((s) => {
          if (id === 'ref' || !s.locked.includes(id)) return {};
          const newLocked = s.locked.filter((l) => l !== id);
          return {
            locked: newLocked,
            carousel: [...s.carousel, id],
            start: 0,
          };
        }),
        
      page: (dir, windowPx) =>
        set((s) => {
          // Calculate visible count directly to avoid circular dependency
          const PINNED_WIDTH = s.locked.reduce((w, id) => w + COL_WIDTH[id], 0) + ARROW_GUTTER;
          let avail = windowPx - PINNED_WIDTH;
          let visibleCount = 0;
          
          for (let i = s.start; i < s.carousel.length && avail > 0; i++) {
            const id = s.carousel[i];
            const w = COL_WIDTH[id];
            if (w <= avail) {
              visibleCount++;
              avail -= w;
            } else break;
          }
          
          const newStart = s.start + (dir * Math.max(1, visibleCount));
          const maxStart = Math.max(0, s.carousel.length - 1);
          return { start: Math.max(0, Math.min(maxStart, newStart)) };
        }),

      /* context panel ----------------------------------------------- */
      panelOpen: false,
      panelVerse: null,
      openPanel: (vk) => set({ panelOpen: true, panelVerse: vk }),
      closePanel: () => set({ panelOpen: false, panelVerse: null }),
    }),
    {
      name: 'layout-store',
      partialize: (state) => ({
        mode: state.mode,
        locked: state.locked,
        carousel: state.carousel,
      }),
    }
  )
);