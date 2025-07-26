import React from 'react';
import { useLabeledText } from '@/hooks/useLabeledText';
import { classesForMask } from '@/lib/labelRenderer';

interface LabeledTextProps {
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
}: LabeledTextProps) {
  // TEST: Force test data for Gen.1:1 to verify visual effects work
  const testData = verseKey === "Gen.1:1" ? {
    who: ["God"],
    what: ["heaven", "earth"],
    when: ["beginning"]
  } : labelData;
  
  const testActiveLabels = verseKey === "Gen.1:1" ? ["who", "what", "when"] : activeLabels;

  const segs = useLabeledText(text, testData, testActiveLabels as any);

  // Debug for Gen.1:1
  if (verseKey === "Gen.1:1") {
    console.log('🧪 TEST MODE Gen.1:1:', {
      text,
      testData,
      testActiveLabels,
      segments: segs,
      hasActiveSegments: segs.some(s => s.mask > 0)
    });
  }

  return (
    <>
      {segs.map((s) => {
        const cls = classesForMask(s.mask);
        const key = `${verseKey}-${s.start}-${s.mask}`;
        
        // Debug segment rendering for Gen.1:1
        if (verseKey === "Gen.1:1") {
          console.log(`🎨 Rendering segment:`, {
            text: text.slice(s.start, s.end),
            mask: s.mask,
            classes: cls
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
