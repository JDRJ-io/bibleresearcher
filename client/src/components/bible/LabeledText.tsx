
import React from 'react';
import { useLabeledText } from '@/hooks/useLabeledText';
import { classesForMask } from '@/lib/labelRenderer';
import { LabelName } from '@/lib/labelBits';

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
}: Props) {
  // Safety check for empty text
  if (!text) {
    return <span>Loading...</span>;
  }

  // Convert string[] to LabelName[] for type safety
  const typedActiveLabels = activeLabels as LabelName[];
  
  // Use the labeled text hook to get segments with masks
  const segs = useLabeledText(text, labelData, typedActiveLabels);

  return (
    <>
      {segs.map((s, index) => {
        const cls = classesForMask(s.mask);
        const content = text.slice(s.start, s.end);
        const key = `${verseKey}-${index}-${s.start}-${s.end}`;
        
        if (cls) {
          return (
            <span key={key} className={cls}>
              {content}
            </span>
          );
        } else {
          return (
            <React.Fragment key={key}>
              {content}
            </React.Fragment>
          );
        }
      })}
    </>
  );
}

export { LabeledText };
