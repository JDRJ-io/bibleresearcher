import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useVerseSelection } from '@/contexts/SelectionContext';
import { queryClient } from '@/lib/queryClient';
import { addHighlight, eraseHighlightPortion } from '@/lib/userDataApi';
import { ColorPickerPopover } from '@/components/ui/ColorPickerPopover';
import { createPortal } from 'react-dom';
import { useEffect, useRef, memo } from 'react';
import { Star } from 'lucide-react';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { paintOptimistic, eraseOptimistic } from '@/stores/highlightsStore';
import { toast } from '@/hooks/use-toast';

// Memoized to prevent re-renders when selection hasn't changed
const HighlightToolbarComponent = memo(function HighlightToolbar({ onHighlightSaved }: {
  onHighlightSaved?: (highlight: { id: string; verse_ref: string; translation: string; user_id: string }) => void;
}) {
  const { user } = useAuth();
  const { selection, clearSelection } = useVerseSelection();
  const { activeTranslations, getVerseText } = useTranslationMaps();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close the toolbar - MUST be before early return
  useEffect(() => {
    // Only add listeners when there's an active selection
    if (!selection) return;

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as HTMLElement;
      if (toolbarRef.current?.contains(target)) return; // inside toolbar
      if (target.closest('[data-testid="popover-color-picker"]')) return; // inside color popover
      clearSelection();
    }

    // Add both mouse and touch event listeners for better cross-device support
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [clearSelection, selection]);

  if (!selection) return null;

  const { verseRef, translation, startPos, endPos, rect } = selection;
  
  // Smart positioning to avoid conflicts with native selection handles
  const calculatePosition = () => {
    if (!rect) return { top: 0, left: 0 };
    
    const toolbarWidth = 240; // Approximate width of the toolbar
    const toolbarHeight = 44; // Approximate height of the toolbar
    const margin = 8; // Margin from viewport edges
    
    // Use visualViewport for mobile keyboard support, fallback to window
    const visualViewport = window.visualViewport;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportWidth = visualViewport?.width ?? window.innerWidth;
    const scrollTop = window.scrollY;
    
    // Calculate selection's vertical midpoint in document coordinates
    const selectionCenterY = rect.top + window.scrollY + rect.height / 2;
    
    // Calculate viewport's vertical midpoint in document coordinates
    const viewportMidY = scrollTop + viewportHeight / 2;
    
    // Determine position based on which half of viewport the selection is in
    // Top half → toolbar above (native handles below)
    // Bottom half → toolbar below (native handles above)
    let top: number;
    const isInTopHalf = selectionCenterY < viewportMidY;
    
    if (isInTopHalf) {
      // Selection in top half → position toolbar ABOVE
      top = rect.top + window.scrollY - toolbarHeight - margin;
    } else {
      // Selection in bottom half → position toolbar BELOW
      top = rect.bottom + window.scrollY + margin;
    }
    
    // Horizontal centering
    let left = rect.left + window.scrollX - toolbarWidth / 2 + rect.width / 2;
    
    // Clamp horizontal position to viewport boundaries
    if (left < margin) {
      left = margin;
    } else if (left + toolbarWidth > viewportWidth - margin) {
      left = viewportWidth - toolbarWidth - margin;
    }
    
    // Safety: ensure toolbar stays within viewport bounds
    // If toolbar would go above viewport, move it below selection
    if (top < scrollTop + margin) {
      top = rect.bottom + window.scrollY + margin;
    }
    
    // If toolbar would go below viewport, move it above selection
    if (top + toolbarHeight > scrollTop + viewportHeight - margin) {
      top = rect.top + window.scrollY - toolbarHeight - margin;
    }
    
    // Last resort: clamp to viewport edges
    if (top < scrollTop + margin) {
      top = scrollTop + margin;
    }
    if (top + toolbarHeight > scrollTop + viewportHeight - margin) {
      top = scrollTop + viewportHeight - toolbarHeight - margin;
    }
    
    return { top, left };
  };
  
  const { top, left } = calculatePosition();

  function normalizeSelection(start: number, end: number, textLen: number) {
    let a = Math.max(0, Math.min(start, end));
    let b = Math.max(a + 1, Math.max(start, end));  // at least 1 char
    // clamp to text length if you pass it in (optional but helpful)
    if (Number.isFinite(textLen)) {
      a = Math.min(a, textLen);
      b = Math.min(b, textLen);
    }
    return { a, b };
  }

  async function removeHighlight() {
    if (!user) {
      toast({
        title: "Sign in to save highlights!",
        description: "Create an account to save and sync your highlights across devices.",
        variant: "default"
      });
      return;
    }
    
    try {
      // Normalize selection offsets to be end-exclusive
      const { a, b } = normalizeSelection(startPos, endPos, selection?.textLength ?? Number.POSITIVE_INFINITY);
      
      console.log('🗑️ Removing highlights for selection:', {
        verse_ref: verseRef,
        translation: translation,
        raw_start: startPos,
        raw_end: endPos,
        normalized_start: a,
        normalized_end: b,
        text_length: selection?.textLength,
        user_id: user.id
      });

      // Use V2 erase system for intuitive highlight removal
      const V2 = import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED === 'true';
      if (V2) {
        // V2: Erase optimistically - removes highlighting from selection
        const tempId = eraseOptimistic(
          verseRef,
          translation,
          a,
          b
        );
        console.log('✅ V2 erase highlight created optimistically:', { tempId });
      } else {
        // V1: Legacy eraseHighlightPortion with cache invalidation
        await eraseHighlightPortion(verseRef, a, b, translation);

        queryClient.invalidateQueries({ 
          queryKey: ['hl:ranges', verseRef, translation] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['hl:verse', verseRef] 
        });
      }
      
      // Clear the text selection after removing
      const windowSelection = window.getSelection();
      if (windowSelection) {
        windowSelection.removeAllRanges();
      }
      
      clearSelection();
    } catch (error) {
      console.error('💥 Failed to remove highlight:', error);
      clearSelection();
    }
  }

  async function saveHighlight(colorHex: string, opacity: number) {
    if (!user) {
      toast({
        title: "Sign in to save highlights!",
        description: "Create an account to save and sync your highlights across devices.",
        variant: "default"
      });
      return;
    }
    
    try {
      console.log('💾 Saving highlight:', {
        verse_ref: verseRef,
        translation: translation,
        start_pos: startPos,
        end_pos: endPos,
        color_hex: colorHex,
        opacity: opacity,
        user_id: user.id
      });

      // Use V2 paint system for intuitive highlight behavior
      const V2 = import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED === 'true';
      if (V2) {
        // V2: Paint optimistically - replaces overlapping highlights
        const tempId = paintOptimistic(
          verseRef,
          translation,
          startPos,
          endPos,
          colorHex,
          undefined, // no note
          opacity
        );
        console.log('✅ V2 paint highlight created optimistically:', { tempId });
      } else {
        // V1: Legacy addHighlight with cache invalidation
        await addHighlight(
          user.id,
          verseRef,
          startPos,
          endPos,
          colorHex,
          translation,
          undefined, // no note
          opacity
        );

        queryClient.invalidateQueries({ 
          queryKey: ['hl:ranges', verseRef, translation] 
        });
        queryClient.invalidateQueries({ 
          queryKey: ['hl:verse', verseRef] 
        });
      }
      
      // Clear the text selection after saving
      const windowSelection = window.getSelection();
      if (windowSelection) {
        windowSelection.removeAllRanges();
      }
      
      clearSelection();
    } catch (error) {
      console.error('💥 Failed to save highlight:', error);
      // Still close the toolbar even if save failed
      clearSelection();
    }
  }

  async function highlightEntireVerse(colorHex: string, opacity: number) {
    if (!user) {
      toast({
        title: "Sign in to save highlights!",
        description: "Create an account to save and sync your highlights across devices.",
        variant: "default"
      });
      return;
    }
    
    try {
      console.log('⭐ Highlighting entire verse across all translations:', {
        verse_ref: verseRef,
        active_translations: activeTranslations,
        color_hex: colorHex,
        opacity: opacity,
        user_id: user.id
      });

      // Highlight the entire verse (0 to end) for each active translation
      const V2 = import.meta.env.VITE_HIGHLIGHTS_V2_ENABLED === 'true';
      if (V2) {
        // V2: Paint optimistically for each translation
        const paintResults = activeTranslations.map((translationCode) => {
          const verseText = getVerseText(verseRef, translationCode);
          if (!verseText) {
            console.warn(`⚠️ No text found for ${verseRef} in ${translationCode}`);
            return null;
          }
          
          const textLength = verseText.length;
          const tempId = paintOptimistic(
            verseRef,
            translationCode,
            0, // start of verse
            textLength, // end of verse
            colorHex,
            undefined, // no note
            opacity
          );
          return { translationCode, tempId };
        }).filter(result => result !== null);

        console.log('✅ V2 paint entire verse across all translations:', paintResults);
      } else {
        // V1: Legacy addHighlight with cache invalidation
        const promises = activeTranslations.map(async (translationCode) => {
          const verseText = getVerseText(verseRef, translationCode);
          if (!verseText) {
            console.warn(`⚠️ No text found for ${verseRef} in ${translationCode}`);
            return;
          }
          
          const textLength = verseText.length;
          return addHighlight(
            user.id,
            verseRef,
            0, // start of verse
            textLength, // end of verse
            colorHex,
            translationCode,
            undefined, // no note
            opacity
          );
        });

        await Promise.all(promises);

        console.log('✅ Entire verse highlighted across all translations');
        
        // Force cache refresh for all translations
        activeTranslations.forEach(translationCode => {
          queryClient.invalidateQueries({ 
            queryKey: ['hl:ranges', verseRef, translationCode] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['hl:verse', verseRef] 
          });
        });
      }
      
      // Clear the text selection after saving
      const windowSelection = window.getSelection();
      if (windowSelection) {
        windowSelection.removeAllRanges();
      }
      
      clearSelection();
    } catch (error) {
      console.error('💥 Failed to highlight entire verse:', error);
      // Still close the toolbar even if save failed
      clearSelection();
    }
  }


  return createPortal(
    <motion.div
      ref={toolbarRef}
      className="fixed z-50 flex gap-1 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg backdrop-blur-sm"
      style={{ left, top }}
      initial={{ opacity: 0, scale: .9, y: 4 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: .9, y: 4 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <ColorPickerPopover
        verseKey={verseRef}
        translation={translation}
        onPick={saveHighlight}
        initialColor="#FF8C00"
        initialOpacity={0.9}
        autoSaveToPalette={true}
      >
        <button 
          className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-150 shadow-sm"
          data-testid="button-highlight"
        >
          Highlight
        </button>
      </ColorPickerPopover>
      <button
        onClick={removeHighlight}
        className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-colors duration-150 shadow-sm"
        title="Remove highlight"
        data-testid="button-remove-highlight"
      >
        Remove
      </button>
    </motion.div>,
    document.body
  );
});

// Export the memoized component
export { HighlightToolbarComponent as HighlightToolbar };