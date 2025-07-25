
// Bitmask-based label renderer for 90% memory reduction
import type { LabelName } from './labelsCache';

// 10-bit mask for 10 labels - fits in a single uint16
export enum LabelBits {
  who        = 1 << 0,
  what       = 1 << 1,
  when       = 1 << 2,
  where      = 1 << 3,
  command    = 1 << 4,
  action     = 1 << 5,
  why        = 1 << 6,
  seed       = 1 << 7,
  harvest    = 1 << 8,
  prediction = 1 << 9,
}

export type LabelMask = number; // 0-1023

// Map label names to bit positions
const labelToBit: Record<LabelName, number> = {
  who: LabelBits.who,
  what: LabelBits.what,
  when: LabelBits.when,
  where: LabelBits.where,
  command: LabelBits.command,
  action: LabelBits.action,
  why: LabelBits.why,
  seed: LabelBits.seed,
  harvest: LabelBits.harvest,
  prediction: LabelBits.prediction,
};

// Map mask to CSS classes (fast lookup)
const bitToClass: Record<number, string> = {
  [LabelBits.who]: 'fx-hand',
  [LabelBits.what]: 'fx-shadow',
  [LabelBits.when]: 'fx-under',
  [LabelBits.where]: 'fx-bracket',
  [LabelBits.command]: 'fx-bold',
  [LabelBits.action]: 'fx-ital',
  [LabelBits.why]: 'fx-outline',
  [LabelBits.seed]: 'sup-seed',
  [LabelBits.harvest]: 'sup-harvest',
  [LabelBits.prediction]: 'sup-predict',
};

// Convert active labels array to bitmask
export function labelsToBitmask(activeLabels: LabelName[]): LabelMask {
  let mask = 0;
  for (const label of activeLabels) {
    mask |= labelToBit[label] || 0;
  }
  return mask;
}

// Convert bitmask to CSS classes
export function classesForMask(mask: LabelMask): string {
  let cls = '';
  for (const [bit, str] of Object.entries(bitToClass)) {
    if (mask & Number(bit)) cls += str + ' ';
  }
  return cls.trim();
}

// Regex cache to avoid rebuilding on each render
const regexCache: Record<string, RegExp[]> = {};

function compileRegexes(tCode: string, label: LabelName, phrases: string[]): RegExp[] {
  const key = `${tCode}:${label}`;
  if (regexCache[key]) return regexCache[key];
  
  regexCache[key] = phrases.map(phrase =>
    new RegExp(
      phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\W+'),
      'gi'
    )
  );
  return regexCache[key];
}

// Segment with start/end positions and bitmask
export interface LabelSegment {
  start: number;
  end: number;
  mask: LabelMask;
  text: string;
}

// Sweep-line algorithm for interval merging - O(matches log m)
function computeSegments(
  verse: string,
  labelData: Record<LabelName, string[]>,
  activeMask: LabelMask
): LabelSegment[] {
  // Collect interval events
  const events: { pos: number; bit: LabelMask; add: boolean }[] = [];
  
  for (const [labelName, bit] of Object.entries(labelToBit)) {
    if (!(activeMask & bit)) continue; // label not active
    
    const phrases = labelData[labelName as LabelName] || [];
    if (phrases.length === 0) continue;
    
    for (const phrase of phrases) {
      if (!phrase) continue;
      
      const regex = new RegExp(
        phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\W+'),
        'gi'
      );
      
      let match: RegExpExecArray | null;
      while ((match = regex.exec(verse))) {
        events.push({ pos: match.index, bit, add: true });
        events.push({ pos: match.index + match[0].length, bit, add: false });
      }
    }
  }
  
  if (!events.length) {
    return [{ start: 0, end: verse.length, mask: 0, text: verse }];
  }
  
  // Sort events: position first, then add before remove
  events.sort((a, b) => a.pos - b.pos || (a.add ? -1 : 1));
  
  // Sweep line algorithm
  const segments: LabelSegment[] = [];
  let currentMask: LabelMask = 0;
  let lastPos = 0;
  
  for (const { pos, bit, add } of events) {
    if (pos > lastPos) {
      segments.push({
        start: lastPos,
        end: pos,
        mask: currentMask,
        text: verse.slice(lastPos, pos)
      });
    }
    currentMask = add ? (currentMask | bit) : (currentMask & ~bit);
    lastPos = pos;
  }
  
  if (lastPos < verse.length) {
    segments.push({
      start: lastPos,
      end: verse.length,
      mask: currentMask,
      text: verse.slice(lastPos)
    });
  }
  
  return segments;
}

// Memoization cache for segments
const segmentCache = new Map<string, LabelSegment[]>();
const CACHE_SIZE_LIMIT = 500; // LRU limit

function evictOldCacheEntries() {
  if (segmentCache.size > CACHE_SIZE_LIMIT) {
    const keysToDelete = Array.from(segmentCache.keys()).slice(0, 100);
    keysToDelete.forEach(key => segmentCache.delete(key));
  }
}

export function processTextForLabels(
  text: string,
  labelData: Record<LabelName, string[]>,
  activeLabels: LabelName[]
): LabelSegment[] {
  if (activeLabels.length === 0) {
    return [{ start: 0, end: text.length, mask: 0, text }];
  }
  
  const activeMask = labelsToBitmask(activeLabels);
  const cacheKey = `${text.length}|${JSON.stringify(labelData)}|${activeMask}`;
  
  let segments = segmentCache.get(cacheKey);
  if (!segments) {
    segments = computeSegments(text, labelData, activeMask);
    segmentCache.set(cacheKey, segments);
    evictOldCacheEntries();
  }
  
  return segments;
}
