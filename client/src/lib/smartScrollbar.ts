// smartScrollbar.ts
// Master bands + piecewise scales + auto-zoom controller tuned to Bible scrolling

import { 
  getBookById, 
  getBooksInSection, 
  getSectionsInTestament, 
  getTestamentForSection,
  getSectionForBook,
  BOOK_BANDS,
  type SectionId, 
  type TestamentId,
  // Canonical stepping helpers (non-looping, cross-boundary)
  stepTestamentCanon,
  stepSectionCanon,
  stepBookCanon,
  stepChapterCanon,
  firstSectionOf,
  firstBookOf,
  locateBook,
  getChapterCount
} from './bookBands';
import { VERSE_COUNTS_BY_CHAPTER } from './bibleVerseCountHelper';

export type ScrollMode = 'global' | 'testament' | 'section' | 'book' | 'auto';

export type Band = {
  id: string;
  label?: string;
  startIdx: number; // inclusive verse index
  endIdx: number;   // inclusive verse index
  count: number;    // endIdx - startIdx + 1
  y0?: number;      // [0..1] allocation on track (assigned by scale builders)
  y1?: number;
};

export type Scale = {
  bands: Band[];
  toIndex(y01: number): number; // track pos -> verse index
  toY01(idx: number): number;   // verse index -> track pos
};

export type AutoZoomConfig = {
  // NOTE: Auto-zoom disabled - these are kept for backward compatibility but unused
  // T_dwell_testament: number;  // UNUSED - auto-zoom removed
  // T_dwell_section: number;    // UNUSED - auto-zoom removed
  // V_fast_px_ms: number;       // UNUSED - auto-zoom removed
  // V_slow_px_ms: number;       // UNUSED - auto-zoom removed
  // hysteresisPct: number;      // UNUSED - auto-zoom removed
  quiet_ms: number;           // cooldown after manual style changes
  // animate_ms: number;         // UNUSED - auto-zoom removed
  // calmMode: boolean;          // UNUSED - auto-zoom removed
  sectionShare: number;       // 0.70 for weighted scales (kept for legacy)
  testamentShare: number;     // 0.88 for weighted scales (kept for legacy)
  // quickWindowMs: number;      // UNUSED - auto-zoom removed
  // deadzonePx: number;         // UNUSED - auto-zoom removed
  // travelBurstPx: number;      // UNUSED - auto-zoom removed
};

// SIMPLIFIED CONFIG (auto-zoom removed)
export const DEFAULT_AUTOZOOM_CONFIG: AutoZoomConfig = {
  quiet_ms: 320,                 // 320ms cooldown after manual style changes
  sectionShare: 0.70,            // Kept for legacy weighted scales
  testamentShare: 0.88,          // Kept for legacy weighted scales
};

export const MOBILE_AUTOZOOM_CONFIG: AutoZoomConfig = {
  ...DEFAULT_AUTOZOOM_CONFIG,
};

// ---------- Canonical master bands (from your current keys) ----------
export const TOTAL_VERSES = 31102 as const;

export const TESTAMENT_BANDS: readonly Band[] = [
  { id: 'test:OT', label: 'Old Testament', startIdx: 0,     endIdx: 23144, count: 23145 },
  { id: 'test:NT', label: 'New Testament', startIdx: 23145, endIdx: 31101, count:  7957 },
];

export const SECTION_BANDS_OT: readonly Band[] = [
  { id: 'sec:pentateuch',     label: 'Pentateuch',       startIdx: 0,     endIdx:  5851, count:  5852 },
  { id: 'sec:history',        label: 'History',          startIdx: 5852,  endIdx: 12869, count:  7018 },
  { id: 'sec:wisdom',         label: 'Wisdom & Poetry',  startIdx: 12870, endIdx: 17654, count:  4785 },
  { id: 'sec:major_prophets', label: 'Major Prophets',   startIdx: 17655, endIdx: 22094, count:  4440 },
  { id: 'sec:minor_prophets', label: 'Minor Prophets',   startIdx: 22095, endIdx: 23144, count:  1050 },
];

export const SECTION_BANDS_NT: readonly Band[] = [
  { id: 'sec:gospels',     label: 'Gospels',            startIdx: 23145, endIdx: 26923, count: 3779 },
  { id: 'sec:acts',        label: 'Acts',               startIdx: 26924, endIdx: 27930, count: 1007 },
  { id: 'sec:pauline',     label: 'Pauline Epistles',   startIdx: 27931, endIdx: 29963, count: 2033 },
  { id: 'sec:general',     label: 'General Epistles',   startIdx: 29964, endIdx: 30697, count:  734 },
  { id: 'sec:revelation',  label: 'Revelation',         startIdx: 30698, endIdx: 31101, count:  404 },
];

// ---------- Book bands (Task 4) ----------
export type BookInfo = {
  id: string;
  name: string;
  startIdx: number;
  endIdx: number;
  count: number;
  sectionId: string;
  testament: 'OT' | 'NT';
};

// PLACEHOLDER: Book bands need to be parsed from verse keys
// For now, return empty array to enable graceful fallback to section zoom
function getBookBandsForSection(testament: 'OT'|'NT', sectionId: string): BookInfo[] {
  if (import.meta?.env?.DEV) {
    console.warn('⚠️ Book zoom requested but book bands not implemented yet - falling back to section zoom');
  }
  return [];
}

// ---------- Model ----------
export type VerseModel = {
  total: number;                 // 31102
  locateRegion(idx: number): { testament: 'OT'|'NT'; sectionId: string };
  sectionsFor(testament: 'OT'|'NT'): readonly Band[];
};

export function makeCanonicalModel(): VerseModel {
  return {
    total: TOTAL_VERSES,
    locateRegion(idx: number) {
      const testament = (idx <= TESTAMENT_BANDS[0].endIdx) ? 'OT' : 'NT';
      const secs = testament === 'OT' ? SECTION_BANDS_OT : SECTION_BANDS_NT;
      const sec = secs.find(s => idx >= s.startIdx && idx <= s.endIdx)!;
      return { testament, sectionId: sec.id };
    },
    sectionsFor(t) {
      return t === 'OT' ? SECTION_BANDS_OT : SECTION_BANDS_NT;
    },
  };
}

// ---------- Scales ----------
export function scaleGlobal(model: VerseModel): Scale {
  const band: Band = { id: 'all', startIdx: 0, endIdx: model.total - 1, count: model.total, y0: 0, y1: 1 };
  return buildPiecewise([band]);
}

export function scaleTestament(
  model: VerseModel,
  active: 'OT'|'NT',
  cfg: AutoZoomConfig
): Scale {
  const [ot, nt] = TESTAMENT_BANDS as Band[];
  const big = cfg.testamentShare;
  const small = 1 - big;
  const bands: Band[] = (active === 'OT')
    ? [{ ...ot, y0: 0, y1: big }, { ...nt, y0: big, y1: 1 }]
    : [{ ...ot, y0: 0, y1: small }, { ...nt, y0: small, y1: 1 }];
  return buildPiecewise(bands);
}

export function scaleSection(
  model: VerseModel,
  activeTestament: 'OT'|'NT',
  activeSectionId: string,
  cfg: AutoZoomConfig
): Scale {
  const sections = model.sectionsFor(activeTestament).map(s => ({ ...s }));
  const A = cfg.sectionShare;
  const totalOther = sections.filter(s => s.id !== activeSectionId).reduce((n, s) => n + s.count, 0);
  const B = 1 - A;

  let y = 0;
  const bands = sections.map(s => {
    const share = (s.id === activeSectionId) ? A : B * (s.count / Math.max(1, totalOther));
    const b = { ...s, y0: y, y1: y + share };
    y += share;
    return b;
  });
  bands[bands.length - 1].y1 = 1; // normalise

  return buildPiecewise(bands);
}

export function scaleBook(
  model: VerseModel,
  testament: 'OT'|'NT',
  sectionId: string,
  bookId: string,
  cfg: AutoZoomConfig
): Scale {
  const section = model.sectionsFor(testament).find(s => s.id === sectionId);
  if (!section) return scaleGlobal(model);
  
  const books = getBookBandsForSection(testament, sectionId);
  const activeBook = books.find(b => b.id === bookId);
  if (!activeBook || books.length === 0) {
    // Fall back to section if book not found
    return scaleSection(model, testament, sectionId, cfg);
  }
  
  const bookShare = 0.80; // Active book gets 80% of track
  const otherShare = 0.20; // Remaining 20% split among other books
  
  // Calculate total verses in other books
  const otherBooks = books.filter(b => b.id !== bookId);
  const otherTotal = otherBooks.reduce((sum, b) => sum + b.count, 0);
  
  const bands: Band[] = [];
  let y = 0.0;
  
  // Bands before active book
  const beforeBooks = otherBooks.filter(b => b.endIdx < activeBook.startIdx);
  for (const book of beforeBooks) {
    const share = otherTotal > 0 ? (book.count / otherTotal) * otherShare : 0;
    bands.push({
      ...book,
      y0: y,
      y1: y + share,
    });
    y += share;
  }
  
  // Active book band (gets 80%)
  bands.push({
    ...activeBook,
    y0: y,
    y1: y + bookShare,
  });
  y += bookShare;
  
  // Bands after active book  
  const afterBooks = otherBooks.filter(b => b.startIdx > activeBook.endIdx);
  for (const book of afterBooks) {
    const share = otherTotal > 0 ? (book.count / otherTotal) * otherShare : 0;
    bands.push({
      ...book,
      y0: y,
      y1: y + share,
    });
    y += share;
  }
  
  bands[bands.length - 1].y1 = 1.0; // Normalize
  
  return buildPiecewise(bands);
}

// ---------- Pure-Scope Scale Builders (Stage 1) ----------
// Each returns a single band with y0=0, y1=1 covering only the relevant scope

export function scalePureGlobal(): Scale {
  const band: Band = { 
    id: 'all', 
    label: 'Global',
    startIdx: 0, 
    endIdx: TOTAL_VERSES - 1, 
    count: TOTAL_VERSES, 
    y0: 0, 
    y1: 1 
  };
  return buildPiecewise([band]);
}

export function scalePureTestament(testament: TestamentId): Scale {
  const testamentBand = TESTAMENT_BANDS.find(b => b.id === `test:${testament}`)!;
  const band: Band = {
    ...testamentBand,
    y0: 0,
    y1: 1
  };
  return buildPiecewise([band]);
}

export function scalePureSection(sectionId: SectionId): Scale {
  const allSections = [...SECTION_BANDS_OT, ...SECTION_BANDS_NT];
  const sectionBand = allSections.find(s => s.id === sectionId)!;
  const band: Band = {
    ...sectionBand,
    y0: 0,
    y1: 1
  };
  return buildPiecewise([band]);
}

export function scalePureBook(bookId: string): Scale {
  const bookBand = getBookById(bookId);
  const band: Band = {
    id: bookBand.id,
    label: bookBand.label,
    startIdx: bookBand.startIdx,
    endIdx: bookBand.endIdx,
    count: bookBand.count,
    y0: 0,
    y1: 1
  };
  return buildPiecewise([band]);
}

export function buildPiecewise(bandsIn: Band[]): Scale {
  const bands = bandsIn.map(b => ({ ...b })) as Band[];

  const toIndex = (y01: number) => {
    const y = clamp01(y01);
    const b = bands.find(b => y >= (b.y0 ?? 0) && y < (b.y1 ?? 1)) ?? bands[bands.length - 1];
    const t = invLerp(b.y0!, b.y1!, y);
    const raw = Math.round(lerp(b.startIdx, b.endIdx, t));
    return raw;
  };

  const toY01 = (idx: number) => {
    // Find matching band, or choose nearest one (not always bands[0])
    const b = bands.find(b => idx >= b.startIdx && idx <= b.endIdx) 
      ?? (idx < bands[0].startIdx ? bands[0] : bands[bands.length - 1]);
    
    // Clamp index to band's bounds to prevent t > 1.0
    const clampedIdx = Math.min(b.endIdx, Math.max(b.startIdx, idx));
    const t = invLerp(b.startIdx, b.endIdx, clampedIdx);
    
    // Clamp final output to [0, 1] to prevent scrollbar thumb from going off-track
    return clamp01(lerp(b.y0!, b.y1!, t));
  };

  return { bands, toIndex, toY01 };
}

// ---------- Helper function for chapter navigation ----------
export function getChapterStartIndices(bookId: string): number[] {
  const book = getBookById(bookId);
  if (!book) return [];
  
  const bookTag = bookId.replace('book:', '');
  const verseCounts = VERSE_COUNTS_BY_CHAPTER[bookTag];
  if (!verseCounts) return [];
  
  const chapterStartIndices: number[] = [];
  let currentIdx = book.startIdx;
  
  for (let i = 0; i < verseCounts.length; i++) {
    chapterStartIndices.push(currentIdx);
    currentIdx += verseCounts[i];
  }
  
  return chapterStartIndices;
}

// ---------- Auto-zoom controller ----------
export class SmartScrollbarController {
  private mode: ScrollMode = 'auto';
  private activeTestament: 'OT'|'NT' = 'OT';
  private activeSectionId: string = 'sec:pentateuch';
  private lastChangeTs = 0;
  private scale: Scale;
  private scaleVersion: number = 0;  // Increments on every scale rebuild
  private lastAnchorIdx = 0;
  private activeBookId: string = 'book:Matt';  // Stage 2: Initialize to Matthew
  private activeChapterIndex: number = 0;  // Track current chapter in book mode
  
  // REMOVED: Auto-zoom state variables (no longer needed)
  // private lastRegionKey = '';
  // private dwellInTestamentMs = 0;
  // private dwellInSectionMs = 0;
  // private pressT0 = 0;
  // private movedAbsPx = 0;
  // private travelLock = false;
  // private locked: boolean = true;

  constructor(private model: VerseModel, private cfg: AutoZoomConfig) {
    this.scale = scaleGlobal(model);
    this.scaleVersion = 1;
  }

  setMode(m: ScrollMode) { 
    this.mode = m; 
    this.rebuild(); 
  }

  getMode(): ScrollMode {
    return this.mode;
  }

  // REMOVED: Lock feature (auto-zoom disabled)
  // setLock(on: boolean) { this.locked = on; }
  // getLock(): boolean { return this.locked; }

  getActiveScaleInfo(): { 
    mode: ScrollMode; 
    testament?: 'OT'|'NT'; 
    sectionId?: string; 
    bookId?: string; 
    label: string;
    primaryLabel: string;    // Main scope (style name)
    secondaryLabel: string;  // Sub-unit being controlled
  } {
    const info: any = { mode: this.mode };
    
    if (this.mode === 'auto') {
      // For auto mode, report actual scale level
      const bandCount = this.scale.bands.length;
      if (bandCount === 1) {
        info.mode = 'global';
        info.label = 'GLOBAL';
        info.primaryLabel = 'GLOBAL';
        info.secondaryLabel = this.activeTestament;
      } else if (bandCount === 2) {
        info.mode = 'testament';
        info.testament = this.activeTestament;
        info.label = this.activeTestament === 'OT' ? 'OLD TESTAMENT' : 'NEW TESTAMENT';
        info.primaryLabel = info.label;
        info.secondaryLabel = this.getSectionLabel(this.activeSectionId);
      } else {
        info.mode = 'section';
        info.testament = this.activeTestament;
        info.sectionId = this.activeSectionId;
        info.label = this.getSectionLabel(this.activeSectionId);
        info.primaryLabel = info.label;
        const book = getBookById(this.activeBookId);
        info.secondaryLabel = book.label || this.activeBookId.replace('book:', '');
      }
    } else if (this.mode === 'global') {
      info.label = 'GLOBAL';
      info.primaryLabel = 'GLOBAL';
      info.secondaryLabel = this.activeTestament;
    } else if (this.mode === 'testament') {
      info.testament = this.activeTestament;
      info.label = this.activeTestament === 'OT' ? 'OLD TESTAMENT' : 'NEW TESTAMENT';
      info.primaryLabel = info.label;
      info.secondaryLabel = this.getSectionLabel(this.activeSectionId);
    } else if (this.mode === 'section') {
      info.testament = this.activeTestament;
      info.sectionId = this.activeSectionId;
      info.label = this.getSectionLabel(this.activeSectionId);
      info.primaryLabel = info.label;
      const book = getBookById(this.activeBookId);
      info.secondaryLabel = book.label || this.activeBookId.replace('book:', '');
    } else if (this.mode === 'book') {
      info.testament = this.activeTestament;
      info.sectionId = this.activeSectionId;
      info.bookId = this.activeBookId;
      const book = getBookById(this.activeBookId);
      info.label = book.label?.toUpperCase() || this.activeBookId.toUpperCase();
      info.primaryLabel = info.label;
      info.secondaryLabel = String(this.activeChapterIndex + 1); // Convert 0-based to 1-based
    }
    
    return info;
  }

  private getSectionLabel(sectionId: string): string {
    const labels: Record<string, string> = {
      'sec:pentateuch': 'PENTATEUCH',
      'sec:history': 'HISTORY',
      'sec:wisdom': 'WISDOM & POETRY',
      'sec:major_prophets': 'MAJOR PROPHETS',
      'sec:minor_prophets': 'MINOR PROPHETS',
      'sec:gospels': 'GOSPELS',
      'sec:acts': 'ACTS',
      'sec:pauline': 'PAULINE EPISTLES',
      'sec:general': 'GENERAL EPISTLES',
      'sec:revelation': 'REVELATION',
    };
    return labels[sectionId] || sectionId.toUpperCase();
  }

  // Stage 3: Navigation APIs
  
  setStyle(style: ScrollMode) {
    this.mode = style;
    this.rebuild();
  }

  // CANONICAL PATH SETTER (Enforces invariant: most specific field determines upper levels)
  private setSelectionPath(params: {
    testament?: TestamentId;
    sectionId?: SectionId;
    bookId?: string;
    chapter?: number;
  }): void {
    // Resolve from most specific to least specific
    // Priority: chapter+book > book > section > testament
    
    if (params.chapter !== undefined || params.bookId !== undefined) {
      // Book-level navigation
      const bookId = params.bookId || this.activeBookId;
      
      // Validate and clamp chapter if provided
      const chapterCount = getChapterCount(bookId);
      let chapter = params.chapter !== undefined ? params.chapter : this.activeChapterIndex;
      chapter = Math.max(0, Math.min(chapter, chapterCount - 1));
      
      // Compute canonical parents from book
      const { testament, sectionId } = locateBook(bookId);
      
      this.activeTestament = testament;
      this.activeSectionId = sectionId;
      this.activeBookId = bookId;
      this.activeChapterIndex = chapter;
      
    } else if (params.sectionId !== undefined) {
      // Section-level navigation
      const testament = getTestamentForSection(params.sectionId);
      
      this.activeTestament = testament;
      this.activeSectionId = params.sectionId;
      this.activeBookId = firstBookOf(testament, params.sectionId);
      this.activeChapterIndex = 0;
      
    } else if (params.testament !== undefined) {
      // Testament-level navigation
      const sectionId = firstSectionOf(params.testament);
      
      this.activeTestament = params.testament;
      this.activeSectionId = sectionId;
      this.activeBookId = firstBookOf(params.testament, sectionId);
      this.activeChapterIndex = 0;
    }
    
    // Rebuild scale for current style
    this.rebuild();
  }

  stepSelection(direction: 'prev' | 'next'): number | undefined {
    let verseIndexToScrollTo: number | undefined;
    
    // CANONICAL STEPPING: Non-looping, cross-boundary navigation
    // UP/DOWN never change mode, only move through canonical Bible order
    // Each style controls the next-lower unit and continues across boundaries
    
    if (this.mode === 'global' || this.mode === 'auto') {
      // Global/Auto style: UP/DOWN controls Testament (OT → NT, non-looping)
      const nextTestament = stepTestamentCanon(this.activeTestament, direction);
      if (!nextTestament) {
        return undefined; // Reached end (can't go past NT or before OT)
      }
      // Use canonical setter to update path
      this.setSelectionPath({ testament: nextTestament });
      // Scroll to first verse of selected testament
      const testamentBand = TESTAMENT_BANDS.find(b => b.id === `test:${this.activeTestament}`)!;
      verseIndexToScrollTo = testamentBand.startIdx;
      
    } else if (this.mode === 'testament') {
      // Testament style: UP/DOWN controls Section (across OT→NT, non-looping)
      const nextSection = stepSectionCanon(this.activeTestament, this.activeSectionId as SectionId, direction);
      if (!nextSection) {
        return undefined; // Reached end (Pentateuch or Revelation)
      }
      // Use canonical setter to update path
      this.setSelectionPath({ sectionId: nextSection.sectionId });
      // Scroll to first verse of selected section
      const allSections = [...SECTION_BANDS_OT, ...SECTION_BANDS_NT];
      const sectionBand = allSections.find(s => s.id === this.activeSectionId)!;
      verseIndexToScrollTo = sectionBand.startIdx;
      
    } else if (this.mode === 'section') {
      // Section style: UP/DOWN controls Book (across sections/testaments, non-looping)
      const nextBook = stepBookCanon(this.activeBookId, direction);
      if (!nextBook) {
        return undefined; // Reached end (Genesis or Revelation)
      }
      // Use canonical setter to update path (automatically resolves testament/section)
      this.setSelectionPath({ bookId: nextBook, chapter: 0 });
      // Scroll to first verse of selected book
      const book = getBookById(this.activeBookId);
      verseIndexToScrollTo = book.startIdx;
      
    } else if (this.mode === 'book') {
      // Book style: UP/DOWN controls Chapter (across books, non-looping)
      const nextChapter = stepChapterCanon(this.activeBookId, this.activeChapterIndex, direction);
      if (!nextChapter) {
        return undefined; // Reached end (Gen 1 or Rev 22)
      }
      // Use canonical setter to update path (automatically resolves testament/section)
      this.setSelectionPath({ bookId: nextChapter.bookId, chapter: nextChapter.chapter });
      // Scroll to first verse of selected chapter
      const chapterStartIndices = getChapterStartIndices(this.activeBookId);
      verseIndexToScrollTo = chapterStartIndices[this.activeChapterIndex];
    }
    
    this.startQuiet();  // 320ms quiet period
    return verseIndexToScrollTo;
  }

  gotoSelection(params: { 
    testament?: TestamentId; 
    sectionId?: SectionId; 
    bookId?: string; 
    chapter?: number;
    verseIndex?: number;
  }): number | undefined {
    // KEY CHANGE: Hyperlinks set the full selection path WITHOUT changing mode
    // The current style (Global/Testament/Section/Book) remains unchanged
    // Only the selection state is updated, then we rebuild with the current mode
    
    // Convert chapter from 1-based to 0-based if provided
    const chapterIndex = params.chapter !== undefined ? params.chapter - 1 : undefined;
    
    // Use canonical setter to update path
    // This automatically resolves missing parent levels (testament/section from book)
    this.setSelectionPath({
      testament: params.testament,
      sectionId: params.sectionId,
      bookId: params.bookId,
      chapter: chapterIndex,
    });
    
    this.startQuiet();  // 320ms quiet period
    
    // Return the verse index if provided (for scrolling)
    return params.verseIndex;
  }

  // REMOVED: Threshold presets (auto-zoom disabled)
  // applyThresholdPreset(platform: 'desktop' | 'mobile') { ... }
  
  // REMOVED: Interaction start tracking (auto-zoom disabled)
  // onInteractStart() { ... }

  onViewportAnchor(idx: number, dtMs: number) {
    // SIMPLIFIED: Track selection path only (no dwell, no auto-zoom)
    // Just keep smooth scroll coordination by updating active testament/section/book/chapter
    const { testament, sectionId } = this.model.locateRegion(idx);
    
    // Track current book and chapter from scroll position
    const book = getBookById(BOOK_BANDS.find(b => idx >= b.startIdx && idx <= b.endIdx)!.id);
    const bookId = book.id;
    
    // Find current chapter within the book
    const chapterStartIndices = getChapterStartIndices(bookId);
    let chapterIndex = 0;
    for (let i = chapterStartIndices.length - 1; i >= 0; i--) {
      if (idx >= chapterStartIndices[i]) {
        chapterIndex = i;
        break;
      }
    }
    
    // Update selection path to match scroll position
    this.activeTestament = testament;
    this.activeSectionId = sectionId;
    this.activeBookId = bookId;
    this.activeChapterIndex = chapterIndex;
    this.lastAnchorIdx = idx;
  }
  
  // REMOVED: Hysteresis logic (auto-zoom disabled)
  // private shouldSwitchRegion(...) { ... }

  // UI asks: where should the thumb be for this anchor index?
  yForIndex(idx: number) { 
    return this.scale.toY01(idx); 
  }

  // Get current scale for rendering (ticks, bands)
  getScale() { 
    return this.scale; 
  }

  // Get scale snapshot with version for reactive updates
  getScaleSnapshot() {
    return {
      bands: this.scale.bands,
      toY01: this.scale.toY01,
      toIndex: this.scale.toIndex,
      version: this.scaleVersion,
    };
  }

  // Interaction step: map pointer y -> verse index (NO AUTO-ZOOM)
  onInteractStep(y01: number, deltaPx: number, dtMs: number, bypass: boolean): number {
    // SIMPLIFIED: Just map y01 to index using current scope's scale
    // Never change style during drag - manual navigation only
    // Clamp to current scope bounds automatically via scale.toIndex()
    return this.scale.toIndex(y01);
  }

  // Call on pointerup/touchend (NO AUTO-ZOOM)
  onInteractEnd(y01: number, lastVelocity: number) {
    // SIMPLIFIED: No velocity/dwell calculations, no auto-zoom triggers
    // Just return the current index
    return this.scale.toIndex(y01);
  }

  // Stage 4: Updated rebuild logic using pure-scope builders for manual modes
  private rebuild() {
    if (this.mode === 'global') {
      this.scale = scalePureGlobal();
    } else if (this.mode === 'testament') {
      this.scale = scalePureTestament(this.activeTestament);
    } else if (this.mode === 'section') {
      this.scale = scalePureSection(this.activeSectionId as SectionId);
    } else if (this.mode === 'book') {
      this.scale = scalePureBook(this.activeBookId);
    } else if (this.mode === 'auto') {
      // Auto mode starts with global, auto-zoom logic will switch to weighted builders
      this.scale = scaleGlobal(this.model);
    }
    this.scaleVersion++;  // Increment version on every rebuild
  }

  private inQuiet() { 
    return (performance.now() - this.lastChangeTs) < this.cfg.quiet_ms; 
  }
  
  private startQuiet() { 
    this.lastChangeTs = performance.now(); 
  }
}

// ---------- Math helpers ----------
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const invLerp = (a: number, b: number, v: number) => (b === a ? 0 : (v - a) / (b - a));
