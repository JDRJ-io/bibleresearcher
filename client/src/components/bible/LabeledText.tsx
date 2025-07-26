import React from 'react';
import { useLabeledText } from '@/hooks/useLabeledText';
import { classesForMask } from '@/lib/labelRenderer';
import type { LabelMask } from '@/lib/labelBits';

interface LabeledTextProps {
  text: string;
  labelData: Record<string, string[]>;
  activeLabels: string[];
  verseKey: string;          // for debug / keys
  translationCode: string;   // not used but handy for logs
}

export function LabeledText({
  text,
  labelData,
  activeLabels,
  verseKey,
}: LabeledTextProps) {
  const segs = useLabeledText(text, labelData, activeLabels as any);

  return (
    <>
      {segs.map((s, i) => {
        const cls = classesForMask(s.mask as LabelMask);
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
