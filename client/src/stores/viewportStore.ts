import { create } from 'zustand';

type ViewportState = {
  // Scroll-root relative metrics used by virtualizer
  scrollTop: number;
  viewportH: number;
  viewportW: number;
  orientation: 'portrait' | 'landscape';
  setMetrics: (m: Partial<Omit<ViewportState, 'setMetrics'>>) => void;
};

export const useViewportStore = create<ViewportState>((set) => ({
  scrollTop: 0,
  viewportH: typeof window !== 'undefined' ? window.innerHeight : 0,
  viewportW: typeof window !== 'undefined' ? window.innerWidth : 0,
  orientation: typeof window !== 'undefined' && window.innerWidth < window.innerHeight ? 'portrait' : 'landscape',
  setMetrics: (m) => set(m),
}));
