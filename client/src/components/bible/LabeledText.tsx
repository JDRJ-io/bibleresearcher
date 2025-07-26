import React from 'react';
import { classesForMask } from '@/lib/labelRenderer';
import type { LabelMask } from '@/lib/labelBits';

interface LabeledTextProps {
  text: string;
  mask: LabelMask;
  segmentKey: number;
}

export function LabeledText({ text, mask, segmentKey }: LabeledTextProps) {
  const classes = classesForMask(mask);
  
  if (classes) {
    return (
      <span className={classes} data-mask={mask}>
        {text}
      </span>
    );
  }
  
  return <>{text}</>;
}
