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
 * Data Format (from replit.md): 
 * Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
 * - $$ separates verse from cross-references
 * - $ separates reference groups  
 * - # separates individual references within a group
 * 
 * UI Spec: Text wrapping with vertical scroll, no horizontal overflow
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
  
  // Debug logging for first few verses
  if (dotFormat === 'Gen.1:1' || dotFormat === 'Gen.1:2') {
    console.log(`🔍 CrossReferencesCell Debug for ${dotFormat}:`, { refs, crossRefs: crossRefs[dotFormat] });
  }
  
  if (refs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-1 whitespace-nowrap overflow-hidden">
        -
      </div>
    );
  }

  const handleRefClick = (ref: string) => {
    if (onNavigateToVerse) {
      // Convert back to space format for navigation (Gen.1:1 -> Gen 1:1)
      const spaceFormat = ref.replace(/\./g, ' ');
      onNavigateToVerse(spaceFormat);
    }
  };

  return (
    <div className="text-xs p-1 max-h-[120px] overflow-y-auto overflow-x-hidden">
      {/* Show count badge */}
      <div className="text-sky-600 font-medium mb-1 whitespace-nowrap">
        {refs.length} ref{refs.length !== 1 ? 's' : ''}
      </div>
      
      {/* Render cross-reference buttons with proper text wrapping */}
      <div className="space-y-1">
        {refs.slice(0, 8).map((ref, index) => {
          const verseText = getVerseText(ref, mainTranslation) || '';
          const previewText = verseText.length > 35 ? verseText.slice(0, 35) + '…' : verseText;
          
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleRefClick(ref);
              }}
              className="block w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1 transition-colors border-0 bg-transparent"
              title={`Navigate to ${ref}: ${verseText}`}
            >
              {/* Reference on its own line for better readability */}
              <div className="font-mono text-xs text-blue-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {ref}
              </div>
              {/* Verse text preview with text wrapping */}
              {previewText && (
                <div className="text-xs text-gray-600 dark:text-gray-300 leading-tight mt-0.5 break-words">
                  {previewText}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Show truncation indicator if there are more refs */}
      {refs.length > 8 && (
        <div className="text-xs text-muted-foreground italic mt-1 whitespace-nowrap">
          +{refs.length - 8} more
        </div>
      )}
    </div>
  );
};

export default CrossReferencesCell;