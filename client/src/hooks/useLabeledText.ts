
import { useMemo } from 'react';
import { processTextForLabels, type TextSegment } from '@/lib/labelRenderer';
import type { LabelName } from '@/lib/labelsCache';

interface UseLabeledTextProps {
  text: string;
  labelData: Record<LabelName, string[]>;
  activeLabels: LabelName[];
  verseKey?: string;
  translationCode?: string;
}

export function useLabeledText({ 
  text, 
  labelData, 
  activeLabels, 
  verseKey, 
  translationCode 
}: UseLabeledTextProps): TextSegment[] {
  return useMemo(() => {
    return processTextForLabels(text, labelData, activeLabels, verseKey, translationCode);
  }, [text, labelData, activeLabels, verseKey, translationCode]);
}
