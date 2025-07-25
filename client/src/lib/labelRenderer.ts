
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
  if (mask === 0) return '';
  
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

  try {
    regexCache[key] = phrases
      .filter(phrase => phrase && phrase.trim().length > 0)
      .map(phrase =>
        new RegExp(
          phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\W+'),
          'gi'
        )
      );
    return regexCache[key];
  } catch (error) {
    console.warn(`Failed to compile regex for ${label}:`, error);
    regexCache[key] = [];
    return [];
  }
}

// Segment interface for text processing
export interface TextSegment {
  start: number;
  end: number;
  mask: LabelMask;
  text: string;
}

// Main function to process text with labels
export function processTextForLabels(
  text: string,
  labelData: Record<LabelName, string[]>,
  activeLabels: LabelName[]
): TextSegment[] {
  if (!text || activeLabels.length === 0) {
    return [{ start: 0, end: text.length, mask: 0, text }];
  }

  try {
    // Collect all intervals where labels apply
    const events: { pos: number; bit: LabelMask; add: boolean }[] = [];

    for (const label of activeLabels) {
      const phrases = labelData[label] || [];
      if (phrases.length === 0) continue;

      const bit = labelToBit[label];
      if (!bit) continue;

      const regexes = compileRegexes('default', label, phrases);

      for (const regex of regexes) {
        let match;
        regex.lastIndex = 0; // Reset regex state

        while ((match = regex.exec(text)) !== null) {
          events.push({ pos: match.index, bit, add: true });
          events.push({ pos: match.index + match[0].length, bit, add: false });

          // Prevent infinite loop on zero-length matches
          if (match[0].length === 0) {
            regex.lastIndex = match.index + 1;
          }
        }
      }
    }

    // Sort events by position
    events.sort((a, b) => a.pos - b.pos || (a.add ? -1 : 1));

    // Sweep line algorithm to create segments
    const segments: TextSegment[] = [];
    let currentMask = 0;
    let lastPos = 0;

    for (const event of events) {
      // Create segment for text before this event
      if (event.pos > lastPos) {
        const segmentText = text.slice(lastPos, event.pos);
        segments.push({
          start: lastPos,
          end: event.pos,
          mask: currentMask,
          text: segmentText
        });
      }

      // Update current mask
      if (event.add) {
        currentMask |= event.bit;
      } else {
        currentMask &= ~event.bit;
      }

      lastPos = event.pos;
    }

    // Add final segment
    if (lastPos < text.length) {
      const segmentText = text.slice(lastPos);
      segments.push({
        start: lastPos,
        end: text.length,
        mask: currentMask,
        text: segmentText
      });
    }

    // If no segments were created, return the whole text as one segment
    if (segments.length === 0) {
      return [{ start: 0, end: text.length, mask: 0, text }];
    }

    return segments;
  } catch (error) {
    console.warn('Error processing text for labels:', error);
    return [{ start: 0, end: text.length, mask: 0, text }];
  }
}
