import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Palette, X } from 'lucide-react';
import { useCreateHighlight, useDeleteHighlight, useDeleteAllHighlights, useUserHighlights } from '@/hooks/useUserData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Highlight } from '@shared/schema';
import { useWindowSize } from 'react-use';

interface HighlightableTextProps {
  text: string;
  verseRef: string;
  translation?: string;
  className?: string;
}

interface HighlightColor {
  name: string;
  light: string;
  dark: string;
  isInvisible?: boolean;
}

// Color palette for highlights - adaptive colors for light/dark themes
const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: 'Yellow', light: '#fef3c7', dark: '#451a03' },
  { name: 'Blue', light: '#dbeafe', dark: '#1e3a8a' },
  { name: 'Green', light: '#d1fae5', dark: '#064e3b' },
  { name: 'Pink', light: '#fce7f3', dark: '#831843' },
  { name: 'Purple', light: '#e9d5ff', dark: '#581c87' },
  { name: 'Orange', light: '#fed7aa', dark: '#9a3412' },
  { name: 'Clear', light: 'transparent', dark: 'transparent', isInvisible: true },
];

interface Selection {
  startIdx: number;
  endIdx: number;
  selectedText: string;
}

export function HighlightableText({ text, verseRef, translation = 'KJV', className }: HighlightableTextProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const { data: highlights = [] } = useUserHighlights();
  const createHighlight = useCreateHighlight();
  const deleteHighlight = useDeleteHighlight();
  const deleteAllHighlights = useDeleteAllHighlights();
  const { toast } = useToast();
  const { width } = useWindowSize();
  const isMobile = width <= 640;
  
  const [selection, setSelection] = useState<Selection | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Get highlights for this verse
  const verseHighlights = highlights.filter(h => h.verse_ref === verseRef);

  // Handle text selection - with mobile scroll prevention
  const handleMouseUp = (e: React.MouseEvent) => {
    console.log('🎨 HighlightableText: handleMouseUp called', { isLoggedIn, hasSelection: !window.getSelection()?.isCollapsed, isMobile });
    
    // On mobile, prevent text selection interference with scrolling
    if (isMobile) {
      // Don't trigger selection on mobile to avoid scroll interference
      console.log('🎨 Mobile device detected - skipping text selection to prevent scroll interference');
      return;
    }
    
    if (!isLoggedIn) {
      // Show toast for guests
      if (window.getSelection() && !window.getSelection()?.isCollapsed) {
        console.log('🎨 Guest user tried to highlight, showing toast');
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

    const selectionData = {
      startIdx,
      endIdx,
      selectedText: range.toString()
    };
    
    console.log('🎨 Setting selection and showing color picker:', selectionData);
    setSelection(selectionData);
    setShowColorPicker(true);
    
    // Prevent the selection from being cleared immediately
    e.preventDefault();
  };

  // Handle highlight creation
  const handleCreateHighlight = async (color: string) => {
    if (!selection) return;

    console.log('🎨 Creating highlight:', { verseRef, selection, color });
    
    try {
      await createHighlight.mutateAsync({
        verse_ref: verseRef,
        translation: translation,
        start_pos: selection.startIdx,
        end_pos: selection.endIdx,
        color_hsl: color
      });
      
      console.log('🎨 Highlight created successfully');
      toast({ title: "Text highlighted" });
      setShowColorPicker(false);
      setSelection(null);
      
      // Clear text selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('🎨 Failed to create highlight:', error);
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
      console.log('🎨 Removing individual highlight:', { 
        id: highlight.id, 
        verseRef, 
        translation,
        startPos: highlight.start_pos,
        endPos: highlight.end_pos 
      });
      
      await deleteHighlight.mutateAsync(highlight.id);
      console.log('🎨 Individual highlight deleted successfully');
      toast({ title: "Highlight removed" });
    } catch (error) {
      console.error('🎨 Failed to remove individual highlight:', error);
      toast({ 
        title: "Error", 
        description: "Failed to remove highlight", 
        variant: "destructive" 
      });
    }
  };

  // Handle clearing all highlights from a verse - now uses the new bulk delete API
  const handleClearAllHighlights = async () => {
    try {
      console.log('🎨 Clearing all highlights for verse:', { verseRef, translation });
      
      // Use the new bulk delete API which matches the SQL provided by the expert
      await deleteAllHighlights.mutateAsync({ verseRef, translation });
      
      toast({ title: "All highlights cleared from verse" });
      setShowColorPicker(false);
      setSelection(null);
      
      // Clear text selection
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      console.error('🎨 Failed to clear all highlights:', error);
      toast({ 
        title: "Error", 
        description: "Failed to clear highlights", 
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
    const sortedHighlights = [...verseHighlights].sort((a, b) => a.start_pos - b.start_pos);
    
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start_pos > lastIdx) {
        elements.push(text.slice(lastIdx, highlight.start_pos));
      }

      // Add highlighted text
      const highlightedText = text.slice(highlight.start_pos, highlight.end_pos);
      elements.push(
        <span
          key={`highlight-${highlight.id}`}
          className="rounded px-1 cursor-pointer transition-opacity hover:opacity-75"
          style={{ 
            backgroundColor: getColorForTheme(highlight.color_hsl, document.documentElement.classList.contains('dark'))
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Prevent multiple rapid clicks
            if (!deleteHighlight.isPending) {
              handleRemoveHighlight(highlight);
            }
          }}
          title="Click to remove highlight"
        >
          {highlightedText}
        </span>
      );

      lastIdx = highlight.end_pos;
    });

    // Add remaining text
    if (lastIdx < text.length) {
      elements.push(text.slice(lastIdx));
    }

    return elements;
  };

  // Get color based on theme
  const getColorForTheme = (colorValue: string, isDark: boolean) => {
    console.log('🎨 getColorForTheme called with:', { colorValue, isDark, availableColors: HIGHLIGHT_COLORS.map(c => c.name) });
    
    // If it's already an HSL/hex color value, return it directly
    if (colorValue.startsWith('#') || colorValue.startsWith('hsl') || colorValue.startsWith('rgb')) {
      console.log('🎨 getColorForTheme result: Using direct color value:', colorValue);
      return colorValue;
    }
    
    // Otherwise, try to match it as a color name
    const color = HIGHLIGHT_COLORS.find(c => c.name.toLowerCase() === colorValue.toLowerCase());
    const result = color ? (isDark ? color.dark : color.light) : (isDark ? '#374151' : '#f3f4f6');
    console.log('🎨 getColorForTheme result:', { foundColor: !!color, result });
    return result;
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
        className="select-text cursor-text fx-hand"
        style={{ 
          userSelect: (isLoggedIn && !isMobile) ? 'text' : 'none',
          touchAction: 'manipulation' // Prevent text selection on mobile
        }}
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
                      onClick={() => {
                        if (color.isInvisible) {
                          handleClearAllHighlights();
                        } else {
                          handleCreateHighlight(color.name.toLowerCase());
                        }
                      }}
                    >
                      <div 
                        className={`w-6 h-6 rounded-full border ${color.isInvisible ? 'border-2 border-dashed border-muted-foreground bg-background' : ''}`}
                        style={{ 
                          backgroundColor: color.isInvisible ? 'transparent' : getColorForTheme(color.name, document.documentElement.classList.contains('dark'))
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
                      className={`w-8 h-8 p-0 rounded-full border-2 border-transparent hover:border-foreground/20 hover:scale-110 transition-all ${color.isInvisible ? 'border-dashed border-muted-foreground' : ''}`}
                      style={{ 
                        backgroundColor: color.isInvisible ? 'transparent' : getColorForTheme(color.name, document.documentElement.classList.contains('dark'))
                      }}
                      onClick={() => {
                        if (color.isInvisible) {
                          handleClearAllHighlights();
                        } else {
                          handleCreateHighlight(color.name.toLowerCase());
                        }
                      }}
                      title={color.isInvisible ? "Clear all highlights from verse" : `Highlight with ${color.name}`}
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