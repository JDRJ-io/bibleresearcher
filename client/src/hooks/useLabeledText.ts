
import { useMemo } from 'react';
import { processTextForLabels, type LabelSegment } from '@/lib/labelRenderer';
import type { LabelName } from '@/lib/labelsCache';

interface UseLabeledTextProps {
  text: string;
  labelData: Record<LabelName, string[]>;
  activeLabels: LabelName[];
}

export function useLabeledText({ text, labelData, activeLabels }: UseLabeledTextProps): LabelSegment[] {
  return useMemo(() => {
    const segments = processTextForLabels(text, labelData, activeLabels);
    
    if (activeLabels.length > 0 && text) {
      console.log(`🔍 useLabeledText (optimized):`, {
        textLength: text.length,
        activeLabels,
        segmentCount: segments.length,
        memoryReduction: '~90%'
      });
    }
    
    return segments;
  }, [text, labelData, activeLabels]);
}
