
// DEPRECATED: This file is being replaced by useAdaptivePredictiveVirtualizer
// The old approach used massive buffers and caused memory explosions
// The new APV system is velocity-aware, priority-based, and resource-efficient

import { useAdaptivePredictiveVirtualizer } from "./useAdaptivePredictiveVirtualizer";

// Legacy compatibility wrapper
export function useAnchorSlice(
  containerRef: React.RefObject<HTMLDivElement>, 
  verseKeys: string[] = [], 
  options?: { disabled?: boolean }
) {
  console.warn('⚠️ useAnchorSlice is deprecated. Switch to useAdaptivePredictiveVirtualizer for better performance.');
  return useAdaptivePredictiveVirtualizer(containerRef, verseKeys, options);
}
