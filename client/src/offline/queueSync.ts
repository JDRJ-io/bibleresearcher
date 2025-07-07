import { db } from './offlineDB';
import { supabase } from '@/lib/supabase';

export async function queueSync() {
  if (typeof window !== 'undefined' && 'serviceWorker' in window.navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const reg = await window.navigator.serviceWorker.ready;
    await reg.sync.register('anointed-sync');
  } else {
    // Fallback: call immediately if online
    if (typeof window !== 'undefined' && window.navigator.onLine) pushPending();
  }
}

export async function pushPending() {
  const pendingNotes = await db.notes.where('pending').equals(true).toArray();
  
  for (const note of pendingNotes) {
    try {
      const { error } = await supabase.from('notes').upsert({ ...note, pending: undefined });
      if (!error) await db.notes.update(note.id!, { pending: false });
    } catch (error) {
      console.log('Sync failed for note:', note.id, error);
    }
  }

  // Repeat for bookmarks/highlights
  const pendingBookmarks = await db.bookmarks.where('pending').equals(true).toArray();
  for (const bookmark of pendingBookmarks) {
    try {
      const { error } = await supabase.from('bookmarks').upsert({ ...bookmark, pending: undefined });
      if (!error) await db.bookmarks.update(bookmark.id!, { pending: false });
    } catch (error) {
      console.log('Sync failed for bookmark:', bookmark.id, error);
    }
  }
  
  const pendingHighlights = await db.highlights.where('pending').equals(true).toArray();
  for (const highlight of pendingHighlights) {
    try {
      const { error } = await supabase.from('highlights').upsert({ ...highlight, pending: undefined });
      if (!error) await db.highlights.update(highlight.id!, { pending: false });
    } catch (error) {
      console.log('Sync failed for highlight:', highlight.id, error);
    }
  }
}