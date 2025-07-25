
// Bitmask-based label renderer for memory optimization
import type { LabelName } from './labelsCache';

// 10-bit enum for label positions
export enum LabelBits {
  who        = 1 << 0,  // 1
  what       = 1 << 1,  // 2  
  when       = 1 << 2,  // 4
  where      = 1 << 3,  // 8
  command    = 1 << 4,  // 16
  action     = 1 << 5,  // 32
  why        = 1 << 6,  // 64
  seed       = 1 << 7,  // 128
  harvest    = 1 << 8,  // 256
  prediction = 1 << 9,  // 512
}

export type LabelMask = number; // 0-1023

// Convert LabelName to bit
export const labelToBit: Record<LabelName, number> = {
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

// Bit to class mapping for fast lookup
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

// Fast class generation from bitmask
export function classesForMask(mask: LabelMask): string {
  let cls = '';
  for (const [bit, str] of Object.entries(bitToClass)) {
    if (mask & Number(bit)) cls += str + ' ';
  }
  return cls.trim();
}

// Regex cache for compiled patterns
const regexCache: Record<string, RegExp[]> = {};

function compileRegexes(tCode: string, label: LabelName, phrases: string[]): RegExp[] {
  const key = `${tCode || 'default'}:${label}`;
  if (regexCache[key]) return regexCache[key];
  
  regexCache[key] = phrases.map(phrase => {
    if (!phrase || phrase.length === 0) return null;
    try {
      return new RegExp(
        phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\W+'), 
        'gi'
      );
    } catch (e) {
      console.warn(`Failed to compile regex for phrase: ${phrase}`, e);
      return null;
    }
  }).filter(Boolean) as RegExp[];
  
  return regexCache[key];
}

// Text segment with bitmask
export interface TextSegment {
  start: number;
  end: number;
  mask: LabelMask;
  text: string;
}

// Event for sweep-line algorithm
interface LabelEvent {
  pos: number;
  bit: LabelMask;
  add: boolean;
}

// Compute segments using sweep-line algorithm
function computeSegments(
  verse: string,
  labelData: Record<LabelName, string[]>,
  activeMask: LabelMask,
  translationCode?: string
): TextSegment[] {
  // Collect all label match events
  const events: LabelEvent[] = [];
  
  for (const [labelName, bit] of Object.entries(labelToBit)) {
    if (!(activeMask & bit)) continue; // Skip inactive labels
    
    const phrases = labelData[labelName as LabelName] || [];
    if (phrases.length === 0) continue;
    
    const regexes = compileRegexes(translationCode || '', labelName as LabelName, phrases);
    
    regexes.forEach(regex => {
      let match: RegExpExecArray | null;
      // Reset regex lastIndex to ensure we find all matches
      regex.lastIndex = 0;
      
      while ((match = regex.exec(verse))) {
        events.push({ pos: match.index, bit, add: true });
        events.push({ pos: match.index + match[0].length, bit, add: false });
        
        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex = match.index + 1;
        }
      }
    });
  }
  
  // If no events, return single segment with no labels
  if (events.length === 0) {
    return [{
      start: 0,
      end: verse.length,
      mask: 0,
      text: verse
    }];
  }
  
  // Sort events: position first, then add before remove
  events.sort((a, b) => a.pos - b.pos || (a.add ? -1 : 1));
  
  // Sweep line to create segments
  const segments: TextSegment[] = [];
  let currentMask: LabelMask = 0;
  let lastPos = 0;
  
  for (const event of events) {
    // Add segment from lastPos to current position if there's content
    if (event.pos > lastPos) {
      segments.push({
        start: lastPos,
        end: event.pos,
        mask: currentMask,
        text: verse.slice(lastPos, event.pos)
      });
    }
    
    // Update current mask
    currentMask = event.add ? (currentMask | event.bit) : (currentMask & ~event.bit);
    lastPos = event.pos;
  }
  
  // Add final segment if needed
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

// Segment cache for memoization
const segmentCache = new Map<string, TextSegment[]>();
const MAX_CACHE_SIZE = 500;

export function getSegmentsCached(
  verse: string,
  labelData: Record<LabelName, string[]>,
  activeMask: LabelMask,
  verseKey?: string,
  translationCode?: string
): TextSegment[] {
  const key = `${verseKey || 'unknown'}|${translationCode || ''}|${activeMask}|${verse.length}`;
  
  let segments = segmentCache.get(key);
  if (!segments) {
    segments = computeSegments(verse, labelData, activeMask, translationCode);
    
    // Simple LRU: clear cache if too large
    if (segmentCache.size >= MAX_CACHE_SIZE) {
      const firstKey = segmentCache.keys().next().value;
      if (firstKey) segmentCache.delete(firstKey);
    }
    
    segmentCache.set(key, segments);
  }
  
  return segments;
}

// Convert active labels array to bitmask
export function labelArrayToBitmask(activeLabels: LabelName[]): LabelMask {
  let mask = 0;
  for (const label of activeLabels) {
    mask |= labelToBit[label] || 0;
  }
  return mask;
}

// Main processing function - updated interface
export function processTextForLabels(
  text: string,
  labelData: Record<LabelName, string[]>,
  activeLabels: LabelName[],
  verseKey?: string,
  translationCode?: string
): TextSegment[] {
  if (activeLabels.length === 0) {
    return [{ start: 0, end: text.length, mask: 0, text }];
  }
  
  const activeMask = labelArrayToBitmask(activeLabels);
  return getSegmentsCached(text, labelData, activeMask, verseKey, translationCode);
}

// Legacy interface for backward compatibility
export interface LabelSegment {
  text: string;
  labels: Set<LabelName>;
}

// Legacy function for backward compatibility
export function processTextForLabelsLegacy(
  text: string,
  labelData: Record<LabelName, string[]>,
  activeLabels: LabelName[]
): LabelSegment[] {
  const segments = processTextForLabels(text, labelData, activeLabels);
  
  return segments.map(segment => {
    const labels = new Set<LabelName>();
    for (const [labelName, bit] of Object.entries(labelToBit)) {
      if (segment.mask & bit) {
        labels.add(labelName as LabelName);
      }
    }
    
    return {
      text: segment.text,
      labels
    };
  });
}
