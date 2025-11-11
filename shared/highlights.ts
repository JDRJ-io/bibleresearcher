/**
 * Highlight Manipulation Utilities
 * Provides functions for adding, removing, and manipulating text highlights
 */

export type Segment = { 
  start: number; 
  end: number; 
  color: string 
};

// Convention: [start,end) ranges (start inclusive, end exclusive)

function normalize(segments: Segment[]): Segment[] {
  if (!segments.length) return [];
  segments.sort((a, b) => a.start - b.start);
  const result: Segment[] = [];
  let prev = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const cur = segments[i];
    if (cur.start <= prev.end && cur.color === prev.color) {
      // merge overlapping/adjacent same-color
      prev.end = Math.max(prev.end, cur.end);
    } else {
      result.push(prev);
      prev = { ...cur };
    }
  }
  result.push(prev);
  return result;
}

export function addRange(
  segments: Segment[],
  start: number,
  end: number,
  color: string
): Segment[] {
  if (start >= end) return segments;
  const result: Segment[] = [];

  for (const seg of segments) {
    // before new
    if (seg.end <= start || seg.start >= end) {
      result.push(seg);
      continue;
    }
    // overlap: keep non-overlapping parts
    if (seg.start < start) result.push({ start: seg.start, end: start, color: seg.color });
    if (seg.end > end) result.push({ start: end, end: seg.end, color: seg.color });
  }
  // insert new segment
  result.push({ start, end, color });
  return normalize(result);
}

export function removeRange(
  segments: Segment[],
  start: number,
  end: number
): Segment[] {
  if (start >= end) return segments;
  const result: Segment[] = [];

  for (const seg of segments) {
    if (seg.end <= start || seg.start >= end) {
      // untouched
      result.push(seg);
      continue;
    }
    // overlap
    if (seg.start < start) result.push({ start: seg.start, end: start, color: seg.color });
    if (seg.end > end) result.push({ start: end, end: seg.end, color: seg.color });
  }
  return normalize(result);
}

export function recolorRange(
  segments: Segment[],
  start: number,
  end: number,
  newColor: string
): Segment[] {
  return addRange(removeRange(segments, start, end), start, end, newColor);
}