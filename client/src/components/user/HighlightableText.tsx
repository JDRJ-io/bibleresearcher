import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { useCreateHighlight, useDeleteHighlight, useUserHighlights } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Highlight } from '@shared/schema';

interface HighlightableTextProps {
  text: string;
  verseRef: string;
  className?: string;
}

// Color palette for highlights - adaptive colors for light/dark themes
const HIGHLIGHT_COLORS = [
  { name: 'Yellow', light: '#fef3c7', dark: '#451a03' },
  { name: 'Blue', light: '#dbeafe', dark: '#1e3a8a' },
  { name: 'Green', light: '#d1fae5', dark: '#064e3b' },
  { name: 'Pink', light: '#fce7f3', dark: '#831843' },
  { name: 'Purple', light: '#e9d5ff', dark: '#581c87' },
  { name: 'Orange', light: '#fed7aa', dark: '#9a3412' },
];

interface Selection {
  startIdx: number;
  endIdx: number;
  selectedText: string;
}

export function HighlightableText({ text, verseRef, className }: HighlightableTextProps) {
  const { isLoggedIn } = useAuth();
  const { data: highlights = [] } = useUserHighlights();
  const createHighlight = useCreateHighlight();
  const deleteHighlight = useDeleteHighlight();
  const { toast } = useToast();
  
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Get highlights for this verse
  const verseHighlights = highlights.filter(h => h.verseRef === verseRef);

  // Handle text selection
  const handleMouseUp = () => {
    if (!isLoggedIn) return;
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setShowColorPicker(false);
      setSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const containerElement = textRef.current;
    
    if (!containerElement || !containerElement.contains(range.commonAncestorContainer)) {
      return;
    }

    // Get text content and calculate indices
    const textContent = containerElement.textContent || '';
    const beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(containerElement);
    beforeRange.setEnd(range.startContainer, range.startOffset);
    const startIdx = beforeRange.toString().length;
    const endIdx = startIdx + range.toString().length;

    if (startIdx === endIdx) return;

    setSelection({
      startIdx,
      endIdx,
      selectedText: range.toString()
    });
    setShowColorPicker(true);
  };

  // Handle highlight creation
  const handleCreateHighlight = async (color: string) => {
    if (!selection) return;

    try {
      await createHighlight.mutateAsync({
        verseRef,
        startIdx: selection.startIdx,
        endIdx: selection.endIdx,
        color
      });
      
      toast({ title: "Text highlighted" });
      setShowColorPicker(false);
      setSelection(null);
      
      // Clear text selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to create highlight", 
        variant: "destructive" 
      });
    }
  };

  // Handle highlight removal
  const handleRemoveHighlight = async (highlight: Highlight) => {
    try {
      await deleteHighlight.mutateAsync(highlight.id);
      toast({ title: "Highlight removed" });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to remove highlight", 
        variant: "destructive" 
      });
    }
  };

  // Render text with highlights
  const renderHighlightedText = () => {
    if (!verseHighlights.length) {
      return text;
    }

    // Sort highlights by start position
    const sortedHighlights = [...verseHighlights].sort((a, b) => a.startIdx - b.startIdx);
    
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.startIdx > lastIdx) {
        elements.push(text.slice(lastIdx, highlight.startIdx));
      }

      // Add highlighted text
      const highlightedText = text.slice(highlight.startIdx, highlight.endIdx);
      elements.push(
        <span
          key={`highlight-${highlight.id}`}
          className="rounded px-1 cursor-pointer transition-opacity hover:opacity-75"
          style={{ 
            backgroundColor: `var(--theme-mode) === 'dark' ? ${getColorForTheme(highlight.color, true)} : ${getColorForTheme(highlight.color, false)}`
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveHighlight(highlight);
          }}
          title="Click to remove highlight"
        >
          {highlightedText}
        </span>
      );

      lastIdx = highlight.endIdx;
    });

    // Add remaining text
    if (lastIdx < text.length) {
      elements.push(text.slice(lastIdx));
    }

    return elements;
  };

  // Get color based on theme
  const getColorForTheme = (colorName: string, isDark: boolean) => {
    const color = HIGHLIGHT_COLORS.find(c => c.name.toLowerCase() === colorName.toLowerCase());
    return color ? (isDark ? color.dark : color.light) : (isDark ? '#374151' : '#f3f4f6');
  };

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
        setSelection(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={textRef}
        onMouseUp={handleMouseUp}
        className="select-text cursor-text"
        style={{ userSelect: isLoggedIn ? 'text' : 'none' }}
      >
        {renderHighlightedText()}
      </div>

      {showColorPicker && selection && (
        <div
          ref={colorPickerRef}
          className="absolute z-50 bg-background border rounded-lg shadow-lg p-2 mt-1"
          style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex gap-1 items-center">
            <Palette className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mr-2">Choose color:</span>
            {HIGHLIGHT_COLORS.map((color) => (
              <Button
                key={color.name}
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 rounded"
                style={{ 
                  backgroundColor: getColorForTheme(color.name, false),
                  minWidth: '24px'
                }}
                onClick={() => handleCreateHighlight(color.name.toLowerCase())}
                title={`Highlight with ${color.name}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}