import { LabelBits, LabelMask } from '@/lib/labelBits';

export function classesForMask(mask: LabelMask): string {
  if (!mask) return '';
  const cls: string[] = [];
  if (mask & LabelBits.who)        cls.push('fx-hand');
  if (mask & LabelBits.what)       cls.push('fx-shadow');
  if (mask & LabelBits.when)       cls.push('fx-under');
  if (mask & LabelBits.where)      cls.push('fx-bracket');
  if (mask & LabelBits.command)    cls.push('fx-bold');
  if (mask & LabelBits.action)     cls.push('fx-ital');
  if (mask & LabelBits.why)        cls.push('fx-outline');
  if (mask & LabelBits.seed)       cls.push('sup-seed');
  if (mask & LabelBits.harvest)    cls.push('sup-harvest');
  if (mask & LabelBits.prediction) cls.push('sup-predict');
  return cls.join(' ');
}