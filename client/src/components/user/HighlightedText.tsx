import { useState, useCallback, useEffect } from 'react';
import { useHighlights, adaptColorForTheme } from '@/hooks/useHighlights';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '../bible/ThemeProvider';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

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

  const colorOptions = [
    { name: 'Yellow', hsl: '60 100% 80%' },
    { name: 'Green', hsl: '120 50% 75%' },
    { name: 'Blue', hsl: '210 80% 80%' },
    { name: 'Pink', hsl: '320 70% 85%' },
    { name: 'Orange', hsl: '30 90% 80%' },
    { name: 'Purple', hsl: '270 60% 80%' },
  ];

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!user) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelection(null);
      return;
    }

    const range = sel.getRangeAt(0);
    const textContent = range.toString();
    
    // Check if selection is within our text element
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    
    if (startOffset >= 0 && endOffset <= text.length && textContent.trim()) {
      setSelection({
        start: startOffset,
        end: endOffset,
        x: e.clientX,
        y: e.clientY - 10,
      });
      setColorPopoverOpen(true);
    }
  }, [user, text]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const handleAddHighlight = async (color: string) => {
    if (!selection || !user) return;

    try {
      await addHighlight(selection.start, selection.end, color);
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
    const sortedHighlights = [...highlights].sort((a, b) => a.startIdx - b.startIdx);

    sortedHighlights.forEach((highlight) => {
      // Add text before highlight
      if (highlight.startIdx > lastIndex) {
        segments.push({
          text: text.slice(lastIndex, highlight.startIdx)
        });
      }

      // Add highlighted text
      segments.push({
        text: text.slice(highlight.startIdx, highlight.endIdx),
        highlight
      });

      lastIndex = highlight.endIdx;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      segments.push({
        text: text.slice(lastIndex)
      });
    }

    return segments.map((segment, index) => {
      if (segment.highlight) {
        const adaptedColor = adaptColorForTheme(segment.highlight.color, theme);
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
    <div className={className}>
      {renderHighlightedText()}
      
      {selection && colorPopoverOpen && (
        <div
          className="fixed z-50 bg-background border rounded-lg shadow-lg p-2"
          style={{
            left: selection.x,
            top: selection.y,
          }}
        >
          <div className="flex gap-1">
            {colorOptions.map((color) => (
              <Button
                key={color.name}
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0 rounded-full border"
                style={{
                  backgroundColor: `hsl(${adaptColorForTheme(color.hsl, theme)})`,
                }}
                onClick={() => handleAddHighlight(color.hsl)}
                title={`Highlight with ${color.name}`}
              />
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelection(null);
                setColorPopoverOpen(false);
                window.getSelection()?.removeAllRanges();
              }}
              className="ml-2"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}