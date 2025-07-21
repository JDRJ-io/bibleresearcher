import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from "react";
import { ROW_HEIGHT } from '@/constants/layout';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ColumnHeaders } from "./ColumnHeaders";
import { VirtualRow } from "./VirtualRow";
import { useBibleStore } from "@/App";
import { useTranslationMaps } from "@/store/translationSlice";
import { useBibleData } from "@/hooks/useBibleData";

import type {
  BibleVerse,
  Translation,
  UserNote,
  Highlight,
  AppPreferences,
} from "@/types/bible";

interface VirtualBibleTableProps {
  onVerseClick?: (verseRef: string) => void;
  onExpandVerse?: (verse: BibleVerse) => void;
}

export function VirtualBibleTable({ onVerseClick, onExpandVerse }: VirtualBibleTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Store state
  const store = useBibleStore();
  const { main, alternates } = useTranslationMaps();

  // Bible data using new BibleDataAPI architecture
  const { verses, isLoading, error } = useBibleData();

  // Virtualization state
  const [containerHeight, setContainerHeight] = useState(600);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate viewport
  const startIndex = Math.floor(scrollTop / ROW_HEIGHT);
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / ROW_HEIGHT) + 1, verses.length);
  const visibleVerses = verses.slice(startIndex, endIndex);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle resize
  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Simple verse text getter using BibleDataAPI
  const getVerseText = useCallback(async (verseReference: string, translationCode: string): Promise<string> => {
    try {
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      const translationMap = await loadTranslation(translationCode);

      // Try different reference formats
      const formats = [
        verseReference,
        verseReference.replace('.', ' '),
        verseReference.replace(/\s/g, '.'),
        verseReference.replace(/\./g, ' ')
      ];

      for (const format of formats) {
        if (translationMap.has(format)) {
          return translationMap.get(format) || '';
        }
      }

      return '';
    } catch (error) {
      console.warn(`Failed to load ${translationCode} for ${verseReference}:`, error);
      return '';
    }
  }, []);

  // Sync wrapper for backwards compatibility - return actual text from verse objects
  const getVerseTextSync = useCallback((verseReference: string, translationCode: string): string | undefined => {
    // Find verse in current verses array
    const verse = verses.find(v => v.reference === verseReference);
    if (verse?.text?.[translationCode]) {
      return verse.text[translationCode];
    }
    
    // Return placeholder text to show columns are working
    return `Loading ${translationCode}...`;
  }, [verses]);

  const getMainVerseText = useCallback((verseReference: string): string | undefined => {
    return getVerseTextSync(verseReference, main);
  }, [getVerseTextSync, main]);

  // Notes and highlights queries
  const { data: userNotes = [] } = useQuery<UserNote[]>({
    queryKey: ['notes', user?.id],
    queryFn: () => apiRequest('/api/notes'),
    enabled: !!user?.id,
  });

  const { data: userHighlights = [] } = useQuery<Highlight[]>({
    queryKey: ['highlights', user?.id],
    queryFn: () => apiRequest('/api/highlights'),
    enabled: !!user?.id,
  });

  const saveNoteMutation = useMutation({
    mutationFn: (note: Partial<UserNote>) => apiRequest('/api/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({ title: "Note saved successfully" });
    },
  });

  const saveHighlightMutation = useMutation({
    mutationFn: (highlight: Partial<Highlight>) => apiRequest('/api/highlights', {
      method: 'POST',
      body: JSON.stringify(highlight),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['highlights'] });
      toast({ title: "Highlight saved successfully" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading Bible...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ColumnHeaders />

      <div 
        ref={containerRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div 
          style={{ 
            height: verses.length * ROW_HEIGHT,
            position: 'relative'
          }}
        >
          <div 
            style={{
              transform: `translateY(${startIndex * ROW_HEIGHT}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleVerses.map((verse, index) => (
              <VirtualRow
                key={verse.id}
                verseID={verse.id}
                rowHeight={ROW_HEIGHT}
                verse={verse}
                columnData={{}}
                getVerseText={getVerseTextSync}
                getMainVerseText={getMainVerseText}
                activeTranslations={[main, ...alternates]}
                mainTranslation={main}
                onVerseClick={onVerseClick}
                onExpandVerse={onExpandVerse}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualBibleTable;