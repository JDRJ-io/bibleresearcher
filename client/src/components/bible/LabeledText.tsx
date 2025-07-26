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

  // Debug logging for Gen.1:1 to see what's happening
  if (verseKey === "Gen.1:1" || verseKey === "Gen 1:1") {
    console.log('🏷️ LabeledText rendering for Gen.1:1:', {
      text,
      labelData,
      activeLabels,
      segments: segs,
      segmentCount: segs.length,
      firstSegment: segs[0],
      hasMasks: segs.some(s => s.mask > 0)
    });
  }

  return (
    <>
      {segs.map((s, i) => {
        const cls = classesForMask(s.mask as LabelMask);
        const key = `${verseKey}-${s.start}-${s.mask}`;
        
        // Debug first few segments
        if (i < 3 && (verseKey === "Gen.1:1" || verseKey === "Gen 1:1")) {
          console.log(`🏷️ Segment ${i}:`, {
            text: text.slice(s.start, s.end),
            mask: s.mask,
            classes: cls,
            start: s.start,
            end: s.end
          });
        }
        
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
