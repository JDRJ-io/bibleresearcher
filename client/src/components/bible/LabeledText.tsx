
import React from 'react';
import { useLabeledText } from '@/hooks/useLabeledText';
import { classesForMask } from '@/lib/labelRenderer';

interface Props {
  text: string;
  labelData: Record<string, string[]>;
  activeLabels: string[];
  verseKey: string;
  translationCode: string;
}

export function LabeledText({
  text,
  labelData,
  activeLabels,
  verseKey,
}: Props) {
  const segs = useLabeledText(text, labelData, activeLabels as any);

  return (
    <>
      {segs.map((s) => {
        const cls = classesForMask(s.mask);
        const key = `${verseKey}-${s.start}-${s.mask}`;
        return cls ? (
          <span key={key} className={cls}>
            {text.slice(s.start, s.end)}
          </span>
        ) : (
          text.slice(s.start, s.end)
        );
      })}
    </>
  );
}
export default LabeledText;        // <- keep default so the import path stays identical
