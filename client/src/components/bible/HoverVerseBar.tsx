import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Book, Copy, Bookmark, Share2, Star, Trash2, Languages, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BibleVerse } from '@/types/bible';
import { upsertVerseHighlight, deleteAllForVerse, upsertBookmark } from '@/lib/userDataApi';
import { setWashOptimistic, deleteAllOptimistic, isHighlightsV2Enabled } from '@/stores/highlightsStore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToggleBookmark } from '@/hooks/useUserData';
import { useMutation } from '@tanstack/react-query';
import { BookmarkModal } from './BookmarkModal';
import { ProphecyTableOverlay } from './ProphecyTableOverlay';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// ---- PROGRAMMATIC OPEN (exported) ----
type OpenArgs = { verseKey: string; anchorEl: HTMLElement; verse: BibleVerse; translation?: string };
const _openersMap = new Map<string, (args: OpenArgs) => void>();
const _closersMap = new Map<string, () => void>();
const _dynamicOpeners = new Map<string, (args: OpenArgs) => void>(); // For dynamic verse references
let _currentOpenVerse: string | null = null; // Track which verse is currently open
let _lastCallTime = 0;
let _lastCalledVerse: string | null = null;
const THROTTLE_MS = 150; // Prevent excessive calls during mouse dragging

// Global function to close any currently open hover tab
export function closeAllHoverVerseBarInstances() {
  if (_currentOpenVerse) {
    const closer = _closersMap.get(_currentOpenVerse);
    if (closer) {
      closer();
    }
    _currentOpenVerse = null;
  }
}

export function openHoverVerseBarFromTap(args: OpenArgs) {
  // Throttle to prevent spam during mouse dragging
  const now = Date.now();
  if (_lastCalledVerse === args.verseKey && now - _lastCallTime < THROTTLE_MS) {
    return; // Skip this call - too soon after last call for same verse
  }
  _lastCallTime = now;
  _lastCalledVerse = args.verseKey;

  // First, close any currently open hover tab
  if (_currentOpenVerse && _currentOpenVerse !== args.verseKey) {
    closeAllHoverVerseBarInstances();
  }

  // Try to find a specific opener for this verse
  let opener = _openersMap.get(args.verseKey);
  
  // If no specific opener found, try to use a dynamic opener from the same row
  if (!opener) {
    const rowReference = args.verse.reference.includes('.') ? 
      args.verse.reference : args.verseKey;
    const rowBaseKey = rowReference.split('.').slice(0, 2).join('.'); // Get Book.Chapter
    
    // Find any dynamic opener from the same row
    _dynamicOpeners.forEach((dynamicOpener, key) => {
      if (!opener && key.startsWith(rowBaseKey)) {
        opener = dynamicOpener;
      }
    });
  }
  
  if (opener) {
    opener(args);
  }
  // Removed console.log spam - no need to log when opener isn't found
}

// Register a dynamic opener that can handle multiple verse references
export function registerDynamicOpener(rowVerseKey: string, opener: (args: OpenArgs) => void) {
  _dynamicOpeners.set(rowVerseKey, opener);
}

export function unregisterDynamicOpener(rowVerseKey: string) {
  _dynamicOpeners.delete(rowVerseKey);
}

interface HoverVerseBarProps {
  verse: BibleVerse;
  children: React.ReactNode;
  translation?: string;
  onBookmark?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  onHighlightVerse?: () => void;
  onDeleteHighlights?: () => void;
  onOpenStrongs?: () => void;
  onNavigateToVerse?: (reference: string) => void;
  onOpenProphecy?: (prophecyId: number) => void;
  wrapperClassName?: string;
  // New props for batch-loaded bookmark data
  isBookmarked?: boolean;
  bookmarksData?: any[];
}

export function HoverVerseBar({ 
  verse, 
  children, 
  translation = 'KJV',
  onBookmark, 
  onCopy, 
  onShare,
  onHighlightVerse,
  onDeleteHighlights,
  onOpenStrongs,
  onNavigateToVerse,
  onOpenProphecy,
  wrapperClassName = '',
  isBookmarked: propIsBookmarked,
  bookmarksData
}: HoverVerseBarProps) {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const anchorSpanRef = useRef<HTMLSpanElement | null>(null);
  const hoverContentRef = useRef<HTMLDivElement | null>(null);
  const [tapVerse, setTapVerse] = useState<BibleVerse | null>(null);
  const [tapTranslation, setTapTranslation] = useState<string>('KJV');
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  const [isProphecyOverlayOpen, setIsProphecyOverlayOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Use tap verse/translation when available, otherwise fall back to props
  const currentVerse = tapVerse || verse;
  const currentTranslation = tapTranslation || translation;

  // Bookmark functionality for the current verse context
  const toggleBookmark = useToggleBookmark();
  
  // Use passed-down bookmark data - fallback to false if not provided (no network requests)
  const isBookmarked = propIsBookmarked ?? false;

  // Bookmark creation mutation using contract-based API (like TopHeader)
  const createBookmarkMutation = useMutation({
    mutationFn: async (payload: { name: string; color: string }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const result = await upsertBookmark(
        user.id,
        currentVerse.reference,
        payload.name,
        currentTranslation,
        payload.color
      );

      return result;
    },
    onSuccess: (data, variables) => {
      toast({
        description: `Bookmark "${variables.name}" saved successfully`
      });
      
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['userBookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['userData', 'bookmarks'] });
      
      // Close hover bar after successful save
      closeHoverBar();
    },
    onError: (error: any) => {
      console.error('Bookmark creation failed:', error);
      toast({
        title: "Error",
        description: "Failed to save bookmark",
        variant: "destructive"
      });
    },
  });

  // Helper function to close the hover bar
  const closeHoverBar = () => {
    setOpen(false);
    if (_currentOpenVerse === verse.reference) {
      _currentOpenVerse = null;
    }
  };

  // Click/touch outside handler to close hover bar (enhanced for mobile)
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (hoverContentRef.current && !hoverContentRef.current.contains(event.target as Node)) {
        closeHoverBar();
      }
    };

    // Listen for both mouse and touch events to handle mobile properly
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open, verse.reference]);

  // Allow other components to open this programmatically
  useLayoutEffect(() => {
    const opener = ({ verseKey, anchorEl, verse: tapVerse, translation: tapTrans }: OpenArgs) => {
      // Toggle functionality: if this verse is already open, close it
      if (_currentOpenVerse === verseKey) {
        setOpen(false);
        _currentOpenVerse = null;
        return;
      }
      
      // Open this verse (updates context dynamically)
      setTapVerse(tapVerse);
      setTapTranslation(tapTrans || 'KJV');
      setOpen(true);
      _currentOpenVerse = verseKey;
    };

    const closer = () => {
      setOpen(false);
      _currentOpenVerse = null;
    };

    // Register this component instance for this specific verse
    _openersMap.set(verse.reference, opener);
    _closersMap.set(verse.reference, closer);
    
    // Also register as a dynamic opener for the row (handles cross-refs, prophecies)
    registerDynamicOpener(verse.reference, opener);
    
    return () => {
      _openersMap.delete(verse.reference);
      _closersMap.delete(verse.reference);
      unregisterDynamicOpener(verse.reference);
      if (_currentOpenVerse === verse.reference) {
        _currentOpenVerse = null;
      }
    };
  }, [verse.reference]);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      // Default copy behavior with translation
      const verseText = Object.values(currentVerse.text)[0];
      const text = `${currentVerse.reference} (${currentTranslation}) - ${verseText}`;
      navigator.clipboard.writeText(text);
    }
    closeHoverBar(); // Close after action
  };

  const handleBookmark = async () => {
    console.log('🔖 HoverVerseBar: handleBookmark called', { 
      currentVerse: currentVerse.reference, 
      currentTranslation,
      user: user?.id,
      onBookmark: !!onBookmark 
    });
    
    if (user) {
      console.log('🔖 HoverVerseBar: Opening bookmark modal');
      setIsBookmarkModalOpen(true);
      // Don't close hover bar here - let modal handle it
    } else {
      // User not signed in
      toast({ 
        description: "Please sign in to bookmark verses", 
        variant: "destructive" 
      });
      closeHoverBar();
    }
    
    // Note: Ignoring onBookmark prop since it's just a stub function that logs to console
  };

  const handleBookmarkSave = (name: string, color: string) => {
    console.log('🔖 HoverVerseBar: handleBookmarkSave called', { name, color, verse: currentVerse.reference });
    createBookmarkMutation.mutate({ name, color });
    // Note: closeHoverBar() is now called in onSuccess handler to avoid unmounting during mutation
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Default share behavior with translation
      const verseText = Object.values(currentVerse.text)[0];
      const text = `${currentVerse.reference} (${currentTranslation}) - ${verseText}`;
      if (navigator.share) {
        navigator.share({
          title: `${currentVerse.reference} (${currentTranslation})`,
          text: text,
        });
      } else {
        handleCopy();
        return; // handleCopy already closes the hover bar
      }
    }
    closeHoverBar(); // Close after action
  };

  const handleHighlightVerse = async () => {
    if (onHighlightVerse) {
      onHighlightVerse();
    } else if (user?.id) {
      try {
        if (isHighlightsV2Enabled()) {
          // V2: Use optimistic update with instant UI response
          setWashOptimistic(currentVerse.reference, '#FFD700', undefined, 0.3);
          toast({ description: "Verse highlighted across all translations" });
        } else {
          // V1: Legacy API call
          await upsertVerseHighlight(user.id, currentVerse.reference, '#FFD700', 0.3);
          
          // Invalidate cache
          queryClient.invalidateQueries({ queryKey: ['hl:verse', currentVerse.reference] });
          queryClient.invalidateQueries({ queryKey: ['hl:ranges', currentVerse.reference] });
          
          toast({ description: "Verse highlighted across all translations" });
        }
      } catch (error) {
        console.error('Failed to highlight verse:', error);
        toast({ description: "Failed to highlight verse", variant: "destructive" });
      }
    }
    closeHoverBar(); // Close after action
  };

  const handleDeleteHighlights = async () => {
    if (onDeleteHighlights) {
      onDeleteHighlights();
    } else if (user?.id) {
      try {
        if (isHighlightsV2Enabled()) {
          // V2: Use optimistic delete with instant UI response
          deleteAllOptimistic(currentVerse.reference);
          toast({ description: "All highlights removed from verse" });
        } else {
          // V1: Legacy API call
          const result = await deleteAllForVerse(user.id, currentVerse.reference);
          
          // Show success toast with deletion details
          const deletedCount = (result.deleted_ranges || 0) + (result.deleted_verse ? 1 : 0);
          if (deletedCount > 0) {
            const message = deletedCount === 1 
              ? "1 highlight removed from verse"
              : `${deletedCount} highlights removed from verse`;
            toast({ description: message });
          } else {
            toast({ description: "No highlights found to remove" });
          }
        }
      } catch (error) {
        console.error('Failed to delete highlights:', error);
        toast({ description: "Failed to delete highlights", variant: "destructive" });
      }
    }
    closeHoverBar(); // Close after action
  };

  const handleOpenStrongs = () => {
    if (onOpenStrongs) {
      onOpenStrongs();
    }
    closeHoverBar(); // Close after action
  };

  // Toolbar content component (shared between desktop and mobile)
  const ToolbarContent = () => (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <Book className="w-3 h-3" />
        {currentVerse.reference}
      </div>
      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleCopy}
          title="Copy verse"
        >
          <Copy className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleBookmark}
          title="Bookmark verse"
          data-testid="button-bookmark-verse"
        >
          <Bookmark className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={handleShare}
          title="Share verse"
        >
          <Share2 className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-purple-100 dark:hover:bg-purple-900"
          onClick={handleOpenStrongs}
          title="Open Strong's Concordance"
          data-testid="button-open-strongs"
        >
          <Languages className="w-3 h-3 text-purple-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
          onClick={() => {
            setIsProphecyOverlayOpen(true);
            closeHoverBar();
          }}
          title="Browse all prophecies"
          data-testid="button-browse-prophecies"
        >
          <ListOrdered className="w-3 h-3 text-blue-600" />
        </Button>
        {user && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900"
              onClick={handleHighlightVerse}
              title="Highlight whole verse (all translations)"
              data-testid="button-highlight-verse"
            >
              <Star className="w-3 h-3 text-yellow-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
              onClick={handleDeleteHighlights}
              title="Delete all highlights from verse"
              data-testid="button-delete-highlights"
            >
              <Trash2 className="w-3 h-3 text-red-600" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  // Handle close events to reset the tracking state
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && _currentOpenVerse === verse.reference) {
      _currentOpenVerse = null;
    }
  };

  // NOTE: We'll let Radix render the SAME HoverCardContent for both desktop hover and mobile tap
  // by controlling `open`. On desktop, Radix still handles hover; on tap we force `open=true`.
  return (
    <>
      <HoverCard open={open} onOpenChange={handleOpenChange} openDelay={80} closeDelay={120}>

        {/* Desktop hover: Radix will also toggle `open` via internal hover logic.
            We keep this Trigger lightweight (an always-present small, invisible area is OK). */}
        <HoverCardTrigger asChild>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`relative ${wrapperClassName}`}
          >
            {children}
          </div>
        </HoverCardTrigger>

        {/* This is the existing HoverCardContent (same data-radix-popper-content-wrapper) */}
        <HoverCardContent
          ref={hoverContentRef}
          className="glass-morphism w-auto p-2 bg-background border shadow-lg z-[100]"
          side="top"
          align="start"
          sideOffset={10}
          avoidCollisions={true}
          collisionPadding={12}
        >
          <ToolbarContent />
        </HoverCardContent>
      </HoverCard>
      
      <BookmarkModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        onSave={handleBookmarkSave}
        verseReference={currentVerse.reference}
        isLoading={createBookmarkMutation.isPending}
      />
      
      <ErrorBoundary componentName="ProphecyTableOverlay">
        <ProphecyTableOverlay
          isOpen={isProphecyOverlayOpen}
          onClose={() => setIsProphecyOverlayOpen(false)}
          onNavigateToVerse={onNavigateToVerse}
        />
      </ErrorBoundary>
    </>
  );
}