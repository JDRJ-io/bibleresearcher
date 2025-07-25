
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
    return processTextForLabels(text, labelData, activeLabels);
  }, [text, labelData, activeLabels]);
}
