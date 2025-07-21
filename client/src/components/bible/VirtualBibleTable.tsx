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

// Add a simple component to show when store is not ready
function StoreNotReady() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <div className="text-lg mb-2">Initializing Bible application...</div>
        <div className="text-sm">Loading store and translations</div>
      </div>
    </div>
  );
}

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

  // Store state with proper fallbacks
  const store = useBibleStore();
  const translationMaps = useTranslationMaps();
  
  // Ensure we have valid translation data
  const main = translationMaps?.main || 'KJV';
  const alternates = translationMaps?.alternates || [];
  
  // Return early if store isn't ready
  if (!store || !translationMaps) {
    return <StoreNotReady />;
  }

  // Bible data using new BibleDataAPI architecture
  const { verses, isLoading, error } = useBibleData();

  // Virtualization state with proper defaults
  const [containerHeight, setContainerHeight] = useState(800);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate viewport - ensure we show enough verses
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 10);
  const viewportRows = Math.ceil(containerHeight / ROW_HEIGHT);
  const bufferRows = 50; // Increased buffer for better performance
  const endIndex = Math.min(startIndex + viewportRows + bufferRows * 2, verses.length);
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

  // Restore proper verse text loading
  const getVerseTextSync = useCallback(async (verseReference: string, translationCode: string): Promise<string> => {
    try {
      // First check if we have it in the verse object
      const verse = verses.find(v => v.reference === verseReference);
      if (verse?.text?.[translationCode]) {
        return verse.text[translationCode];
      }

      // Load from BibleDataAPI
      const { loadTranslation } = await import('@/data/BibleDataAPI');
      const translationMap = await loadTranslation(translationCode);
      
      if (translationMap.has(verseReference)) {
        return translationMap.get(verseReference) || '';
      }
      
      return `[${translationCode} text for ${verseReference}]`;
    } catch (error) {
      console.warn(`Failed to load ${translationCode} for ${verseReference}:`, error);
      return '';
    }
  }, [verses]);

  // Sync version for immediate rendering
  const getVerseTextSyncImmediate = useCallback((verseReference: string, translationCode: string): string => {
    const verse = verses.find(v => v.reference === verseReference);
    if (verse?.text?.[translationCode]) {
      return verse.text[translationCode];
    }
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

  // Simple validation for debugging
  if (verses.length === 0) {
    console.log('VirtualBibleTable: No verses loaded yet');
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
            {visibleVerses.map((verse, index) => {
              // Ensure verse has valid data
              if (!verse?.id || !verse?.reference) {
                return (
                  <div key={`error-${startIndex + index}`} className="h-12 p-2 bg-yellow-100 text-yellow-800 text-xs">
                    Loading verse...
                  </div>
                );
              }
              
              return (
                <VirtualRow
                  key={verse.id}
                  verseID={verse.id}
                  rowHeight={ROW_HEIGHT}
                  verse={verse}
                  columnData={{}}
                  getVerseText={getVerseTextSyncImmediate}
                  getMainVerseText={getMainVerseText}
                  activeTranslations={[main, ...alternates]}
                  mainTranslation={main}
                  onVerseClick={onVerseClick}
                  onExpandVerse={onExpandVerse}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualBibleTable;