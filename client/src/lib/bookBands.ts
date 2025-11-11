// bookBands.ts
// 66 books as single source of truth for all Bible navigation
// Derives testaments, sections, and lookups from this table

import type { Band } from './smartScrollbar';

// 66 books (book:Id, startIdx/endIdx/count) - VERIFIED from CSV data
export const BOOK_BANDS: readonly Band[] = [
  { id:'book:Gen',  label:'Genesis',        startIdx:    0, endIdx:  1532, count: 1533 },
  { id:'book:Exod', label:'Exodus',         startIdx: 1533, endIdx:  2745, count: 1213 },
  { id:'book:Lev',  label:'Leviticus',      startIdx: 2746, endIdx:  3604, count:  859 },
  { id:'book:Num',  label:'Numbers',        startIdx: 3605, endIdx:  4892, count: 1288 },
  { id:'book:Deut', label:'Deuteronomy',    startIdx: 4893, endIdx:  5851, count:  959 },
  { id:'book:Josh', label:'Joshua',         startIdx: 5852, endIdx:  6509, count:  658 },
  { id:'book:Judg', label:'Judges',         startIdx: 6510, endIdx:  7127, count:  618 },
  { id:'book:Ruth', label:'Ruth',           startIdx: 7128, endIdx:  7212, count:   85 },
  { id:'book:1Sam', label:'1 Samuel',       startIdx: 7213, endIdx:  8022, count:  810 },
  { id:'book:2Sam', label:'2 Samuel',       startIdx: 8023, endIdx:  8717, count:  695 },
  { id:'book:1Kgs', label:'1 Kings',        startIdx: 8718, endIdx:  9533, count:  816 },
  { id:'book:2Kgs', label:'2 Kings',        startIdx: 9534, endIdx: 10252, count:  719 },
  { id:'book:1Chr', label:'1 Chronicles',   startIdx:10253, endIdx: 11194, count:  942 },
  { id:'book:2Chr', label:'2 Chronicles',   startIdx:11195, endIdx: 12016, count:  822 },
  { id:'book:Ezra', label:'Ezra',           startIdx:12017, endIdx: 12296, count:  280 },
  { id:'book:Neh',  label:'Nehemiah',       startIdx:12297, endIdx: 12702, count:  406 },
  { id:'book:Esth', label:'Esther',         startIdx:12703, endIdx: 12869, count:  167 },
  { id:'book:Job',  label:'Job',            startIdx:12870, endIdx: 13939, count: 1070 },
  { id:'book:Ps',   label:'Psalms',         startIdx:13940, endIdx: 16400, count: 2461 },
  { id:'book:Prov', label:'Proverbs',       startIdx:16401, endIdx: 17315, count:  915 },
  { id:'book:Eccl', label:'Ecclesiastes',   startIdx:17316, endIdx: 17537, count:  222 },
  { id:'book:Song', label:'Song of Songs',  startIdx:17538, endIdx: 17654, count:  117 },
  { id:'book:Isa',  label:'Isaiah',         startIdx:17655, endIdx: 18946, count: 1292 },
  { id:'book:Jer',  label:'Jeremiah',       startIdx:18947, endIdx: 20310, count: 1364 },
  { id:'book:Lam',  label:'Lamentations',   startIdx:20311, endIdx: 20464, count:  154 },
  { id:'book:Ezek', label:'Ezekiel',        startIdx:20465, endIdx: 21737, count: 1273 },
  { id:'book:Dan',  label:'Daniel',         startIdx:21738, endIdx: 22094, count:  357 },
  { id:'book:Hos',  label:'Hosea',          startIdx:22095, endIdx: 22291, count:  197 },
  { id:'book:Joel', label:'Joel',           startIdx:22292, endIdx: 22364, count:   73 },
  { id:'book:Amos', label:'Amos',           startIdx:22365, endIdx: 22510, count:  146 },
  { id:'book:Obad', label:'Obadiah',        startIdx:22511, endIdx: 22531, count:   21 },
  { id:'book:Jonah',label:'Jonah',          startIdx:22532, endIdx: 22579, count:   48 },
  { id:'book:Mic',  label:'Micah',          startIdx:22580, endIdx: 22684, count:  105 },
  { id:'book:Nah',  label:'Nahum',          startIdx:22685, endIdx: 22731, count:   47 },
  { id:'book:Hab',  label:'Habakkuk',       startIdx:22732, endIdx: 22787, count:   56 },
  { id:'book:Zeph', label:'Zephaniah',      startIdx:22788, endIdx: 22840, count:   53 },
  { id:'book:Hag',  label:'Haggai',         startIdx:22841, endIdx: 22878, count:   38 },
  { id:'book:Zech', label:'Zechariah',      startIdx:22879, endIdx: 23089, count:  211 },
  { id:'book:Mal',  label:'Malachi',        startIdx:23090, endIdx: 23144, count:   55 },
  { id:'book:Matt', label:'Matthew',        startIdx:23145, endIdx: 24215, count: 1071 },
  { id:'book:Mark', label:'Mark',           startIdx:24216, endIdx: 24893, count:  678 },
  { id:'book:Luke', label:'Luke',           startIdx:24894, endIdx: 26044, count: 1151 },
  { id:'book:John', label:'John',           startIdx:26045, endIdx: 26923, count:  879 },
  { id:'book:Acts', label:'Acts',           startIdx:26924, endIdx: 27930, count: 1007 },
  { id:'book:Rom',  label:'Romans',         startIdx:27931, endIdx: 28363, count:  433 },
  { id:'book:1Cor', label:'1 Corinthians',  startIdx:28364, endIdx: 28800, count:  437 },
  { id:'book:2Cor', label:'2 Corinthians',  startIdx:28801, endIdx: 29057, count:  257 },
  { id:'book:Gal',  label:'Galatians',      startIdx:29058, endIdx: 29206, count:  149 },
  { id:'book:Eph',  label:'Ephesians',      startIdx:29207, endIdx: 29361, count:  155 },
  { id:'book:Phil', label:'Philippians',    startIdx:29362, endIdx: 29465, count:  104 },
  { id:'book:Col',  label:'Colossians',     startIdx:29466, endIdx: 29560, count:   95 },
  { id:'book:1Thess',label:'1 Thessalonians',startIdx:29561, endIdx: 29649, count:   89 },
  { id:'book:2Thess',label:'2 Thessalonians',startIdx:29650, endIdx: 29696, count:   47 },
  { id:'book:1Tim', label:'1 Timothy',      startIdx:29697, endIdx: 29809, count:  113 },
  { id:'book:2Tim', label:'2 Timothy',      startIdx:29810, endIdx: 29892, count:   83 },
  { id:'book:Titus',label:'Titus',          startIdx:29893, endIdx: 29938, count:   46 },
  { id:'book:Phlm', label:'Philemon',       startIdx:29939, endIdx: 29963, count:   25 },
  { id:'book:Heb',  label:'Hebrews',        startIdx:29964, endIdx: 30266, count:  303 },
  { id:'book:Jas',  label:'James',          startIdx:30267, endIdx: 30374, count:  108 },
  { id:'book:1Pet', label:'1 Peter',        startIdx:30375, endIdx: 30479, count:  105 },
  { id:'book:2Pet', label:'2 Peter',        startIdx:30480, endIdx: 30540, count:   61 },
  { id:'book:Jude', label:'Jude',           startIdx:30541, endIdx: 30565, count:   25 },
  { id:'book:1John',label:'1 John',         startIdx:30566, endIdx: 30670, count:  105 },
  { id:'book:2John',label:'2 John',         startIdx:30671, endIdx: 30683, count:   13 },
  { id:'book:3John',label:'3 John',         startIdx:30684, endIdx: 30697, count:   14 },
  { id:'book:Rev',  label:'Revelation',     startIdx:30698, endIdx: 31101, count:  404 },
] as const;

export const TOTAL_VERSES = 31102 as const;
export const TESTAMENT_SPLIT = 23145; // Mal → Matt boundary

// Quick lookups
export function getBookForIndex(idx: number): Band {
  return BOOK_BANDS.find(b => idx >= b.startIdx && idx <= b.endIdx)!;
}

export function getBookById(id: string): Band {
  return BOOK_BANDS.find(b => b.id === id)!;
}

// Build OT / NT bands from books (auto-stays correct)
export function buildTestamentBandsFromBooks() {
  const otStart = BOOK_BANDS[0].startIdx;
  const otEnd   = BOOK_BANDS.find(b => b.id === "book:Mal")!.endIdx; // 23144
  const ntStart = BOOK_BANDS.find(b => b.id === "book:Matt")!.startIdx; // 23145
  const ntEnd   = BOOK_BANDS[BOOK_BANDS.length - 1].endIdx; // 31101

  return [
    { id: 'test:OT', label: 'Old Testament', startIdx: otStart, endIdx: otEnd, count: otEnd - otStart + 1 },
    { id: 'test:NT', label: 'New Testament', startIdx: ntStart, endIdx: ntEnd, count: ntEnd - ntStart + 1 },
  ] as const;
}

// Build section bands from book groupings
export function buildSectionBandsFromBooks() {
  const sec = (ids: string[], id: string, label: string) => {
    const bs = ids.map(getBookById);
    const startIdx = bs[0].startIdx;
    const endIdx   = bs[bs.length - 1].endIdx;
    return { id, label, startIdx, endIdx, count: endIdx - startIdx + 1 };
  };

  const OT = [
    sec(['book:Gen','book:Exod','book:Lev','book:Num','book:Deut'], 'sec:pentateuch', 'Pentateuch'),
    sec(['book:Josh','book:Judg','book:Ruth','book:1Sam','book:2Sam','book:1Kgs','book:2Kgs','book:1Chr','book:2Chr','book:Ezra','book:Neh','book:Esth'], 'sec:history', 'History'),
    sec(['book:Job','book:Ps','book:Prov','book:Eccl','book:Song'], 'sec:wisdom', 'Wisdom & Poetry'),
    sec(['book:Isa','book:Jer','book:Lam','book:Ezek','book:Dan'], 'sec:major_prophets', 'Major Prophets'),
    sec(['book:Hos','book:Joel','book:Amos','book:Obad','book:Jonah','book:Mic','book:Nah','book:Hab','book:Zeph','book:Hag','book:Zech','book:Mal'], 'sec:minor_prophets', 'Minor Prophets'),
  ];

  const NT = [
    sec(['book:Matt','book:Mark','book:Luke','book:John'], 'sec:gospels', 'Gospels'),
    sec(['book:Acts'], 'sec:acts', 'Acts'),
    sec(['book:Rom','book:1Cor','book:2Cor','book:Gal','book:Eph','book:Phil','book:Col','book:1Thess','book:2Thess','book:1Tim','book:2Tim','book:Titus','book:Phlm'], 'sec:pauline', 'Pauline Epistles'),
    sec(['book:Heb','book:Jas','book:1Pet','book:2Pet','book:Jude','book:1John','book:2John','book:3John'], 'sec:general', 'General Epistles'),
    sec(['book:Rev'], 'sec:revelation', 'Revelation'),
  ];

  return { OT, NT } as const;
}

// Book tick indices (for rendering on scrollbar)
export function bookTickIndices(): number[] {
  return BOOK_BANDS.map(b => b.startIdx);
}

// Section type and lookup tables
export type SectionId = 
  | 'sec:pentateuch' 
  | 'sec:history' 
  | 'sec:wisdom' 
  | 'sec:major_prophets' 
  | 'sec:minor_prophets'
  | 'sec:gospels' 
  | 'sec:acts' 
  | 'sec:pauline' 
  | 'sec:general' 
  | 'sec:revelation';

export type TestamentId = 'OT' | 'NT';

// Map sections to their book IDs
const SECTION_TO_BOOKS: Record<SectionId, string[]> = {
  'sec:pentateuch': ['book:Gen', 'book:Exod', 'book:Lev', 'book:Num', 'book:Deut'],
  'sec:history': ['book:Josh', 'book:Judg', 'book:Ruth', 'book:1Sam', 'book:2Sam', 'book:1Kgs', 'book:2Kgs', 'book:1Chr', 'book:2Chr', 'book:Ezra', 'book:Neh', 'book:Esth'],
  'sec:wisdom': ['book:Job', 'book:Ps', 'book:Prov', 'book:Eccl', 'book:Song'],
  'sec:major_prophets': ['book:Isa', 'book:Jer', 'book:Lam', 'book:Ezek', 'book:Dan'],
  'sec:minor_prophets': ['book:Hos', 'book:Joel', 'book:Amos', 'book:Obad', 'book:Jonah', 'book:Mic', 'book:Nah', 'book:Hab', 'book:Zeph', 'book:Hag', 'book:Zech', 'book:Mal'],
  'sec:gospels': ['book:Matt', 'book:Mark', 'book:Luke', 'book:John'],
  'sec:acts': ['book:Acts'],
  'sec:pauline': ['book:Rom', 'book:1Cor', 'book:2Cor', 'book:Gal', 'book:Eph', 'book:Phil', 'book:Col', 'book:1Thess', 'book:2Thess', 'book:1Tim', 'book:2Tim', 'book:Titus', 'book:Phlm'],
  'sec:general': ['book:Heb', 'book:Jas', 'book:1Pet', 'book:2Pet', 'book:Jude', 'book:1John', 'book:2John', 'book:3John'],
  'sec:revelation': ['book:Rev'],
};

// Map testaments to their section IDs (in order)
const TESTAMENT_TO_SECTIONS: Record<TestamentId, SectionId[]> = {
  'OT': ['sec:pentateuch', 'sec:history', 'sec:wisdom', 'sec:major_prophets', 'sec:minor_prophets'],
  'NT': ['sec:gospels', 'sec:acts', 'sec:pauline', 'sec:general', 'sec:revelation'],
};

// Get books in a section
export function getBooksInSection(sectionId: SectionId): Band[] {
  const bookIds = SECTION_TO_BOOKS[sectionId];
  if (!bookIds) return [];
  return bookIds.map(id => getBookById(id));
}

// Get sections in a testament (returns section IDs in order)
export function getSectionsInTestament(testament: TestamentId): SectionId[] {
  return TESTAMENT_TO_SECTIONS[testament];
}

// Get testament for a section
export function getTestamentForSection(sectionId: SectionId): TestamentId {
  if (TESTAMENT_TO_SECTIONS.OT.includes(sectionId)) return 'OT';
  if (TESTAMENT_TO_SECTIONS.NT.includes(sectionId)) return 'NT';
  throw new Error(`Unknown section: ${sectionId}`);
}

// Get testament for a book ID
export function getTestamentForBook(bookId: string): TestamentId {
  const book = getBookById(bookId);
  return book.startIdx < TESTAMENT_SPLIT ? 'OT' : 'NT';
}

// Get section for a book ID
export function getSectionForBook(bookId: string): SectionId {
  for (const [sectionId, bookIds] of Object.entries(SECTION_TO_BOOKS)) {
    if (bookIds.includes(bookId)) {
      return sectionId as SectionId;
    }
  }
  throw new Error(`No section found for book: ${bookId}`);
}

// Alias for getBookForIndex (spec uses this name)
export function getBookByIndex(idx: number): Band {
  return getBookForIndex(idx);
}

// Validation: guard against off-by-one, gaps, overlaps
export function validateBooks(): boolean {
  // 1) Sorted & contiguous
  for (let i = 0; i < BOOK_BANDS.length; i++) {
    const b = BOOK_BANDS[i];
    if (b.endIdx - b.startIdx + 1 !== b.count) {
      throw new Error(`Bad count for ${b.id}`);
    }
    if (i > 0) {
      const prev = BOOK_BANDS[i-1];
      if (b.startIdx !== prev.endIdx + 1) {
        throw new Error(`Gap/overlap at ${prev.id} -> ${b.id}`);
      }
    } else if (b.startIdx !== 0) {
      throw new Error('First book must start at 0');
    }
  }

  // 2) Last endIdx matches TOTAL_VERSES - 1
  const last = BOOK_BANDS[BOOK_BANDS.length-1];
  if (last.endIdx !== TOTAL_VERSES - 1) {
    throw new Error(`Last endIdx ${last.endIdx} != TOTAL-1 ${TOTAL_VERSES-1}`);
  }

  // 3) Sum equals TOTAL
  const sum = BOOK_BANDS.reduce((n, b) => n + b.count, 0);
  if (sum !== TOTAL_VERSES) {
    throw new Error(`Sum ${sum} != TOTAL ${TOTAL_VERSES}`);
  }

  return true;
}

// ============================================================================
// CANONICAL STEPPING HELPERS (Non-looping, cross-boundary navigation)
// ============================================================================

import { VERSE_COUNTS_BY_CHAPTER } from './bibleVerseCountHelper';

// Helper: Get chapter count for a book
export function getChapterCount(bookId: string): number {
  // Convert 'book:Matt' to 'Matt'
  const bookTag = bookId.replace('book:', '');
  const counts = VERSE_COUNTS_BY_CHAPTER[bookTag];
  return counts ? counts.length : 1;
}

// Helper: Get first section of a testament
export function firstSectionOf(testament: TestamentId): SectionId {
  const sections = TESTAMENT_TO_SECTIONS[testament];
  return sections[0];
}

// Helper: Get first book of a testament/section
export function firstBookOf(testament: TestamentId, sectionId: SectionId): string {
  const bookIds = SECTION_TO_BOOKS[sectionId];
  return bookIds[0];
}

// Helper: Locate book (returns testament, sectionId)
export function locateBook(bookId: string): { testament: TestamentId; sectionId: SectionId } {
  const testament = getTestamentForBook(bookId);
  const sectionId = getSectionForBook(bookId);
  return { testament, sectionId };
}

// Step testament (non-looping): OT → NT or NT → OT
export function stepTestamentCanon(current: TestamentId, dir: 'prev' | 'next'): TestamentId | null {
  if (dir === 'next') {
    return current === 'OT' ? 'NT' : null; // NT is last, can't go further
  } else {
    return current === 'NT' ? 'OT' : null; // OT is first, can't go back
  }
}

// Step section (non-looping, cross-testament): Pentateuch → ... → Revelation
export function stepSectionCanon(
  testament: TestamentId,
  sectionId: SectionId,
  dir: 'prev' | 'next'
): { testament: TestamentId; sectionId: SectionId } | null {
  // All sections in canonical order (OT → NT)
  const allSections: SectionId[] = [
    ...TESTAMENT_TO_SECTIONS.OT,
    ...TESTAMENT_TO_SECTIONS.NT,
  ];
  
  const currentIdx = allSections.indexOf(sectionId);
  if (currentIdx === -1) return null;
  
  const nextIdx = dir === 'next' ? currentIdx + 1 : currentIdx - 1;
  
  // Check bounds (non-looping)
  if (nextIdx < 0 || nextIdx >= allSections.length) {
    return null;
  }
  
  const nextSection = allSections[nextIdx];
  const nextTestament = getTestamentForSection(nextSection);
  
  return { testament: nextTestament, sectionId: nextSection };
}

// Step book (non-looping, cross-testament/section): Gen → ... → Rev
export function stepBookCanon(bookId: string, dir: 'prev' | 'next'): string | null {
  const currentIdx = BOOK_BANDS.findIndex(b => b.id === bookId);
  if (currentIdx === -1) return null;
  
  const nextIdx = dir === 'next' ? currentIdx + 1 : currentIdx - 1;
  
  // Check bounds (non-looping)
  if (nextIdx < 0 || nextIdx >= BOOK_BANDS.length) {
    return null;
  }
  
  return BOOK_BANDS[nextIdx].id;
}

// Step chapter (non-looping, cross-book): Gen 1 → Gen 2 → ... → Rev 22
export function stepChapterCanon(
  bookId: string,
  chapter: number, // 0-based
  dir: 'prev' | 'next'
): { bookId: string; chapter: number } | null {
  const chapterCount = getChapterCount(bookId);
  
  if (dir === 'next') {
    // Can we advance within this book?
    if (chapter + 1 < chapterCount) {
      return { bookId, chapter: chapter + 1 };
    }
    // Need to move to next book, chapter 0
    const nextBook = stepBookCanon(bookId, 'next');
    if (!nextBook) return null; // Reached Revelation last chapter
    return { bookId: nextBook, chapter: 0 };
  } else {
    // Can we go back within this book?
    if (chapter > 0) {
      return { bookId, chapter: chapter - 1 };
    }
    // Need to move to previous book, last chapter
    const prevBook = stepBookCanon(bookId, 'prev');
    if (!prevBook) return null; // Reached Genesis chapter 0
    const prevChapterCount = getChapterCount(prevBook);
    return { bookId: prevBook, chapter: prevChapterCount - 1 };
  }
}
