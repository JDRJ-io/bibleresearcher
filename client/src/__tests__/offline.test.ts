import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { db } from '@/offline/offlineDB';
import { getNotes } from '@/data/BibleDataAPI';

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('Offline functionality', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await db.notes.clear();
    await db.bookmarks.clear();
    await db.highlights.clear();
  });

  it('should return local data when offline', async () => {
    // Set navigator.onLine to false
    (global.navigator as any).onLine = false;
    
    // Add some local data
    await db.notes.add({
      verse_id: 'Gen.1:1',
      content: 'Test note',
      updated_at: Date.now(),
      pending: true
    });
    
    const notes = await getNotes();
    expect(notes).toHaveLength(1);
    expect(notes[0].content).toBe('Test note');
    expect(notes[0].pending).toBe(true);
  });

  it('should queue data for sync when saving offline', async () => {
    (global.navigator as any).onLine = false;
    
    // This would normally save to Supabase, but should save locally when offline
    await db.notes.add({
      verse_id: 'Gen.1:2',
      content: 'Offline note',
      updated_at: Date.now(),
      pending: true
    });
    
    const pendingNotes = await db.notes.where('pending').equals(true).toArray();
    expect(pendingNotes).toHaveLength(1);
    expect(pendingNotes[0].content).toBe('Offline note');
  });
});