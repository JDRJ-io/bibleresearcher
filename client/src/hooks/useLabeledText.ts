
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
  // Create stable keys for memoization
  const activeLabelsKey = useMemo(() => activeLabels.join(','), [activeLabels]);
  const labelDataKey = useMemo(() => {
    return activeLabels.map(label => 
      `${label}:${(labelData[label] || []).join('|')}`
    ).join(';');
  }, [labelData, activeLabels]);

  return useMemo(() => {
    if (activeLabels.length === 0) {
      return [{ start: 0, end: text.length, mask: 0, text }];
    }
    return processTextForLabels(text, labelData, activeLabels, verseKey, translationCode);
  }, [text, labelDataKey, activeLabelsKey, verseKey, translationCode]);
}
