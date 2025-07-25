
import type { LabelName } from './labelsCache';

// Helper to check if two Sets are equal
function equalSets<T>(a: Set<T> | null, b: Set<T> | null): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

// Build a character-level map of which labels touch which index
function labelSetsPerChar(
  text: string,
  labelData: Record<LabelName, string[]>,
  activeLabels: Set<LabelName>
): (Set<LabelName> | null)[] {
  // One sparse array, mostly `null`
  const map = Array(text.length).fill(null) as (Set<LabelName> | null)[];
  
  activeLabels.forEach(label => {
    const phrases = labelData[label] || [];
    phrases.forEach(phrase => {
      if (!phrase) return;
      
      // Escape regex meta characters and handle flexible whitespace
      const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\W+');
      const re = new RegExp(esc, 'gi');
      let m: RegExpExecArray | null;
      
      while ((m = re.exec(text))) {
        for (let i = m.index; i < m.index + m[0].length; i++) {
          if (!map[i]) map[i] = new Set();
          map[i]!.add(label);
        }
      }
    });
  });
  
  return map;
}

// Chunk contiguous runs that share the same label-set
function segmentize(text: string, sets: (Set<LabelName> | null)[]): { txt: string; lbl: Set<LabelName> }[] {
  const out: { txt: string; lbl: Set<LabelName> }[] = [];
  let start = 0;
  
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || !equalSets(sets[i], sets[start])) {
      out.push({ 
        txt: text.slice(start, i), 
        lbl: sets[start] ?? new Set() 
      });
      start = i;
    }
  }
  
  return out;
}

export interface LabelSegment {
  text: string;
  labels: Set<LabelName>;
}

export function processTextForLabels(
  text: string,
  labelData: Record<LabelName, string[]>,
  activeLabels: LabelName[]
): LabelSegment[] {
  if (activeLabels.length === 0) {
    return [{ text, labels: new Set() }];
  }
  
  const activeLabelSet = new Set(activeLabels);
  const perChar = labelSetsPerChar(text, labelData, activeLabelSet);
  const segments = segmentize(text, perChar);
  
  return segments.map(seg => ({
    text: seg.txt,
    labels: seg.lbl
  }));
}
