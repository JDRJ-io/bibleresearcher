
import { useMemo } from 'react';
import { processTextForLabels, type TextSegment } from '@/lib/labelRenderer';
import type { LabelName } from '@/lib/labelsCache';

interface UseLabeledTextProps {
  text: string;
  labelData: Partial<Record<LabelName, string[]>>;
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
  // Create stable keys for memoization - only include active label data
  const activeLabelsKey = useMemo(() => activeLabels.sort().join(','), [activeLabels]);
  
  const labelDataKey = useMemo(() => {
    if (activeLabels.length === 0) return '';
    return activeLabels
      .sort() // Ensure consistent ordering
      .map(label => `${label}:${(labelData[label] || []).sort().join('|')}`)
      .join(';');
  }, [labelData, activeLabels]);

  return useMemo(() => {
    if (activeLabels.length === 0 || !text) {
      return [{ start: 0, end: text.length, mask: 0, text }];
    }
    return processTextForLabels(text, labelData, activeLabels, verseKey, translationCode);
  }, [text, labelDataKey, activeLabelsKey, verseKey, translationCode]);
}
