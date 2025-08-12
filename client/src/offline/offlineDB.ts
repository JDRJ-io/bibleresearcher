import Dexie, { Table } from 'dexie';

export interface PendingRow { 
  id?: number; 
  updated_at: number; 
  pending: boolean; 
}

export interface Note extends PendingRow { 
  verse_id: string; 
  content: string; 
}

export interface Bookmark extends PendingRow { 
  verse_id: string; 
  color: string; 
  name: string; 
}

export interface Highlight extends PendingRow { 
  verse_id: string; 
  start: number; 
  end: number; 
  color: string; 
}

class AnointedDB extends Dexie {
  notes!: Table<Note, number>;
  bookmarks!: Table<Bookmark, number>;
  highlights!: Table<Highlight, number>;

  constructor() {
    super('anointedOffline');
    this.version(1).stores({
      notes: '++id, verse_id, updated_at, pending',
      bookmarks: '++id, verse_id, updated_at, pending', 
      highlights: '++id, verse_id, updated_at, pending',
    });
    
    // MOBILE MEMORY OPTIMIZATION: Listen for memory events
    if (typeof window !== 'undefined') {
      window.addEventListener('mobile-memory-emergency', () => {
        this.emergencyCleanup();
      });
      window.addEventListener('mobile-memory-warning', () => {
        this.gentleCleanup();
      });
    }
  }
  
  private async emergencyCleanup() {
    try {
      // Clear transaction caches
      await this.close();
      console.log('🚨 IndexedDB Emergency cleanup: closed connections');
    } catch (error) {
      console.error('Emergency cleanup failed:', error);
    }
  }
  
  private async gentleCleanup() {
    try {
      // Close and reopen connection to clear internal caches
      await this.close();
      this.open();
      console.log('⚠️ IndexedDB Gentle cleanup: refreshed connection');
    } catch (error) {
      console.error('Gentle cleanup failed:', error);
    }
  }
}

export const db = new AnointedDB();

// Initialize version and stores
db.version(1).stores({
  notes: '++id, verse_id, updated_at, pending',
  bookmarks: '++id, verse_id, updated_at, pending',
  highlights: '++id, verse_id, updated_at, pending',
});