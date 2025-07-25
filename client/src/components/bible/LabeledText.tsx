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
import React from 'react';
import { classesForMask, type LabelMask } from '@/lib/labelRenderer';

interface LabeledTextProps {
  text: string;
  mask: LabelMask;
  segmentKey: number;
}

export function LabeledText({ text, mask, segmentKey }: LabeledTextProps) {
  const classes = classesForMask(mask);
  
  // Debug logging to see what's happening
  if (mask > 0) {
    console.log(`🏷️ LabeledText segment ${segmentKey}: mask=${mask}, classes="${classes}", text="${text.substring(0, 20)}..."`);
  }
  
  if (classes) {
    return (
      <span className={classes} data-mask={mask}>
        {text}
      </span>
    );
  }
  
  return <>{text}</>;
}
