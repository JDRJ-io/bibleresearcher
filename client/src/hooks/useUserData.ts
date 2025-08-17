/**
 * React hooks for user-specific data (bookmarks, highlights, notes)
 * Uses the new RLS-secured API format
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userBookmarksApi, userHighlightsApi, userNotesApi } from '../lib/userDataApi';
import { Segment } from '@shared/highlights';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// ============= BOOKMARKS HOOKS =============

export function useUserBookmarks(visibleVerseKeys: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-bookmarks', visibleVerseKeys.join(',')],
    queryFn: () => userBookmarksApi.loadForVerses(visibleVerseKeys),
    enabled: !!user && visibleVerseKeys.length > 0,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ translation, verse_key }: { translation: string; verse_key: string }) =>
      userBookmarksApi.toggle(translation, verse_key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
      toast({
        title: "Bookmark updated",
        description: "Your bookmark has been saved",
      });
    },
    onError: (error: any) => {
      console.error('Bookmark toggle error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });
}

export function useIsBookmarked(translation: string, verse_key: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bookmark-check', translation, verse_key],
    queryFn: () => userBookmarksApi.isBookmarked(translation, verse_key),
    enabled: !!user && !!translation && !!verse_key,
  });
}

// ============= HIGHLIGHTS HOOKS =============

export function useUserHighlights(translation: string, visibleVerseKeys: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-highlights', translation, visibleVerseKeys.join(',')],
    queryFn: () => userHighlightsApi.loadForVerses(translation, visibleVerseKeys),
    enabled: !!user && !!translation && visibleVerseKeys.length > 0,
  });
}

export function useVerseHighlights(translation: string, verseKey: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['verse-highlights', translation, verseKey],
    queryFn: () => userHighlightsApi.getForVerse(translation, verseKey),
    enabled: !!user && !!translation && !!verseKey,
  });
}

export function useSaveHighlights() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      translation, 
      verseKey, 
      segments, 
      serverRev, 
      textLen 
    }: {
      translation: string;
      verseKey: string;
      segments: Segment[];
      serverRev?: number | null;
      textLen?: number | null;
    }) => userHighlightsApi.save(translation, verseKey, segments, serverRev, textLen),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-highlights'] });
      queryClient.invalidateQueries({ 
        queryKey: ['verse-highlights', variables.translation, variables.verseKey] 
      });
      
      toast({
        title: "Highlight saved",
        description: "Your text highlighting has been saved",
      });
    },
    onError: (error: any) => {
      console.error('Highlight save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save highlight",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteHighlights() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ translation, verseKey }: { translation: string; verseKey: string }) =>
      userHighlightsApi.deleteForVerse(translation, verseKey),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-highlights'] });
      queryClient.invalidateQueries({ 
        queryKey: ['verse-highlights', variables.translation, variables.verseKey] 
      });
      
      toast({
        title: "Highlights cleared",
        description: "All highlights for this verse have been removed",
      });
    },
    onError: (error: any) => {
      console.error('Highlight delete error:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to delete highlights",
        variant: "destructive",
      });
    },
  });
}

// ============= NOTES HOOKS =============

export function useUserNotes(visibleVerseRefs: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-notes', visibleVerseRefs.join(',')],
    queryFn: () => userNotesApi.loadForVerses(visibleVerseRefs),
    enabled: !!user && visibleVerseRefs.length > 0,
  });
}

export function useSaveNote() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ verseRef, text }: { verseRef: string; text: string }) =>
      userNotesApi.save(verseRef, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes'] });
      toast({
        title: "Note saved",
        description: "Your note has been saved",
      });
    },
    onError: (error: any) => {
      console.error('Note save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save note",
        variant: "destructive",
      });
    },
  });
}