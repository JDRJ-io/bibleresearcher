export interface BibleSlice {
  verses: Record<string, string>;
  crossRefs: Record<string, string[]>;
  prophecies: Record<string, ProphecyData>;
}

export interface ProphecyData {
  P: string[];
  F: string[];
  V: string[];
}