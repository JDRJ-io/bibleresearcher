import React from 'react';
import { classesForMask } from '@/lib/labelRenderer';
import type { LabelName } from '@/lib/labelsCache';

interface LabeledTextProps {
  text: string;
  labels?: Set<LabelName> | number; // Support both old Set and new bitmask
  segmentKey?: string | number;
  mask?: number; // New bitmask prop
}

export function LabeledText({ text, labels, mask, segmentKey }: LabeledTextProps) {
  // Handle both old Set-based and new bitmask-based approaches
  const finalMask = typeof mask === 'number' ? mask : 
                    typeof labels === 'number' ? labels : 0;

  if (finalMask === 0) {
    return <>{text}</>;
  }

  const className = classesForMask(finalMask);

  return (
    <span className={className} key={segmentKey}>
      {text}
    </span>
  );
}