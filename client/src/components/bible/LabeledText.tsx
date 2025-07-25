import React from 'react';
import { classesForMask } from '@/lib/labelRenderer';

interface LabeledTextProps {
  text: string;
  mask: number; // Bitmask for new approach
  segmentKey?: string | number;
}

export function LabeledText({ text, mask, segmentKey }: LabeledTextProps) {
  if (mask === 0) {
    return <>{text}</>;
  }

  const className = classesForMask(mask);

  return (
    <span className={className} key={segmentKey}>
      {text}
    </span>
  );
}