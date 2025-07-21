import { useBibleStore } from '@/App';

export function useTranslationMaps() {
  const store = useBibleStore();
  
  // Add safety checks and ensure store is initialized
  if (!store || !store.translationState) {
    console.warn('⚠️ Store or translationState not initialized, using defaults');
    return {
      main: 'KJV',
      alternates: [],
      columnKeys: ['KJV']
    };
  }

  const translationState = store.translationState;

  return {
    main: translationState.main || 'KJV',
    alternates: translationState.alternates || [],
    columnKeys: translationState.columnKeys || [translationState.main || 'KJV']
  };
}

export function useColumnKeys() {
  const store = useBibleStore();
  
  if (!store || !store.translationState) {
    console.warn('⚠️ Store or translationState not initialized for columnKeys, using defaults');
    return ['KJV'];
  }

  return store.translationState.columnKeys || [store.translationState.main || 'KJV'];
}