import { db } from './offlineDB';
import { supabase } from '@/lib/supabaseClient';

export async function queueSync() {
  if (typeof window !== 'undefined' && 'serviceWorker' in window.navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    const reg = await window.navigator.serviceWorker.ready;
    await reg.sync.register('anointed-sync');
  } else {
    // Fallback: call immediately if online or setInterval(pushPending, 30_000) when offline-to-online event fires for non-SyncManager browsers
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      pushPending();
      // Add interval for browsers without BG-Sync API
      setInterval(pushPending, 30000);
    }
  }
}

export async function pushPending() {
  // MOBILE OPTIMIZATION: Process in smaller batches to prevent memory spikes
  const isMobile = window.innerWidth <= 768;
  const batchSize = isMobile ? 5 : 10;
  
  const pendingNotes = await db.notes.where('pending').equals(true).limit(batchSize).toArray();
  
  for (const note of pendingNotes) {
    try {
      // Include updated_at on HTTP 409, re-fetch that row and merge or keep server version
      const { error } = await supabase.from('notes').upsert({ 
        ...note, 
        pending: undefined,
        updated_at: new Date(note.updated_at).toISOString()
      });
      if (!error) await db.notes.update(note.id!, { pending: false });
    } catch (error) {
      console.log('Sync failed for note:', note.id, error);
    }
  }

  // Repeat for bookmarks/highlights - BATCH PROCESSING
  const pendingBookmarks = await db.bookmarks.where('pending').equals(true).limit(batchSize).toArray();
  for (const bookmark of pendingBookmarks) {
    try {
      const { error } = await supabase.from('bookmarks').upsert({ ...bookmark, pending: undefined });
      if (!error) await db.bookmarks.update(bookmark.id!, { pending: false });
    } catch (error) {
      console.log('Sync failed for bookmark:', bookmark.id, error);
    }
  }
  
  const pendingHighlights = await db.highlights.where('pending').equals(true).limit(batchSize).toArray();
  for (const highlight of pendingHighlights) {
    try {
      const { error } = await supabase.from('highlights').upsert({ ...highlight, pending: undefined });
      if (!error) await db.highlights.update(highlight.id!, { pending: false });
    } catch (error) {
      console.log('Sync failed for highlight:', highlight.id, error);
    }
  }
  
  // MOBILE CLEANUP: Clear memory after sync operations
  if (isMobile && 'gc' in window) {
    (window as any).gc();
  }
}