import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, X } from 'lucide-react';
import { useCreateHighlight, useDeleteHighlight, useUserHighlights } from '@/hooks/useUserData';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Highlight } from '@shared/schema';
import { useWindowSize } from 'react-use';

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
  const { width } = useWindowSize();
  const isMobile = width < 640;
  
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Get highlights for this verse
  const verseHighlights = highlights.filter(h => h.verseRef === verseRef);

  // Handle text selection
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      // Show toast for guests
      if (window.getSelection() && !window.getSelection()?.isCollapsed) {
        toast({
          title: "Sign in required",
          description: "Please sign in to highlight text.",
          variant: "destructive",
        });
        window.getSelection()?.removeAllRanges();
      }
      return;
    }
    
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

    // Calculate position for color picker
    const rect = range.getBoundingClientRect();
    const containerRect = containerElement.getBoundingClientRect();
    
    setPickerPosition({
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.bottom - containerRect.top + 8
    });

    setSelection({
      startIdx,
      endIdx,
      selectedText: range.toString()
    });
    setShowColorPicker(true);
    
    // Prevent the selection from being cleared immediately
    e.preventDefault();
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
            backgroundColor: getColorForTheme(highlight.color, document.documentElement.classList.contains('dark'))
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
        <>
          {/* Mobile/Small screen: Full-width bottom sheet */}
          {isMobile ? (
            <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t shadow-lg rounded-t-2xl p-4 animate-slide-up">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Palette className="w-4 h-4" />
                    <span>Choose highlight color</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0"
                    onClick={() => {
                      setShowColorPicker(false);
                      setSelection(null);
                      window.getSelection()?.removeAllRanges();
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  "{selection.selectedText.length > 30 ? selection.selectedText.slice(0, 30) + '...' : selection.selectedText}"
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <Button
                      key={color.name}
                      size="sm"
                      variant="outline"
                      className="h-12 flex flex-col gap-1 p-2"
                      onClick={() => handleCreateHighlight(color.name.toLowerCase())}
                    >
                      <div 
                        className="w-6 h-6 rounded-full border"
                        style={{ 
                          backgroundColor: getColorForTheme(color.name, document.documentElement.classList.contains('dark'))
                        }}
                      />
                      <span className="text-xs">{color.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Desktop: Positioned popup */
            <div
              ref={colorPickerRef}
              className="absolute z-50 bg-background border rounded-lg shadow-xl p-3 backdrop-blur-sm"
              style={{
                left: pickerPosition.x,
                top: pickerPosition.y,
                transform: 'translateX(-50%)',
                minWidth: '240px'
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Palette className="w-3 h-3" />
                    <span>Highlight text</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-6 h-6 p-0"
                    onClick={() => {
                      setShowColorPicker(false);
                      setSelection(null);
                      window.getSelection()?.removeAllRanges();
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  "{selection.selectedText.length > 25 ? selection.selectedText.slice(0, 25) + '...' : selection.selectedText}"
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <Button
                      key={color.name}
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 rounded-full border-2 border-transparent hover:border-foreground/20 hover:scale-110 transition-all"
                      style={{ 
                        backgroundColor: getColorForTheme(color.name, document.documentElement.classList.contains('dark'))
                      }}
                      onClick={() => handleCreateHighlight(color.name.toLowerCase())}
                      title={`Highlight with ${color.name}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}