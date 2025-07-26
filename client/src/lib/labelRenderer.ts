import { LabelBits, LabelMask } from '@/lib/labelBits';

export function classesForMask(mask: LabelMask): string {
  if (!mask) return '';
  const c: string[] = [];
  if (mask & LabelBits.who)        c.push('fx-hand');
  if (mask & LabelBits.what)       c.push('fx-shadow');
  if (mask & LabelBits.when)       c.push('fx-under');
  if (mask & LabelBits.where)      c.push('fx-bracket');
  if (mask & LabelBits.command)    c.push('fx-bold');
  if (mask & LabelBits.action)     c.push('fx-ital');
  if (mask & LabelBits.why)        c.push('fx-outline');
  if (mask & LabelBits.seed)       c.push('sup-seed');
  if (mask & LabelBits.harvest)    c.push('sup-harvest');
  if (mask & LabelBits.prediction) c.push('sup-predict');
  return c.join(' ');
}