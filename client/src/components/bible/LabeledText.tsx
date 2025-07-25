import React from 'react';
import { classesForMask } from '@/lib/labelRenderer';
import type { LabelName } from '@/lib/labelsCache';

interface LabeledTextProps {
  text: string;
  labels?: Set<LabelName>; // Legacy support for old approach
  segmentKey?: string | number;
  mask?: number; // New bitmask prop
}

export function LabeledText({ text, labels, mask, segmentKey }: LabeledTextProps) {
  // Prioritize new bitmask approach
  let finalMask = mask || 0;
  
  // Legacy fallback for Set-based labels (for backward compatibility)
  if (finalMask === 0 && labels && labels instanceof Set && labels.size > 0) {
    // Convert Set to bitmask for legacy components
    const labelToBit: Record<LabelName, number> = {
      who: 1 << 0,
      what: 1 << 1,
      when: 1 << 2,
      where: 1 << 3,
      command: 1 << 4,
      action: 1 << 5,
      why: 1 << 6,
      seed: 1 << 7,
      harvest: 1 << 8,
      prediction: 1 << 9,
    };
    
    for (const label of labels) {
      finalMask |= labelToBit[label] || 0;
    }
  }

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