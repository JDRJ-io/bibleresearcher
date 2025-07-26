// client/src/hooks/useLabeledText.ts
import { useMemo } from 'react';
import { LabelBits, LabelMask } from '@/lib/labelBits';

/** One contiguous run of text that shares the same mask */
export interface Segment { start: number; end: number; mask: LabelMask }

/**
 * Build segments for a single verse – memoised to inputs
 * @param text          full verse string
 * @param labelData     {who:['God'], what:['heaven', 'earth'], …}
 * @param activeLabels  array like ['who','what']
 */
export function useLabeledText(
  text: string,
  labelData: Record<string, string[]>,
  activeLabels: (keyof typeof LabelBits)[]
): Segment[] {

  return useMemo(() => {
    // Debug logging for Gen.1:1
    if (text && text.includes("In the beginning")) {
      console.log('🎯 useLabeledText DEBUG:', {
        text: text.substring(0, 50) + '...',
        labelData,
        activeLabels,
        hasLabelData: !!labelData && Object.keys(labelData).length > 0,
        activeLabelsLength: activeLabels.length
      });
    }
    
    if (!text || activeLabels.length === 0) {
      return [{ start: 0, end: text.length, mask: 0 }];
    }

    // Collect intervals as sweep events
    type Ev = { pos: number; bit: LabelMask; add: boolean };
    const events: Ev[] = [];

    activeLabels.forEach(lbl => {
      const bit = LabelBits[lbl];
      const phrases = labelData?.[lbl] || [];
      
      // Debug what phrases we're looking for
      if (text && text.includes("In the beginning") && phrases.length > 0) {
        console.log(`🎯 Looking for ${lbl} phrases:`, phrases);
      }
      
      phrases.forEach(ph => {
        if (!ph) return;
        const re = new RegExp(
          ph.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\W+'),
          'gi'
        );
        let m: RegExpExecArray | null;
        while ((m = re.exec(text))) {
          events.push({ pos: m.index, add: true,  bit });
          events.push({ pos: m.index + m[0].length, add: false, bit });
        }
      });
    });

    if (!events.length) return [{ start: 0, end: text.length, mask: 0 }];

    // Sweep-line merge
    events.sort((a, b) => a.pos - b.pos || (a.add ? -1 : 1));
    const segs: Segment[] = [];
    let mask: LabelMask = 0;
    let last = 0;

    for (const { pos, bit, add } of events) {
      if (pos > last) segs.push({ start: last, end: pos, mask });
      mask = add ? (mask | bit) : (mask & ~bit);
      last = pos;
    }
    if (last < text.length) segs.push({ start: last, end: text.length, mask });
    return segs;
  }, [text, JSON.stringify(labelData), activeLabels.join()]);  // fast: labelData is per-verse
}