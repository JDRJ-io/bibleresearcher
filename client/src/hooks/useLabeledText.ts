import { useMemo } from 'react';
import { LabelBits } from '@/lib/labelBits';

export interface Segment { start: number; end: number; mask: number; }

export function useLabeledText(
  text: string,
  labelData: Record<string, string[]>,
  activeLabels: (keyof typeof LabelBits)[]
): Segment[] {

  return useMemo(() => {
    if (!text || activeLabels.length === 0) {
      return [{ start: 0, end: text.length, mask: 0 }];
    }

    type Ev = { pos: number; bit: number; add: boolean };
    const events: Ev[] = [];

    activeLabels.forEach(lbl => {
      const bit = LabelBits[lbl];
      const phrases = labelData?.[lbl] || [];
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

    events.sort((a, b) => a.pos - b.pos || (a.add ? -1 : 1));

    const segs: Segment[] = [];
    let mask = 0, last = 0;

    for (const { pos, bit, add } of events) {
      if (pos > last) segs.push({ start: last, end: pos, mask });
      mask = add ? (mask | bit) : (mask & ~bit);
      last = pos;
    }
    if (last < text.length) segs.push({ start: last, end: text.length, mask });
    return segs;
  }, [text, JSON.stringify(labelData), activeLabels.join()]);
}