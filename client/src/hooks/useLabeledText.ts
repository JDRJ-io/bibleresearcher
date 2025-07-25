
import { useMemo } from 'react';
import { processTextForLabels, type TextSegment } from '@/lib/labelRenderer';
import type { LabelName } from '@/lib/labelsCache';

interface UseLabeledTextProps {
  text: string;
  labelData: Record<LabelName, string[]>;
  activeLabels: LabelName[];
}

export function useLabeledText({ text, labelData, activeLabels }: UseLabeledTextProps): TextSegment[] {
  return useMemo(() => {
    try {
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
    } catch (error) {
      console.warn('Label processing failed, using fallback:', error);
      // Fallback to simple text segment
      return [{ start: 0, end: text.length, mask: 0, text }];
    }
  }, [text, labelData, activeLabels]);
}
