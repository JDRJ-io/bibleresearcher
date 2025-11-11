
import React from 'react';
import { useLabeledText } from '@/hooks/useLabeledText';
import { classesForMask } from '@/lib/labelRenderer';
import { LabelName } from '@/lib/labelBits';
import { VerseText } from '@/components/highlights/VerseText';

interface Props {
  text: string;
  labelData: Record<string, string[]>;
  activeLabels: string[];
  verseKey: string;
  translationCode: string;
}

export default function LabeledText({
  text,
  labelData,
  activeLabels,
  verseKey,
  translationCode,
}: Props) {
  // Safety check for empty text
  if (!text) {
    return <span>Loading...</span>;
  }

  // Convert string[] to LabelName[] for type safety
  const typedActiveLabels = activeLabels as LabelName[];
  
  // Use the labeled text hook to get segments with masks
  const segs = useLabeledText(text, labelData, typedActiveLabels);

  // Use VerseText component which now supports both highlights and labels
  return (
    <VerseText 
      verseRef={verseKey}
      translation={translationCode}
      text={text}
      labelSegments={activeLabels.length > 0 ? segs : undefined}
    />
  );
}

export { LabeledText };
