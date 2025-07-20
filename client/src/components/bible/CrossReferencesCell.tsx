import React from 'react';
import { useBibleStore } from '@/App';
import { useBibleData } from '@/hooks/useBibleData';

interface CrossReferencesCellProps {
  verseReference: string;
  onNavigateToVerse?: (ref: string) => void;
}

/**
 * CrossReferencesCell component for slot 3 in the UI layout
 * Displays cross-references for a verse based on worker-loaded data
 * 
 * UI Spec: Slot 3 - Cross References with clickable ref buttons showing verse text preview
 */
export const CrossReferencesCell: React.FC<CrossReferencesCellProps> = ({ 
  verseReference, 
  onNavigateToVerse 
}) => {
  const { crossRefs } = useBibleStore();
  const { getVerseText } = useBibleData();
  
  // Convert verse reference to the format used in crossRefs store (Gen.1:1)
  const dotFormat = verseReference.replace(/\s+/g, '.');
  const refs = crossRefs[dotFormat] || [];

  // Get main translation for preview text
  const mainTranslation = 'KJV'; // Default to KJV for cross-ref previews
  
  if (refs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-1">
        -
      </div>
    );
  }

  const handleRefClick = (ref: string) => {
    if (onNavigateToVerse) {
      // Convert back to space format for navigation
      const spaceFormat = ref.replace(/\./g, ' ');
      onNavigateToVerse(spaceFormat);
    }
  };

  return (
    <div className="text-xs space-y-1 p-1 max-h-[120px] overflow-y-auto">
      {/* Show count badge */}
      <div className="text-sky-600 font-medium mb-1">
        {refs.length} ref{refs.length !== 1 ? 's' : ''}
      </div>
      
      {/* Render cross-reference buttons per UI spec */}
      {refs.slice(0, 6).map((ref, index) => {
        const verseText = getVerseText(ref, mainTranslation) || '';
        const previewText = verseText.length > 40 ? verseText.slice(0, 40) + '…' : verseText;
        
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              handleRefClick(ref);
            }}
            className="flex gap-1 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1 transition-colors"
            title={`Navigate to ${ref}: ${verseText}`}
          >
            <span className="w-14 font-mono text-xs text-blue-600 flex-shrink-0">
              {ref}
            </span>
            <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 leading-tight">
              {previewText || `[${ref}]`}
            </span>
          </button>
        );
      })}
      
      {/* Show truncation indicator if there are more refs */}
      {refs.length > 6 && (
        <div className="text-xs text-muted-foreground italic">
          +{refs.length - 6} more
        </div>
      )}
    </div>
  );
};

export default CrossReferencesCell;