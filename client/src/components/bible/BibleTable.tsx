import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ColumnHeaders } from './ColumnHeaders';
import { VerseRow } from './VerseRow';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BibleVerse, Translation, UserNote, Highlight } from '@/types/bible';

interface BibleTableProps {
  verses: BibleVerse[];
  translations: Translation[];
  selectedTranslations: Translation[];
  preferences: {
    showNotes: boolean;
    showProphecy: boolean;
    showContext: boolean;
  };
  onExpandVerse: (verse: BibleVerse) => void;
  onNavigateToVerse: (reference: string) => void;
}

export function BibleTable({
  verses,
  translations,
  selectedTranslations,
  preferences,
  onExpandVerse,
  onNavigateToVerse,
}: BibleTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userNotes = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/notes`],
    enabled: !!user?.id,
  });

  const { data: userHighlights = [] } = useQuery({
    queryKey: [`/api/users/${user?.id}/highlights`],
    enabled: !!user?.id,
  });

  const createHighlightMutation = useMutation({
    mutationFn: async (highlightData: {
      userId: string;
      verseRef: string;
      startIdx: number;
      endIdx: number;
      color: string;
    }) => {
      return apiRequest('POST', '/api/highlights', highlightData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/highlights`] });
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
      color: '#ffeb3b', // Default yellow highlight
    };

    createHighlightMutation.mutate(highlightData);
  };

  const getUserNoteForVerse = (verseRef: string): UserNote | undefined => {
    return userNotes.find((note: UserNote) => note.verseRef === verseRef);
  };

  const getHighlightsForVerse = (verseRef: string): Highlight[] => {
    return userHighlights.filter((highlight: Highlight) => highlight.verseRef === verseRef);
  };

  console.log('BibleTable render:', { 
    versesCount: verses.length, 
    selectedTranslations: selectedTranslations.length,
    firstVerse: verses[0] 
  });

  if (verses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="text-lg mb-2">No verses loaded</div>
          <div className="text-sm">Check console for loading details</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <ColumnHeaders
        selectedTranslations={selectedTranslations}
        showNotes={preferences.showNotes}
        showProphecy={preferences.showProphecy}
      />
      
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {verses.slice(0, 100).map((verse) => (
            <VerseRow
              key={verse.id}
              verse={verse}
              selectedTranslations={selectedTranslations}
              showNotes={preferences.showNotes}
              showProphecy={preferences.showProphecy}
              showContext={preferences.showContext}
              userNote={getUserNoteForVerse(verse.reference)}
              highlights={getHighlightsForVerse(verse.reference)}
              onExpandVerse={onExpandVerse}
              onHighlight={handleHighlight}
              onNavigateToVerse={onNavigateToVerse}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
