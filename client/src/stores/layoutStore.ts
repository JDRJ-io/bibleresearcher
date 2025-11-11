import { create } from 'zustand';

type LayoutState = {
  // Container metrics (one ResizeObserver instead of 240)
  containerWidth: number;
  containerHeight: number;
  setContainerMetrics: (m: { width: number; height: number }) => void;
  
  // Reference column width (centralized ResizeObserver)
  // PERF FIX: Single observer instead of 120 (one per row)
  referenceColumnWidth: number;
  setReferenceColumnWidth: (width: number) => void;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  containerWidth: 0,
  containerHeight: 0,
  setContainerMetrics: (m) => set({ containerWidth: m.width, containerHeight: m.height }),
  
  referenceColumnWidth: 0,
  setReferenceColumnWidth: (width) => set({ referenceColumnWidth: width }),
}));
