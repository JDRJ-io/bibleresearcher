import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, highlightsApi, bookmarksApi, preferencesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  Note, 
  InsertNote, 
  Highlight, 
  InsertHighlight, 
  Bookmark, 
  InsertBookmark,
  UserPreferences,
  InsertUserPreferences
} from '@shared/schema';

// Notes hooks
export const useUserNotes = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  return useQuery({
    queryKey: ['user-notes'],
    queryFn: notesApi.getAll,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (noteData: Omit<InsertNote, 'user_id'>) => notesApi.create(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes'] });
    },
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...noteData }: { id: number } & Partial<Omit<InsertUserNote, 'userId'>>) => 
      notesApi.update(id, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes'] });
    },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notes'] });
    },
  });
};

// Highlights hooks
export const useUserHighlights = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  return useQuery({
    queryKey: ['user-highlights'],
    queryFn: highlightsApi.getAll,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateHighlight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (highlightData: Omit<InsertHighlight, 'user_id'>) => highlightsApi.create(highlightData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-highlights'] });
    },
  });
};

export const useDeleteHighlight = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => highlightsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-highlights'] });
      queryClient.invalidateQueries({ queryKey: ['highlights'] }); // Also refresh verse-specific highlights
    },
  });
};

export const useDeleteAllHighlights = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ verseRef, translation }: { verseRef: string; translation: string }) => 
      highlightsApi.deleteAllForVerse(verseRef, translation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-highlights'] });
      queryClient.invalidateQueries({ queryKey: ['highlights'] }); // Also refresh verse-specific highlights
    },
  });
};

// Bookmarks hooks
export const useUserBookmarks = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  return useQuery({
    queryKey: ['user-bookmarks'],
    queryFn: bookmarksApi.getAll,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreateBookmark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (bookmarkData: Omit<InsertBookmark, 'userId'>) => bookmarksApi.create(bookmarkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });
};

export const useUpdateBookmark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...bookmarkData }: { id: number } & Partial<Pick<Bookmark, 'name' | 'color'>>) => 
      bookmarksApi.update(id, bookmarkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });
};

export const useDeleteBookmark = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => bookmarksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-bookmarks'] });
    },
  });
};

// Preferences hooks
export const useUserPreferences = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: preferencesApi.get,
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (preferencesData: Omit<InsertUserPreferences, 'userId'>) => 
      preferencesApi.upsert(preferencesData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });
};