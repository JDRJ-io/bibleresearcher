import { useState, useCallback, useEffect, useRef } from 'react';
import { useHighlights, adaptColorForTheme } from '@/hooks/useHighlights';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '../bible/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import { useDoubleTapHold } from '@/hooks/useDoubleTapHold';

interface HighlightedTextProps {
  text: string;
  verseRef: string;
  translation: string;
  className?: string;
}

export function HighlightedText({ text, verseRef, translation, className }: HighlightedTextProps) {
  const { user } = useAuth();
  const { highlights, addHighlight, deleteHighlight } = useHighlights(verseRef);
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    x: number;
    y: number;
  } | null>(null);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const textContainerRef = useRef<HTMLDivElement>(null);

  const colorOptions = [
    { name: 'Yellow', hsl: '60 100% 80%' },
    { name: 'Green', hsl: '120 50% 75%' },
    { name: 'Blue', hsl: '210 80% 80%' },
    { name: 'Pink', hsl: '320 70% 85%' },
    { name: 'Orange', hsl: '30 90% 80%' },
    { name: 'Purple', hsl: '270 60% 80%' },
  ];

  const handleTextSelection = useCallback((e: MouseEvent | TouchEvent) => {
    if (!user) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const textContent = range.toString();
    
    // Check if selection is within our text element
    const containerElement = textContainerRef.current;
    if (!containerElement || !containerElement.contains(range.commonAncestorContainer)) {
      return;
    }

    // Calculate character offsets within our text
    const startOffset = getTextOffset(containerElement, range.startContainer, range.startOffset);
    const endOffset = getTextOffset(containerElement, range.endContainer, range.endOffset);
    
    if (startOffset >= 0 && endOffset <= text.length && textContent.trim() && startOffset < endOffset) {
      // Get coordinates for the popover
      let clientX: number, clientY: number;
      if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        // For touch events, use the last touch position
        const touch = e.changedTouches[0] || e.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      }

      setSelection({
        start: startOffset,
        end: endOffset,
        x: clientX,
        y: clientY - 10,
      });
      setColorPopoverOpen(true);
    }
  }, [user, text]);

  // Helper function to get text offset within container
  const getTextOffset = useCallback((container: Node, node: Node, offset: number): number => {
    let textOffset = 0;
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT
    );

    let currentNode;
    while (currentNode = walker.nextNode()) {
      if (currentNode === node) {
        return textOffset + offset;
      }
      textOffset += currentNode.textContent?.length || 0;
    }
    
    return textOffset;
  }, []);

  // Handle double tap and hold for touch highlighting
  const handleDoubleTapHold = useCallback(() => {
    // This triggers when double tap is held - we want to show highlight options
    if (!user) return;
    
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    // Get the last touch position if available, otherwise use center of selection
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelection({
      start: 0, // Will be calculated properly in handleTextSelection
      end: 0,   // Will be calculated properly in handleTextSelection  
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    
    // Process the selection to get proper offsets
    handleTextSelection(new TouchEvent('touchend'));
  }, [user, handleTextSelection]);

  const doubleTapHoldEvents = useDoubleTapHold({
    onDoubleTap: handleDoubleTapHold,
    holdThreshold: 250, // 250ms hold threshold
    doubleTapTimeout: 300 // 300ms between taps
  });

  useEffect(() => {
    // Add mouse event listeners
    document.addEventListener('mouseup', handleTextSelection);
    
    // Add touch event listeners 
    document.addEventListener('touchend', handleTextSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('touchend', handleTextSelection);
    };
  }, [handleTextSelection]);

  const handleAddHighlight = async (color: string) => {
    if (!selection || !user) return;

    try {
      await addHighlight(translation, selection.start, selection.end, color);
      toast({ title: "Text highlighted" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add highlight",
        variant: "destructive"
      });
    } finally {
      setSelection(null);
      setColorPopoverOpen(false);
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleRemoveHighlight = async (highlightId: number) => {
    try {
      await deleteHighlight(highlightId);
      toast({ title: "Highlight removed" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove highlight",
        variant: "destructive"
      });
    }
  };

  // Create highlighted text segments
  const renderHighlightedText = () => {
    if (!highlights.length) {
      return <span>{text}</span>;
    }

    const segments: Array<{ text: string; highlight?: typeof highlights[0] }> = [];
    let lastIndex = 0;

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start_pos - b.start_pos);

    sortedHighlights.forEach((highlight) => {
      // Add text before highlight
      if (highlight.start_pos > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, highlight.start_pos)
        });
      }

      // Add highlighted text
      segments.push({
        text: text.slice(highlight.start_pos, highlight.end_pos),
        highlight
      });

      lastIndex = highlight.end_pos;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        text: text.slice(lastIndex)
      });
    }

    return segments.map((segment, index) => {
      if (segment.highlight) {
        const adaptedColor = adaptColorForTheme(segment.highlight.color_hsl, theme);
        return (
          <span
            key={index}
            className="cursor-pointer rounded-sm px-0.5"
            style={{
              backgroundColor: `hsl(${adaptedColor})`,
            }}
            onClick={() => handleRemoveHighlight(segment.highlight!.id)}
            title="Click to remove highlight"
          >
            {segment.text}
          </span>
        );
      }
      return <span key={index}>{segment.text}</span>;
    });
  };

  return (
    <div 
      ref={textContainerRef}
      className={className}
      {...doubleTapHoldEvents}
      style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
    >
      {renderHighlightedText()}
      
      {selection && colorPopoverOpen && (
        <div
          className="fixed z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl p-2 backdrop-blur-sm"
          style={{
            left: selection.x - 10,
            top: selection.y - 6,
          }}
        >
          <div className="flex items-center gap-1.5">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-800 shadow-sm hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer ring-offset-2 hover:ring-2 hover:ring-zinc-300 dark:hover:ring-zinc-600"
                style={{
                  backgroundColor: `hsl(${adaptColorForTheme(color.hsl, theme)})`,
                }}
                onClick={() => handleAddHighlight(color.hsl)}
                title={`Highlight with ${color.name}`}
                data-testid={`color-${color.name.toLowerCase()}`}
              />
            ))}
            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1" />
            <button
              onClick={() => {
                setSelection(null);
                setColorPopoverOpen(false);
                window.getSelection()?.removeAllRanges();
              }}
              className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors duration-150 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-xs font-medium"
              title="Cancel selection"
              data-testid="button-cancel-selection"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}