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
  }
}

export const db = new AnointedDB('anointedOffline');

// Initialize version and stores
db.version(1).stores({
  notes: '++id, verse_id, updated_at, pending',
  bookmarks: '++id, verse_id, updated_at, pending',
  highlights: '++id, verse_id, updated_at, pending',
});