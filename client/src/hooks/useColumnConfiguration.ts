import { useMemo } from 'react';
import { useTranslationMaps } from '@/store/translationSlice';
import { useBibleStore } from '@/App';
import { useAdaptivePortraitColumns } from '@/hooks/useAdaptivePortraitColumns';

export interface ColumnConfig {
  id: string;
  title: string;
  type: 'reference' | 'main-translation' | 'alt-translation' | 'cross-refs' | 'notes' | 'prophecy';
  width: string;
  isDraggable?: boolean;
  translationCode?: string;
}

export function useColumnConfiguration() {
  const { main, alternates } = useTranslationMaps();
  const store = useBibleStore();
  const { adaptiveWidths } = useAdaptivePortraitColumns();
  
  const {
    showNotes,
    showCrossRefs,
    showPrediction,
    showFulfillment,
    showVerification,
  } = store;

  // Get responsive width based on type and current adaptive widths
  const getResponsiveWidth = (type: string) => {
    switch (type) {
      case 'reference':
        return 'calc(var(--adaptive-ref-width) * var(--column-width-mult, 1))';
      case 'notes':
        return 'calc(var(--adaptive-notes-width) * var(--column-width-mult, 1))';
      case 'main-translation':
        return 'calc(var(--adaptive-main-width) * var(--column-width-mult, 1))';
      case 'cross-refs':
        return 'calc(var(--adaptive-cross-width) * var(--column-width-mult, 1))';
      case 'prophecy':
        return 'calc(var(--adaptive-prophecy-width) * var(--column-width-mult, 1))';
      case 'alt-translation':
        return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
      default:
        return 'calc(var(--adaptive-alt-width) * var(--column-width-mult, 1))';
    }
  };

  const columns = useMemo(() => {
    const cols: ColumnConfig[] = [];

    // 1. Reference column (always visible, never draggable)
    cols.push({
      id: 'reference',
      title: 'Ref',
      type: 'reference',
      width: getResponsiveWidth('reference'),
      isDraggable: false
    });

    // 2. Notes column (if enabled)
    if (showNotes) {
      cols.push({
        id: 'notes',
        title: 'Notes',
        type: 'notes',
        width: getResponsiveWidth('notes')
      });
    }

    // 3. Main translation (always visible)
    cols.push({
      id: 'main-translation',
      title: main || 'KJV',
      type: 'main-translation',
      width: getResponsiveWidth('main-translation')
    });

    // 4. Cross references (if enabled)
    if (showCrossRefs) {
      cols.push({
        id: 'cross-refs',
        title: 'Cross Refs',
        type: 'cross-refs',
        width: getResponsiveWidth('cross-refs')
      });
    }

    // 5. Prophecy columns (if enabled)
    if (showPrediction) {
      cols.push({
        id: 'prophecy-prediction',
        title: 'Prediction',
        type: 'prophecy',
        width: getResponsiveWidth('prophecy')
      });
    }
    
    if (showFulfillment) {
      cols.push({
        id: 'prophecy-fulfillment',
        title: 'Fulfillment',
        type: 'prophecy',
        width: getResponsiveWidth('prophecy')
      });
    }
    
    if (showVerification) {
      cols.push({
        id: 'prophecy-verification',
        title: 'Verification',
        type: 'prophecy',
        width: getResponsiveWidth('prophecy')
      });
    }

    // 6. Alternate translations (filter out main to avoid duplication)
    alternates
      .filter(code => code !== main)
      .forEach((code) => {
        cols.push({
          id: `alt-translation-${code}`,
          title: code,
          type: 'alt-translation',
          width: getResponsiveWidth('alt-translation'),
          translationCode: code
        });
      });

    return cols;
  }, [main, alternates, showNotes, showCrossRefs, showPrediction, showFulfillment, showVerification, adaptiveWidths]);

  return {
    columns,
    getResponsiveWidth
  };
}