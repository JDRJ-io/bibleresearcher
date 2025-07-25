
import React from 'react';
import type { LabelName } from '@/lib/labelsCache';

interface LabeledTextProps {
  text: string;
  labels: Set<LabelName>;
  segmentKey: number;
}

function wrapWithEffects(text: string, labels: Set<LabelName>, key: number): React.ReactNode {
  if (!labels.size) {
    return <span key={key}>{text}</span>;
  }

  // 1) Classes that can share a single wrapper span
  const comboCls: string[] = [];
  if (labels.has('who')) comboCls.push('fx-hand');
  if (labels.has('what')) comboCls.push('fx-shadow');
  if (labels.has('when')) comboCls.push('fx-under');
  if (labels.has('command')) comboCls.push('fx-bold');
  if (labels.has('action')) comboCls.push('fx-ital');
  if (labels.has('why')) comboCls.push('fx-outline');

  let node: React.ReactNode = (
    <span className={comboCls.join(' ')}>
      {text}
    </span>
  );

  // 2) Superscript markers (max one in practice)
  if (labels.has('seed') || labels.has('harvest') || labels.has('prediction')) {
    const supCls = labels.has('seed')
      ? 'sup-seed'
      : labels.has('harvest')
      ? 'sup-harvest'
      : 'sup-predict'; // prediction
    node = <span className={supCls}>{node}</span>;
  }

  // 3) Brackets (outer-most wrapper)
  if (labels.has('where')) {
    node = <span className="fx-bracket">{node}</span>;
  }

  return <React.Fragment key={key}>{node}</React.Fragment>;
}

export function LabeledText({ text, labels, segmentKey }: LabeledTextProps): React.ReactNode {
  return wrapWithEffects(text, labels, segmentKey);
}
