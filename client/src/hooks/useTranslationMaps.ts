import { useBibleStore } from '@/App';

export function useTranslationMaps() {
  const translationState = useBibleStore(state => state.translationState);

  return {
    main: translationState.main || 'KJV',
    alternates: translationState.alternates || [],
    columnKeys: translationState.columnKeys || ['KJV']
  };
}

export function useColumnKeys() {
  const translationState = useBibleStore(state => state.translationState);
  return translationState.columnKeys || ['KJV'];
}