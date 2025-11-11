// Shared enum for label bits - used by both main thread and worker
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
export type LabelName = keyof typeof LabelBits;

export const allLabelNames = Object.keys(LabelBits) as (keyof typeof LabelBits)[];