export interface ProphecyData {
  P: string[]; // Prediction
  F: string[]; // Fulfillment  
  V: string[]; // Verification / witness
}

export interface BibleSlice {
  verseIDs: Record<string, string>;
  crossRefs: Record<string, string[]>;
  prophecies: Record<string, ProphecyData>;
}