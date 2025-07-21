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
  const rawRefs = crossRefs[dotFormat] || [];

  // Get main translation from store instead of hardcoded value
  const mainTranslation = useTranslationMaps((state) => state.main) || 'KJV';
  
  // Parse cross-references if they're in raw format
  const parsedRefs: string[] = [];
  
  if (Array.isArray(rawRefs)) {
    rawRefs.forEach(rawRef => {
      if (typeof rawRef === 'string') {
        if (rawRef.includes('$$')) {
          // Parse raw format: Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3
          const [, crossRefsText] = rawRef.split('$$', 2);
          if (crossRefsText) {
            const groups = crossRefsText.split('$');
            groups.forEach(group => {
              const trimmedGroup = group.trim();
              if (trimmedGroup) {
                if (trimmedGroup.includes('#')) {
                  // Handle sequential references within group
                  const sequentialRefs = trimmedGroup.split('#');
                  sequentialRefs.forEach(ref => {
                    const trimmedRef = ref.trim().replace(/\r$/, ''); // Remove carriage return
                    if (trimmedRef) {
                      parsedRefs.push(trimmedRef);
                    }
                  });
                } else {
                  // Single reference in group
                  const trimmedRef = trimmedGroup.replace(/\r$/, ''); // Remove carriage return
                  if (trimmedRef) {
                    parsedRefs.push(trimmedRef);
                  }
                }
              }
            });
          }
        } else {
          // Already parsed format
          parsedRefs.push(rawRef);
        }
      }
    });
  }
  
  // Debug logging for first few verses
  if (dotFormat === 'Gen.1:1' || dotFormat === 'Gen.1:2') {
    console.log(`🔍 CrossReferencesCell Debug for ${dotFormat}:`, { 
      rawRefs: Array.isArray(rawRefs) ? rawRefs.slice(0, 5) : rawRefs, 
      parsedRefs: parsedRefs.slice(0, 10),
      totalParsed: parsedRefs.length,
      allRefsAvailable: parsedRefs.length
    });
  }
  
  if (parsedRefs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic p-1 whitespace-nowrap overflow-hidden">
        -
      </div>
    );
  }

  const handleRefClick = (ref: string) => {
    console.log(`🎯 handleRefClick called with: "${ref}"`);
    console.log(`🎯 onNavigateToVerse function exists:`, !!onNavigateToVerse);
    if (onNavigateToVerse) {
      // Convert back to space format for navigation (Gen.1:1 -> Gen 1:1)
      const spaceFormat = ref.replace(/\./g, ' ');
      console.log(`🎯 Calling onNavigateToVerse with: "${spaceFormat}"`);
      onNavigateToVerse(spaceFormat);
    } else {
      console.error(`❌ No onNavigateToVerse function provided!`);
    }
  };

  return (
    <div className="text-xs p-1 max-h-[120px] overflow-y-auto overflow-x-hidden">
      {/* Show count badge */}
      <div className="text-sky-600 font-medium mb-1 whitespace-nowrap">
        {parsedRefs.length} ref{parsedRefs.length !== 1 ? 's' : ''}
      </div>
      
      {/* Render ALL cross-reference buttons with full verse text */}
      <div className="space-y-1">
        {parsedRefs.map((ref, index) => {
          // Get verse text from cached translation (no network calls)
          const verseText = getVerseText(ref, mainTranslation) || '';
          
          return (
            <div key={index} className="border-b border-gray-100 dark:border-gray-800 pb-1 mb-1 last:border-b-0 last:pb-0 last:mb-0">
              {/* Clickable verse reference with distinct hover state */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🔗 Cross-ref click: ${ref} -> navigating to verse`);
                  handleRefClick(ref);
                }}
                className="inline-block font-mono text-xs text-blue-600 dark:text-blue-400 font-medium hover:text-blue-800 dark:hover:text-blue-200 hover:underline cursor-pointer bg-transparent border-0 p-0 transition-colors"
                title={`Navigate to ${ref}`}
              >
                {ref}
              </button>
              {/* Full verse text - not clickable */}
              {verseText && (
                <div className="text-xs text-gray-600 dark:text-gray-300 leading-tight mt-0.5 break-words select-text">
                  {verseText}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrossReferencesCell;