export interface BibleVerse {
  id: string;
  /**
   * Optional numerical index used by virtualized tables
   */
  index?: number;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  text: Record<string, string>; // translation -> text
  crossReferences?: CrossReference[];
  strongsWords?: StrongsWord[];
  prophecy?: ProphecyData;
  labels?: string[];
  contextGroup?: string;
  height?: number; // For stable virtual scrolling
}

export interface CrossReference {
  reference: string;
  text: string;
}

export interface StrongsWord {
  original: string;
  strongs: string;
  transliteration: string;
  definition: string;
  instances: string[];
}

export interface ProphecyData {
  predictions?: string[];
  fulfillments?: string[];
  verifications?: string[];
  summary?: string;
  number?: number;
}

export interface Translation {
  id: string;
  name: string;
  abbreviation: string;
  selected: boolean;
}

export interface UserNote {
  id: number;
  userId: string;
  verseRef: string;
  note: string;
  updatedAt: Date;
}

export interface Bookmark {
  id: number;
  userId: string;
  name: string;
  indexValue: number;
  color: string;
  createdAt: Date;
}

export interface Highlight {
  id: number;
  userId: string;
  verseRef: string;
  startIdx: number;
  endIdx: number;
  color: string;
  createdAt: Date;
}

export interface BibleTheme {
  id: string;
  name: string;
  className: string;
}

export interface AppPreferences {
  theme: string;
  selectedTranslations: string[];
  showNotes: boolean;
  showProphecy: boolean;
  showContext: boolean;
  fontSize: 'small' | 'medium' | 'large';
  lastVersePosition?: string;
  columnLayout?: string;
  layoutLocked: boolean;
}

export interface SearchHistory {
  query: string;
  timestamp: Date;
  resultCount: number;
}

export interface ForumPost {
  id: number;
  userId: string;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ForumVote {
  id: number;
  userId: string;
  postId: number;
  value: number; // 1 for upvote, -1 for downvote
}
