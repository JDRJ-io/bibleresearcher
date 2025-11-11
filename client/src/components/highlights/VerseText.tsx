import type { ReactNode } from 'react';
import { useVerseHighlights, useVerseLevelHighlight } from '@/hooks/useVerseHighlights';
import { decideHighlightPaint } from '@/lib/color-contrast';
import { classesForMask } from '@/lib/labelRenderer';

interface LabelSegment {
  start: number;
  end: number;
  mask: number;
}

interface Props {
  verseRef: string;
  translation?: string;
  text: string;
  children?: ReactNode;
  labelSegments?: LabelSegment[];
}

// Smart highlight component with WCAG contrast compliance
function SmartHighlightSpan({ 
  children, 
  colorHex, 
  opacity = 1,
  labelClasses = ''
}: { 
  children: ReactNode; 
  colorHex: string; 
  opacity?: number;
  labelClasses?: string;
}) {
  // Detect current theme by checking if dark class exists on documentElement
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  const verseBaseBg = isDark ? '#0B0B0B' : '#FFFFFF';
  
  const { textColor, paintBg } = decideHighlightPaint({
    verseBaseBg,
    highlightHex: colorHex,
    opacity,
    targetContrast: 4.5
  });

  return (
    <span
      className={labelClasses}
      style={{
        backgroundColor: paintBg,
        color: textColor,
        // Subtle text shadow for extra clarity on edge cases
        textShadow: `0 0 0.5px ${textColor === '#000000' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'}`
      }}
    >
      {children}
    </span>
  );
}

export function VerseText({ verseRef, translation = 'NKJV', text, children, labelSegments }: Props) {
  // 🎯 PERFORMANCE IMPROVEMENT: Now uses intelligent batching under the hood!
  const { data: ranges = [] } = useVerseHighlights(verseRef, translation);
  const { data: verseLevel } = useVerseLevelHighlight(verseRef);

  // Paint verse-level background (subtle) for auto-highlighting feature
  // For verse-level highlights, we'll also apply smart contrast with text color
  const wrapperStyle = verseLevel ? (() => {
    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    const verseBaseBg = isDark ? '#0B0B0B' : '#FFFFFF';
    const { textColor, paintBg } = decideHighlightPaint({
      verseBaseBg,
      highlightHex: verseLevel.color_hex,
      opacity: verseLevel.opacity ?? 0.15,
      targetContrast: 4.5
    });
    return { 
      backgroundColor: paintBg,
      color: textColor,
      // Subtle text shadow for extra clarity on verse-level highlights
      textShadow: `0 0 0.5px ${textColor === '#000000' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'}`
    };
  })() : undefined;

  // Render content based on whether we have label segments and highlights
  const renderContent = () => {
    // If children are provided, use them (for compatibility)
    if (children) return children;
    
    // Use boundary-based rendering if we have labels or highlights
    if ((labelSegments && labelSegments.length > 0) || (ranges && ranges.length > 0)) {
      // Collect all boundary points from both highlights and label segments
      const boundaries = new Set<number>();
      boundaries.add(0);
      boundaries.add(text.length);
      
      // Add label segment boundaries
      if (labelSegments) {
        for (const seg of labelSegments) {
          boundaries.add(seg.start);
          boundaries.add(seg.end);
        }
      }
      
      // Add highlight boundaries
      if (ranges) {
        for (const r of ranges) {
          boundaries.add(Math.max(0, Math.min(text.length, r.start_offset)));
          boundaries.add(Math.max(0, Math.min(text.length, r.end_offset)));
        }
      }
      
      // Sort boundaries and create fragments
      const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
      const parts: ReactNode[] = [];
      let partKey = 0;
      
      for (let i = 0; i < sortedBoundaries.length - 1; i++) {
        const start = sortedBoundaries[i];
        const end = sortedBoundaries[i + 1];
        
        if (start >= end) continue; // Skip zero-length fragments
        
        const fragmentText = text.slice(start, end);
        
        // Find which highlight (if any) contains this fragment
        const highlight = ranges?.find(r => {
          const s = Math.max(0, Math.min(text.length, r.start_offset));
          const e = Math.max(0, Math.min(text.length, r.end_offset));
          return start >= s && end <= e;
        });
        
        // Find which label segment contains this fragment and get its mask
        const labelSeg = labelSegments?.find(seg => 
          start >= seg.start && end <= seg.end
        );
        const labelCls = labelSeg ? classesForMask(labelSeg.mask) : '';
        
        // Render the fragment
        if (highlight) {
          // This fragment is highlighted
          parts.push(
            <SmartHighlightSpan
              key={`frag:${partKey++}`}
              colorHex={highlight.color_hex}
              opacity={highlight.opacity ?? 1}
              labelClasses={labelCls}
            >
              {fragmentText}
            </SmartHighlightSpan>
          );
        } else {
          // This fragment is not highlighted
          parts.push(
            labelCls ? (
              <span key={`frag:${partKey++}`} className={labelCls}>{fragmentText}</span>
            ) : (
              <span key={`frag:${partKey++}`}>{fragmentText}</span>
            )
          );
        }
      }
      
      return parts;
    }
    
    // No labels or highlights - return plain text
    return text;
  };

  return (
    <span 
      style={{
        ...wrapperStyle,
        userSelect: 'text',
        cursor: 'text'
      }}
      className="verse-text"
      data-verse-ref={verseRef}
      data-translation={translation}
    >
      {renderContent()}
    </span>
  );
}
