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

// ============================================================================
// HIGHLIGHTS V2 INTERFACES (for Dexie persistence)
// ============================================================================

export interface HlRange {
  id: string; // Primary key
  verse_key: string;
  translation: string;
  start_offset: number;
  end_offset: number;
  color_hex: string;
  note?: string | null;
  opacity?: number | null;
  updated_at: string;
  // V2 metadata fields for instrumentation
  origin: 'server' | 'local';
  pending: boolean;
  tombstone: boolean;
  lastAckAt?: string; // ISO timestamp when server ACKed
}

export interface HlWash {
  id: string; // Primary key
  verse_key: string;
  color_hex: string;
  opacity?: number | null;
  note?: string | null;
  updated_at: string;
  // V2 metadata fields for instrumentation
  origin: 'server' | 'local';
  pending: boolean;
  tombstone: boolean;
  lastAckAt?: string; // ISO timestamp when server ACKed
}

export interface HlMeta {
  key: string; // Primary key (e.g., 'global', 'user_123')
  last_synced_at: string | null;
  schema_version: number;
  user_id: string | null;
}

export interface HlOutbox {
  id: string; // Primary key
  type: 'add_range' | 'trim' | 'erase' | 'wash_upsert' | 'delete_ranges' | 'delete_all';
  payload: any; // JSON data specific to mutation type
  created_at: string;
  attempts: number;
  status: 'pending' | 'sending' | 'failed' | 'completed';
  error?: string | null;
}

class AnointedDB extends Dexie {
  // Legacy tables
  notes!: Table<Note, number>;
  bookmarks!: Table<Bookmark, number>;
  highlights!: Table<Highlight, number>;
  
  // Highlights V2 tables
  hl_ranges!: Table<HlRange, string>;
  hl_wash!: Table<HlWash, string>;
  hl_meta!: Table<HlMeta, string>;
  hl_outbox!: Table<HlOutbox, string>;

  constructor() {
    super('anointedOffline');
    
    // Legacy schema (version 1)
    this.version(1).stores({
      notes: '++id, verse_id, updated_at, pending',
      bookmarks: '++id, verse_id, updated_at, pending', 
      highlights: '++id, verse_id, updated_at, pending',
    });
    
    // Highlights V2 schema (version 2)
    this.version(2).stores({
      notes: '++id, verse_id, updated_at, pending',
      bookmarks: '++id, verse_id, updated_at, pending', 
      highlights: '++id, verse_id, updated_at, pending',
      // New highlights V2 tables
      hl_ranges: 'id, [translation+verse_key], verse_key, updated_at',
      hl_wash: 'id, verse_key, updated_at',
      hl_meta: 'key, last_synced_at',
      hl_outbox: 'id, status, created_at, type',
    });
  }
}

export const db = new AnointedDB();