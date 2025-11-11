import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { NewColumnHeaders } from "./NewColumnHeaders";
import { VerseRow } from "./VerseRow";
import { loadContextBoundaries } from "@/lib/contextGroups";
import type {
  BibleVerse,
  Translation,
  UserNote,
  Highlight,
} from "@/types/bible";

interface BibleTableProps {
  verses: BibleVerse[];
  selectedTranslations: Translation[];
  preferences: {
    showNotes: boolean;
    showProphecy: boolean;
    showContext: boolean;
  };
  mainTranslation?: string;
  onExpandVerse: (verse: BibleVerse) => void;
  onNavigateToVerse: (reference: string) => void;
}

export function BibleTable({
  verses,
  selectedTranslations,
  preferences,
  onExpandVerse,
  onNavigateToVerse,
}: BibleTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scrollLeft, setScrollLeft] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const [previousVerses, setPreviousVerses] = useState<BibleVerse[]>([]);
  const [contextBoundaries, setContextBoundaries] = useState<Set<string>>(new Set());

  // Keep track of verses to prevent blank screens during navigation
  useEffect(() => {
    if (verses.length > 0) {
      setPreviousVerses(verses);
    }
  }, [verses]);

  // Load context boundaries when showContext is enabled
  useEffect(() => {
    if (preferences.showContext) {
      loadContextBoundaries().then((boundaries) => {
        setContextBoundaries(boundaries);
      });
    } else {
      setContextBoundaries(new Set());
    }
  }, [preferences.showContext]);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (tableRef.current) {
          const newScrollLeft = tableRef.current.scrollLeft;
          setScrollLeft(newScrollLeft);
        }
      });
    };

    const tableElement = tableRef.current;
    if (tableElement) {
      tableElement.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        tableElement.removeEventListener("scroll", handleScroll);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, []);

  const { data: userNotes = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/notes`],
    enabled: !!user?.id,
  }) as { data: UserNote[] };

  const { data: userHighlights = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/highlights`],
    enabled: !!user?.id,
  }) as { data: Highlight[] };

  const createHighlightMutation = useMutation({
    mutationFn: async (highlightData: {
      userId: string;
      verseRef: string;
      startIdx: number;
      endIdx: number;
      color: string;
    }) => {
      return apiRequest("POST", "/api/highlights", highlightData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${user?.id}/highlights`],
      });
      toast({ title: "Text highlighted successfully" });
    },
  });

  const handleHighlight = (verseRef: string, selection: Selection) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to highlight text",
        variant: "destructive",
      });
      return;
    }

    const range = selection.getRangeAt(0);
    const highlightData = {
      userId: user.id,
      verseRef,
      startIdx: range.startOffset,
      endIdx: range.endOffset,
      color: "#ffeb3b", // Default yellow highlight
    };

    createHighlightMutation.mutate(highlightData);
  };

  const getUserNoteForVerse = (verseRef: string): UserNote | undefined => {
    if (!userNotes || !Array.isArray(userNotes)) return undefined;
    return (userNotes as UserNote[]).find(
      (note: UserNote) => note.verseRef === verseRef,
    );
  };

  const getHighlightsForVerse = (verseRef: string): Highlight[] => {
    if (!userHighlights || !Array.isArray(userHighlights)) return [];
    return (userHighlights as Highlight[]).filter(
      (highlight: Highlight) => highlight.verseRef === verseRef,
    );
  };

  // Scroll handling moved to useEffect with requestAnimationFrame for better performance

  // Use current verses if available, otherwise use previous verses to prevent blank screens
  const versesToRender = verses.length > 0 ? verses : previousVerses;

  console.log("BibleTable render:", {
    versesCount: verses.length,
    previousVersesCount: previousVerses.length,
    renderingCount: versesToRender.length,
    selectedTranslations: selectedTranslations.length,
    firstVerse: versesToRender[0],
    firstVerseText: versesToRender[0]?.text?.KJV,
  });

  // Only show loading state if we have no verses at all (initial load)
  if (versesToRender.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-lg mb-2">Loading Bible verses...</div>
          <div className="text-sm">Your Supabase data is being processed</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <NewColumnHeaders
        selectedTranslations={selectedTranslations}
        showNotes={preferences.showNotes}
        showProphecy={preferences.showProphecy}
        scrollLeft={scrollLeft}
        preferences={preferences}
      />

      <div
        className="flex-1 overflow-auto"
        style={{ height: "calc(100vh - 160px)", marginTop: "48px" }}
        ref={tableRef}
      >
        <div className="min-w-max">
          {versesToRender.map((verse, index) => (
            <VerseRow
              key={verse.id}
              verse={verse}
              verseIndex={index}
              selectedTranslations={selectedTranslations}
              showNotes={preferences.showNotes}
              showProphecy={preferences.showProphecy}
              showContext={preferences.showContext}
              contextBoundaries={contextBoundaries}
              userNote={getUserNoteForVerse(verse.reference)}
              highlights={getHighlightsForVerse(verse.reference)}
              onExpandVerse={onExpandVerse}
              onHighlight={handleHighlight}
              onNavigateToVerse={onNavigateToVerse}
              allVerses={previousVerses}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
