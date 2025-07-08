// Core Bible data types
export interface VerseData {
  id: string;
  index: number;
  book: string;
  chapter: number;
  verse: number;
  reference: string;
  text: Record<string, string>; // translation code -> text
  crossReferences: CrossRefEntry[];
  strongsWords: StrongsWord[];
  labels: LabelData[];
  contextGroup: string;
  prophecy?: {
    P: number[]; // Prediction IDs
    F: number[]; // Fulfillment IDs
    V: number[]; // Verification IDs
  };
}

export interface CrossRefEntry {
  refIndex: number;
  ref: string; // "John 3:16" format
  text?: string; // Main translation only
}

export interface StrongsWord {
  word: string;
  strongs: string;
  transliteration: string;
  definition: string;
}

export interface LabelData {
  type: 'who' | 'what' | 'when' | 'where' | 'command' | 'action' | 'why' | 'seed' | 'harvest' | 'prediction';
  text: string;
  start: number;
  end: number;
}

export interface ProphecyDetail {
  id: number;
  summary: string;
  prophecy: string[];
  fulfillment: string[];
  verification: string[];
}

// Translation management types
export interface TranslationMap {
  code: string;
  name: string;
  verses: Map<string, string>;
}

export interface BibleStore {
  verses: VerseData[];
  isLoading: boolean;
  error: string | null;
  currentAnchor: number;
  translations: TranslationMap[];
  actives: string[];
  setActives: (codes: string[]) => void;
  loadTranslation: (code: string) => Promise<void>;
  setCurrentAnchor: (index: number) => void;
}