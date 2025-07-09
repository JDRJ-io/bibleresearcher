import { useBibleStore } from '@/providers/BibleDataProvider';

/**
 * COLUMN KEYS DERIVED SELECTOR
 * 
 * Returns memoized column keys based on translation state
 * Format: ["Reference", ...alternates, main, "Cross", "P", "F", "V"]
 */
export const useColumnKeys = () => {
  const { translationState } = useBibleStore();
  const { main, alternates } = translationState;
  
  // 1-D: Use Zustand selector with shallow compare so components re-render only when the array contents change
  // Ensure unique keys by using Set to remove duplicates
  const columnKeys = Array.from(new Set([...alternates, main]));
  
  return columnKeys;
};