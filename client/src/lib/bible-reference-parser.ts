/*
  Bible Reference Parser — single-file drop‑in for Anointed.io
  ------------------------------------------------------------
  Goals
  - Accept MANY user formats (abbrev with/without periods, two‑letter codes, roman/arabic numerals, compact forms like jn316, lists, ranges, a/b/c parts, f/ff, dot/colon/comma separators).
  - Always EMIT your canonical key format:  "<BookTag>.<chapter>:<verse>"
    where BookTag matches your filesystem naming (e.g., "Gen", "Exod", "Ps", "1 Sam", "Matt", "Rev").
  - Keep it lightweight: no DB needed; alias match + tiny regex.

  Integration
  - Use parseReferences(input, opts) to get structured refs/ranges.
  - Use formatKey(ref) to render to your exact on‑disk key (BookTag.chapter:verse).
  - Optionally pass getVerseCount(bookCode, chapter) to expand f/ff and ranges to lists of keys.
*/

/* ========================= Types ========================= */
export type BookCode =
  | "GEN" | "EXO" | "LEV" | "NUM" | "DEU" | "JOS" | "JDG" | "RUT"
  | "1SA" | "2SA" | "1KI" | "2KI" | "1CH" | "2CH" | "EZR" | "NEH" | "EST"
  | "JOB" | "PSA" | "PRO" | "ECC" | "SNG" | "ISA" | "JER" | "LAM" | "EZK"
  | "DAN" | "HOS" | "JOL" | "AMO" | "OBA" | "JON" | "MIC" | "NAM" | "HAB"
  | "ZEP" | "HAG" | "ZEC" | "MAL"
  | "MAT" | "MRK" | "LUK" | "JHN" | "ACT" | "ROM" | "1CO" | "2CO" | "GAL"
  | "EPH" | "PHP" | "COL" | "1TH" | "2TH" | "1TI" | "2TI" | "TIT" | "PHM"
  | "HEB" | "JAS" | "1PE" | "2PE" | "1JN" | "2JN" | "3JN" | "JUD" | "REV";

export type CanonicalRef = {
  bookCode: BookCode;
  chapter: number;
  verse: number;
  part?: "a" | "b" | "c";
};

export type CanonicalRange = {
  start: CanonicalRef;
  end: CanonicalRef; // inclusive
  source?: "range" | "following"; // metadata hint
};

export type ParsedPiece = CanonicalRef | CanonicalRange;

export type GetVerseCount = (book: BookCode, chapter: number) => number | undefined;

export type ParseOptions = {
  expandFollowing?: boolean;        // if true, expand f/ff using getVerseCount
  expandRangesToKeys?: boolean;     // if true, expand ranges to enumerated keys
  getVerseCount?: GetVerseCount;    // required if expandFollowing or expandRangesToKeys
  preferNTForAmbiguous?: boolean;   // tie‑break hint for ambiguous aliases (default false)
  includeVersePartInKey?: boolean;  // "Jn.3:16a" instead of "Jn.3:16"
};

/* ========================= Multi-Candidate Parser Types ========================= */
export type CandidateReason = 
  | "space-primary"    // Space-delimited book ch v (highest confidence)
  | "space-alt"        // Alternative interpretation of space-delimited
  | "compact"          // Compact format (jn111) - ambiguous
  | "chapter-only"     // Single number = chapter (e.g., jn11 → John 11:1)
  | "alt-inference";   // Inferred alternate (e.g., jn11 also suggests John 1:1)

export interface Candidate {
  key: string;              // Canonical key e.g., "John.3.16"
  ref: CanonicalRef;       // Full structured reference
  reason: CandidateReason; // Why this candidate exists
  confidence: number;      // 0-1 for sorting (higher = better)
}

/* ========================= Canonical book tags (output) ========================= */
// Import from consolidated config to ensure parser/storage alignment
import { CANONICAL_BOOK_TAG as CANONICAL_BOOK_TAG_FROM_CONFIG } from './verseMapConfig';
export const CANONICAL_BOOK_TAG = CANONICAL_BOOK_TAG_FROM_CONFIG;

// Import comprehensive alias system from bookAliases.ts
import { 
  resolveBook as resolveBookAlias, 
  ALIAS_TO_CODE,
  BookCode as DisplayBookCode
} from '@/lib/bookAliases';

// Import fuzzy matching for typo tolerance
import { distance } from 'fastest-levenshtein';

// Import verse count helper for smart digit splitting validation
import { getVerseCount as getVerseCountStatic, VERSE_COUNTS_BY_CHAPTER } from './bibleVerseCountHelper';

// Conditional import for verse index map (browser environment)
import type { getVerseIndexMap as GetVerseIndexMapType } from '@/lib/verseIndexMap';

let getVerseIndexMapFunc: typeof GetVerseIndexMapType | null = null;

// In browser, dynamically import the verse index map; in Node.js, it stays null
if (typeof window !== 'undefined') {
  import('@/lib/verseIndexMap').then(mod => {
    getVerseIndexMapFunc = mod.getVerseIndexMap;
  }).catch(() => {
    // Silently fail - will use static validation fallback
  });
}

/* ========================= Book Code Bridge ========================= */
// Bridge between bookAliases.ts display names and parser's internal BookCode type
// Maps "Gen" → "GEN", "Exod" → "EXO", "Matt" → "MAT", etc.
const DISPLAY_TO_INTERNAL: Record<DisplayBookCode, BookCode> = {
  "Gen": "GEN", "Exod": "EXO", "Lev": "LEV", "Num": "NUM", "Deut": "DEU",
  "Josh": "JOS", "Judg": "JDG", "Ruth": "RUT",
  "1Sam": "1SA", "2Sam": "2SA", "1Kgs": "1KI", "2Kgs": "2KI",
  "1Chr": "1CH", "2Chr": "2CH", "Ezra": "EZR", "Neh": "NEH", "Esth": "EST",
  "Job": "JOB", "Ps": "PSA", "Prov": "PRO", "Eccl": "ECC", "Song": "SNG",
  "Isa": "ISA", "Jer": "JER", "Lam": "LAM", "Ezek": "EZK", "Dan": "DAN",
  "Hos": "HOS", "Joel": "JOL", "Amos": "AMO", "Obad": "OBA", "Jonah": "JON",
  "Mic": "MIC", "Nah": "NAM", "Hab": "HAB", "Zeph": "ZEP", "Hag": "HAG",
  "Zech": "ZEC", "Mal": "MAL",
  "Matt": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
  "Rom": "ROM", "1Cor": "1CO", "2Cor": "2CO", "Gal": "GAL", "Eph": "EPH",
  "Phil": "PHP", "Col": "COL", "1Thess": "1TH", "2Thess": "2TH",
  "1Tim": "1TI", "2Tim": "2TI", "Titus": "TIT", "Phlm": "PHM",
  "Heb": "HEB", "Jas": "JAS", "1Pet": "1PE", "2Pet": "2PE",
  "1John": "1JN", "2John": "2JN", "3John": "3JN", "Jude": "JUD", "Rev": "REV"
};

// Reverse mapping for ambiguity detection: internal code → display name
const INTERNAL_TO_DISPLAY: Record<BookCode, DisplayBookCode> = {
  "GEN": "Gen", "EXO": "Exod", "LEV": "Lev", "NUM": "Num", "DEU": "Deut",
  "JOS": "Josh", "JDG": "Judg", "RUT": "Ruth",
  "1SA": "1Sam", "2SA": "2Sam", "1KI": "1Kgs", "2KI": "2Kgs",
  "1CH": "1Chr", "2CH": "2Chr", "EZR": "Ezra", "NEH": "Neh", "EST": "Esth",
  "JOB": "Job", "PSA": "Ps", "PRO": "Prov", "ECC": "Eccl", "SNG": "Song",
  "ISA": "Isa", "JER": "Jer", "LAM": "Lam", "EZK": "Ezek", "DAN": "Dan",
  "HOS": "Hos", "JOL": "Joel", "AMO": "Amos", "OBA": "Obad", "JON": "Jonah",
  "MIC": "Mic", "NAM": "Nah", "HAB": "Hab", "ZEP": "Zeph", "HAG": "Hag",
  "ZEC": "Zech", "MAL": "Mal",
  "MAT": "Matt", "MRK": "Mark", "LUK": "Luke", "JHN": "John", "ACT": "Acts",
  "ROM": "Rom", "1CO": "1Cor", "2CO": "2Cor", "GAL": "Gal", "EPH": "Eph",
  "PHP": "Phil", "COL": "Col", "1TH": "1Thess", "2TH": "2Thess",
  "1TI": "1Tim", "2TI": "2Tim", "TIT": "Titus", "PHM": "Phlm",
  "HEB": "Heb", "JAS": "Jas", "1PE": "1Pet", "2PE": "2Pet",
  "1JN": "1John", "2JN": "2John", "3JN": "3John", "JUD": "Jude", "REV": "Rev"
};

/* ========================= Helpers ========================= */
const RANGE_SEP = /\s*[\-–—]\s*/; // -, en dash, em dash

function deburr(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normSpaces(s: string): string {
  return s.replace(/[\u202F\u00A0]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeForAlias(s: string): string {
  return deburr(s.toLowerCase()).replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

function romanToArabic(r: string): number {
  const t = r.toLowerCase();
  if (t === "i") return 1;
  if (t === "ii") return 2;
  if (t === "iii") return 3;
  return NaN;
}

/**
 * Fix space-delimited references like "jn 3 16" → "jn 3:16"
 * This preprocessor handles space-separated chapter and verse numbers
 */
function normalizeSpaceDelimitedDigits(input: string): string {
  // Pattern: book name/abbreviation + space + digits + space + digits
  // Examples: "jn 3 16" → "jn 3:16", "john 3 16" → "john 3:16", "1 cor 13 4" → "1 cor 13:4"
  return input.replace(/([a-z]+\d*)\s+(\d+)\s+(\d+)/gi, '$1 $2:$3');
}

/**
 * Get all possible book matches for ambiguous input
 * Returns array of internal BookCode values that could match
 */
function getAllBookMatches(input: string): BookCode[] {
  const normalized = normalizeForAlias(input);
  const candidates: BookCode[] = [];
  
  // Check all possible aliases from ALIAS_TO_CODE
  const lowercaseInput = input.toLowerCase().trim();
  const spacelessInput = lowercaseInput.replace(/\s+/g, "");
  
  // Try variations
  const variations = [
    lowercaseInput,
    spacelessInput,
    normalized,
    normalized.replace(/\s+/g, "")
  ];
  
  for (const variant of variations) {
    // Check in ALIAS_TO_CODE
    for (const [alias, displayCode] of Object.entries(ALIAS_TO_CODE)) {
      if (alias === variant) {
        const internalCode = DISPLAY_TO_INTERNAL[displayCode];
        if (internalCode && !candidates.includes(internalCode)) {
          candidates.push(internalCode);
        }
      }
    }
  }
  
  return candidates;
}

/**
 * Use comprehensive bookAliases.ts system with ambiguity resolution
 * When multiple books match, prefer the one with valid verse reference
 */
function lookupBookCode(
  bookPart: string, 
  preferNT: boolean,
  chapter?: number,
  verse?: number
): BookCode | undefined {
  // Use resolveBook from bookAliases.ts for comprehensive matching
  const displayCode = resolveBookAlias(bookPart);
  
  if (displayCode) {
    const internalCode = DISPLAY_TO_INTERNAL[displayCode];
    if (internalCode) return internalCode;
  }
  
  // Fallback: check for ambiguous matches
  const candidates = getAllBookMatches(bookPart);
  
  if (candidates.length === 0) {
    // Try fuzzy matching as last resort
    return fuzzyMatchBook(bookPart, preferNT);
  }
  
  if (candidates.length === 1) {
    return candidates[0];
  }
  
  // Multiple matches - use ambiguity resolution
  if (chapter !== undefined && verse !== undefined) {
    // Validate each candidate against the verse reference
    for (const candidate of candidates) {
      if (isValidVerseKey(candidate, chapter, verse)) {
        return candidate;
      }
    }
  }
  
  // If preferNT is set, choose NT book
  if (preferNT) {
    const ntCandidate = candidates.find(c => NT_CODES.has(c));
    if (ntCandidate) return ntCandidate;
  }
  
  // Fallback to first candidate
  return candidates[0];
}

/**
 * Fuzzy matching for typos using Levenshtein distance
 * Catches common misspellings like "Jhon" → "John"
 * Prefers NT books when distances are close (distance 1-2)
 */
function fuzzyMatchBook(input: string, preferNT = false): BookCode | undefined {
  const normalized = normalizeForAlias(input);
  const spaceless = normalized.replace(/\s+/g, "");
  
  let bestMatch: BookCode | undefined;
  let bestDistance = 3; // threshold
  let bestAliasLength = Infinity;
  
  // Collect all matches within threshold
  const candidates: Array<{ code: BookCode; dist: number; aliasLen: number; isPrefix: boolean }> = [];
  
  for (const [alias, displayCode] of Object.entries(ALIAS_TO_CODE)) {
    const aliasSpaceless = alias.replace(/\s+/g, "");
    const dist = distance(spaceless, aliasSpaceless);
    const isPrefix = aliasSpaceless.startsWith(spaceless);
    const internalCode = DISPLAY_TO_INTERNAL[displayCode];
    
    if (dist <= bestDistance && internalCode) {
      candidates.push({ code: internalCode, dist, aliasLen: aliasSpaceless.length, isPrefix });
      if (dist < bestDistance) {
        bestDistance = dist;
      }
    }
  }
  
  // Filter to only best distance matches
  const bestCandidates = candidates.filter(c => c.dist === bestDistance);
  
  if (bestCandidates.length === 0) return undefined;
  if (bestCandidates.length === 1) return bestCandidates[0].code;
  
  // Multiple matches at same distance - apply tiebreakers
  // 1. Prefer prefix matches
  const prefixMatches = bestCandidates.filter(c => c.isPrefix);
  if (prefixMatches.length === 1) return prefixMatches[0].code;
  const workingSet = prefixMatches.length > 0 ? prefixMatches : bestCandidates;
  
  // 2. For small distances (1-2), prefer NT books for common typos like "Jhon" → "John" vs "Jon" (Jonah)
  // This handles cases where user likely meant a famous NT verse but made a typo
  if (bestDistance <= 2) {
    const ntMatches = workingSet.filter(c => NT_CODES.has(c.code));
    const otMatches = workingSet.filter(c => !NT_CODES.has(c.code));
    
    // If we have both NT and OT matches at similar distance, prefer NT for short inputs (likely famous verses)
    if (ntMatches.length > 0 && otMatches.length > 0 && spaceless.length <= 4) {
      // Among NT matches, prefer shorter alias
      ntMatches.sort((a, b) => a.aliasLen - b.aliasLen);
      return ntMatches[0].code;
    }
    
    // If preferNT flag is set, always prefer NT
    if (preferNT && ntMatches.length > 0) {
      ntMatches.sort((a, b) => a.aliasLen - b.aliasLen);
      return ntMatches[0].code;
    }
  }
  
  // 3. Prefer shorter aliases
  workingSet.sort((a, b) => a.aliasLen - b.aliasLen);
  return workingSet[0].code;
}

const NT_CODES = new Set<BookCode>([
  "MAT","MRK","LUK","JHN","ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD","REV"
]);

/* ========================= Formatting ========================= */
export function formatKey(ref: CanonicalRef, opts: Pick<ParseOptions, "includeVersePartInKey"> = {}): string {
  const tag = CANONICAL_BOOK_TAG[ref.bookCode];
  const base = `${tag}.${ref.chapter}:${ref.verse}`;
  return opts.includeVersePartInKey && ref.part ? base + ref.part : base;
}

/* ========================= Parsing ========================= */
// Split multi‑refs:  "Jn 3:16,18; 4:1"  -> ["Jn 3:16", "Jn 3:18", "Jn 4:1"]
function splitMulti(raw: string): string[] {
  // FIRST: Fix space-delimited digits "jn 3 16" → "jn 3:16"
  const withColons = normalizeSpaceDelimitedDigits(raw);
  const cleaned = normSpaces(deburr(withColons));
  // top‑level splits on ';'
  const parts = cleaned.split(/\s*;\s*/);
  const out: string[] = [];
  for (const part of parts) {
    // if "Book ch:vv,vv" pattern, expand commas
    const m = part.match(/^(.+?\s+\d+\s*[: ,]\s*)(.+)$/);
    if (!m) { out.push(part); continue; }
    const prefix = normSpaces(m[1]);
    const tails = m[2].split(/\s*,\s*/);
    for (const v of tails) out.push(prefix + v);
  }
  return out.filter(Boolean);
}

const SINGLE_RE = /^(.+?)\s+(\d+|i{1,3})\s*[: ,]?\s*(\d+)([abc])?(f{1,2})?$/i;
const COMPACT_WITH_COLON_RE = /^(\d|i{1,3})?\s*([a-z]+)\s*(\d+)\s*:\s*(\d+)([abc])?(f{1,2})?$/i; // Gen1:1, Rom8:28
const COMPACT_RE = /^(\d|i{1,3})?\s*([a-z]+)\s*(\d+)([abc])?(f{1,2})?$/i; // Ps23
const OSIS_RE = /^(.+?)\.(\d+)\.(\d+)([abc])?(f{1,2})?$/; // OSIS: John.3.16
const MIXED_DOT_COLON_RE = /^(.+?)\.(\d+):(\d+)([abc])?(f{1,2})?$/; // Mixed: John.3:16 (dot after book, colon before verse)
const CHAPTER_ONLY_RE = /^(.+?)\s+(\d+|i{1,3})$/; // Psalm 23, Romans 8

/**
 * Validate if a verse reference exists in the canonical verse key Map
 * This provides accurate validation against the actual 31,102 verses in the Bible
 * In browser: uses verse index map for precise validation
 * In Node.js: falls back to static validation using VERSE_COUNTS_BY_CHAPTER
 */
function isValidVerseKey(bookCode: BookCode, chapter: number, verse: number): boolean {
  // Use verse index map if available (browser environment)
  if (getVerseIndexMapFunc) {
    const tag = CANONICAL_BOOK_TAG[bookCode];
    const key = `${tag}.${chapter}:${verse}`;
    const indexMap = getVerseIndexMapFunc();
    return indexMap.has(key);
  }
  
  // Fallback to static validation (used in Node.js or when index map unavailable)
  const bookTag = CANONICAL_BOOK_TAG[bookCode];
  const counts = VERSE_COUNTS_BY_CHAPTER[bookTag];
  if (!counts || chapter > counts.length || chapter < 1) return false;
  const maxVerse = getVerseCountStatic(bookTag, chapter);
  return verse > 0 && verse <= maxVerse;
}

function trySmartDigitSplit(bookCode: BookCode, digits: string): { chapter: number; verse: number } | undefined {
  const len = digits.length;

  if (len === 1) {
    const ch = +digits;
    // Validate using verse key map for accurate existence check
    if (ch > 0 && isValidVerseKey(bookCode, ch, 1)) {
      return { chapter: ch, verse: 1 };
    }
    return undefined;
  }

  // FIRST: Try chapter-only interpretation (all digits = chapter, verse = 1)
  // This ensures "Ps23" → Psalm 23:1, not Psalm 2:3
  // Validates against actual verse keys to prevent invalid chapters like "John.316:1"
  const chapterNum = +digits;
  if (chapterNum > 0 && isValidVerseKey(bookCode, chapterNum, 1)) {
    return { chapter: chapterNum, verse: 1 };
  }

  // FALLBACK: Try verse splits from left to right
  // This handles cases like "John316" or "jn 3 16" (normalized to "jn316")
  // where chapter 316 doesn't exist, so we fall back to interpreting as chapter 3, verse 16
  // The validation ensures we only return valid verse references
  for (let splitAt = 1; splitAt < len; splitAt++) {
    const chStr = digits.substring(0, splitAt);
    const vsStr = digits.substring(splitAt);
    const ch = +chStr;
    const vs = +vsStr;

    // Use verse key validation for accurate existence check
    if (ch > 0 && vs > 0 && isValidVerseKey(bookCode, ch, vs)) {
      return { chapter: ch, verse: vs };
    }
  }

  return undefined;
}

function parseSingle(piece: string, opts: ParseOptions): ParsedPiece | undefined {
  const preferNT = !!opts.preferNTForAmbiguous;

  // OSIS dot notation: "John.3.16" or "1Sam.17.45" - CHECK FIRST to prevent misparsing
  const osisMatch = piece.match(OSIS_RE);
  if (osisMatch) {
    const [, bookPart, ch, vs, part, foll] = osisMatch;
    const chapter = +ch;
    const verse = +vs;
    // Pass chapter and verse for ambiguity resolution
    const bookCode = lookupBookCode(bookPart, preferNT, chapter, verse);
    if (bookCode) {
      const ref: CanonicalRef = { bookCode, chapter, verse, part: (part as any) || undefined };
      if (!foll) return ref;
      return { start: ref, end: { ...ref }, source: "following" };
    }
  }

  // Mixed dot-colon notation: "John.3:16" or "1Sam.17:45" (dot after book, colon before verse)
  const mixedMatch = piece.match(MIXED_DOT_COLON_RE);
  if (mixedMatch) {
    const [, bookPart, ch, vs, part, foll] = mixedMatch;
    const chapter = +ch;
    const verse = +vs;
    // Pass chapter and verse for ambiguity resolution
    const bookCode = lookupBookCode(bookPart, preferNT, chapter, verse);
    if (bookCode) {
      const ref: CanonicalRef = { bookCode, chapter, verse, part: (part as any) || undefined };
      if (!foll) return ref;
      return { start: ref, end: { ...ref }, source: "following" };
    }
  }

  // Chapter-only: "Psalm 23" or "Romans 8" (returns verse 1)
  const chapterOnlyMatch = piece.match(CHAPTER_ONLY_RE);
  if (chapterOnlyMatch) {
    const [, bookPart, ch] = chapterOnlyMatch;
    const chapter = isNaN(+ch) ? romanToArabic(ch) : +ch;
    // Pass chapter and verse 1 for ambiguity resolution
    const bookCode = lookupBookCode(bookPart, preferNT, chapter, 1);
    if (bookCode) {
      return { bookCode, chapter, verse: 1 };
    }
  }

  let m = piece.match(SINGLE_RE);
  if (m) {
    const [, bookPart, ch, vs, part, foll] = m;
    const chapter = isNaN(+ch) ? romanToArabic(ch) : +ch;
    const verse = +vs;
    // Pass chapter and verse for ambiguity resolution
    const bookCode = lookupBookCode(bookPart, preferNT, chapter, verse);
    if (!bookCode) return undefined;
    const ref: CanonicalRef = { bookCode, chapter, verse, part: (part as any) || undefined };
    if (!foll) return ref;
    return { start: ref, end: { ...ref }, source: "following" };
  }

  // compact with explicit colon: "Gen1:1", "Rom8:28"
  m = piece.match(COMPACT_WITH_COLON_RE);
  if (m) {
    const [, num, alpha, ch, vs, part, foll] = m;
    const bookPart = `${num ?? ""}${alpha}`;
    const chapter = +ch;
    const verse = +vs;
    // Pass chapter and verse for ambiguity resolution
    const bookCode = lookupBookCode(bookPart, preferNT, chapter, verse);
    if (!bookCode) return undefined;
    const ref: CanonicalRef = { bookCode, chapter, verse, part: (part as any) || undefined };
    if (!foll) return ref;
    return { start: ref, end: { ...ref }, source: "following" };
  }

  // compact: optional numeral + alpha + digits (with smart splitting for "Ps23")
  m = piece.match(COMPACT_RE);
  if (m) {
    const [, num, alpha, digits, part, foll] = m;
    const bookPart = `${num ?? ""}${alpha}`;
    // First try to resolve without chapter/verse to get any valid book
    let bookCode = lookupBookCode(bookPart, preferNT);
    if (!bookCode) return undefined;

    let chapter: number, verse: number;
    const smartSplit = trySmartDigitSplit(bookCode, digits);
    if (smartSplit) {
      chapter = smartSplit.chapter;
      verse = smartSplit.verse;
      
      // Now re-resolve with chapter and verse for ambiguity resolution
      bookCode = lookupBookCode(bookPart, preferNT, chapter, verse);
      if (!bookCode) return undefined;
    } else {
      return undefined;
    }

    const ref: CanonicalRef = { bookCode, chapter, verse, part: (part as any) || undefined };
    if (!foll) return ref;
    return { start: ref, end: { ...ref }, source: "following" };
  }

  // range inside a single piece: "Jn 3:16-18" or "Jn 3:16 – 4:2"
  const r = piece.split(RANGE_SEP);
  if (r.length === 2) {
    const left = parseSingle(r[0], opts);
    if (!left || !("bookCode" in (left as any))) return undefined; // left must be a ref
    const lref = left as CanonicalRef;

    // right side may omit book or chapter
    let rightRaw = r[1].trim();
    // if right missing book AND chapter part, inherit
    if (!/\D/.test(rightRaw.split(/\s+/)[0] || "")) {
      // begins with number; decide if that's chapter or verse
    }
    let right: CanonicalRef | undefined;

    // Try SAME BOOK forms first
    //  a) "Jn 3:16-18"   -> chapter same, verse=18
    let m1 = rightRaw.match(/^(\d+)$/);
    if (m1) {
      right = { bookCode: lref.bookCode, chapter: lref.chapter, verse: +m1[1] };
    }
    //  b) "Jn 3:16 4:2" or "4:2" -> chapter 4, verse 2
    let m2 = rightRaw.match(/^(\d+)\s*[: ,]\s*(\d+)$/);
    if (!right && m2) {
      right = { bookCode: lref.bookCode, chapter: +m2[1], verse: +m2[2] };
    }
    //  c) fully‑qualified right (maybe different book)
    if (!right) {
      const pr = parseSingle(rightRaw, opts);
      if (pr && "bookCode" in (pr as any)) right = pr as CanonicalRef;
    }
    if (!right) return undefined;

    return { start: lref, end: right, source: "range" };
  }

  return undefined;
}

/* ========================= Internal Parser ========================= */
function parseReferencesInternal(input: string, opts: ParseOptions = {}): ParsedPiece[] {
  if (!input || !input.trim()) return [];
  const pieces = splitMulti(input);
  const out: ParsedPiece[] = [];
  for (const raw of pieces) {
    const p = parseSingle(raw, opts);
    if (!p) continue;
    // If it's following (f/ff) and expansion requested, expand now
    if (typeof (p as any).start !== "undefined" && (p as CanonicalRange).source === "following" && opts.expandFollowing && opts.getVerseCount) {
      const rng = p as CanonicalRange;
      const { start } = rng;
      // 'f' or 'ff' is not carried now; we treat single 'f' as +1 verse, 'ff' (if present) as end of chapter.
      // We can't detect single vs double f here because SINGLE_RE/COMPACT_RE already folded it; to keep behavior practical:
      //  - expand to end of chapter (common expectation for ff); for single f, callers may prefer expandFollowing=false if they only want +1.
      const max = opts.getVerseCount(start.bookCode, start.chapter);
      if (max) rng.end = { ...start, verse: max };
    }
    out.push(p);
  }

  // Optionally expand ranges to individual refs
  if (opts.expandRangesToKeys && opts.getVerseCount) {
    const exploded: ParsedPiece[] = [];
    for (const item of out) {
      if ("bookCode" in (item as any)) { exploded.push(item); continue; }
      const r = item as CanonicalRange;
      if (r.start.bookCode !== r.end.bookCode) { exploded.push(r); continue; } // cross‑book: leave as range
      if (r.start.chapter === r.end.chapter) {
        for (let v = r.start.verse; v <= r.end.verse; v++) exploded.push({ ...r.start, verse: v });
      } else {
        // span chapters: finish start chapter
        const maxStart = opts.getVerseCount(r.start.bookCode, r.start.chapter) || r.start.verse;
        for (let v = r.start.verse; v <= maxStart; v++) exploded.push({ ...r.start, verse: v });
        // mid chapters
        for (let c = r.start.chapter + 1; c < r.end.chapter; c++) {
          const max = opts.getVerseCount(r.start.bookCode, c) || 0;
          for (let v = 1; v <= max; v++) exploded.push({ bookCode: r.start.bookCode, chapter: c, verse: v });
        }
        // last chapter
        for (let v = 1; v <= r.end.verse; v++) exploded.push({ bookCode: r.start.bookCode, chapter: r.end.chapter, verse: v });
      }
    }
    return exploded;
  }

  return out;
}

/* ========================= Multi-Candidate Parser ========================= */
export function parseCandidates(raw: string): Candidate[] {
  const candidates: Candidate[] = [];
  const seen = new Set<string>();
  
  // Pre-process: Split compact book+digit patterns (jn11 → jn 11, jn1 → jn 1)
  // This must happen BEFORE tokenization
  let processedInput = raw.trim();
  
  // Pre-process ONLY when there's a trailing space+digits segment
  // This handles "jn11 1" and "jn1 11" without breaking "jn316"
  // Use non-greedy \d*? to prefer matching fewer digits in group 1
  const compactBookMatch = processedInput.match(/^([a-z]+\d*?)(\d+)(\s+\d+)$/i);
  if (compactBookMatch) {
    const potentialBook = compactBookMatch[1]; // e.g., "jn", "jn1", "1jn"
    const firstDigits = compactBookMatch[2]; // e.g., "11", "1"
    const remainingDigits = compactBookMatch[3] || ""; // e.g., " 1", " 11", or ""
    
    // Try increasingly shorter prefixes as book codes
    for (let i = potentialBook.length; i >= 1; i--) {
      const testBook = potentialBook.slice(0, i);
      const testDigits = potentialBook.slice(i) + firstDigits;
      
      if (lookupBookCode(testBook, false)) {
        // Found a valid book! Reconstruct with proper spacing
        processedInput = testBook + " " + testDigits + remainingDigits;
        break;
      }
    }
  }
  
  // Now proceed with normal tokenization using processedInput instead of raw
  const rawTokens = processedInput.split(/\s+/);
  
  // Helper to add unique candidates
  const addCandidate = (ref: CanonicalRef, reason: CandidateReason, conf: number) => {
    const key = formatKey(ref);
    if (seen.has(key)) return;
    
    // Validate using VERSE_COUNTS_BY_CHAPTER
    const displayCode = INTERNAL_TO_DISPLAY[ref.bookCode];
    const counts = VERSE_COUNTS_BY_CHAPTER[displayCode];
    if (!counts || ref.chapter < 1 || ref.chapter > counts.length) return;
    if (ref.verse < 1 || ref.verse > counts[ref.chapter - 1]) return;
    
    candidates.push({ key, ref, reason, confidence: conf });
    seen.add(key);
  };

  // 1. SPACE-DELIMITED: "book ch v" (e.g., "jn 1 11" or "jn 11 1")
  if (rawTokens.length === 3 && /^\d+$/.test(rawTokens[1]) && /^\d+$/.test(rawTokens[2])) {
    const bookCode = lookupBookCode(rawTokens[0], false);
    if (bookCode) {
      const ch = parseInt(rawTokens[1], 10);
      const v = parseInt(rawTokens[2], 10);
      addCandidate({ bookCode, chapter: ch, verse: v }, "space-primary", 1.0);
      
      // Also try compact split of first number if ch >= 10
      if (ch >= 10) {
        const ch1 = Math.floor(ch / 10);
        const v1 = ch % 10;
        if (ch1 >= 1 && v1 >= 1) {
          addCandidate({ bookCode, chapter: ch1, verse: v1 }, "space-alt", 0.6);
        }
      }
    }
    return candidates.sort((a,b) => b.confidence - a.confidence);
  }
  
  // 2. SPACE-DELIMITED: "book ch" (chapter-only, e.g., "jn 11")
  if (rawTokens.length === 2 && /^\d+$/.test(rawTokens[1])) {
    const bookCode = lookupBookCode(rawTokens[0], false);
    if (bookCode) {
      const ch = parseInt(rawTokens[1], 10);
      addCandidate({ bookCode, chapter: ch, verse: 1 }, "chapter-only", 0.95);
      // Also add book 1:1 as alternate
      addCandidate({ bookCode, chapter: 1, verse: 1 }, "alt-inference", 0.55);
    }
    return candidates.sort((a,b) => b.confidence - a.confidence);
  }
  
  // 3. COMPACT CHAPTER-ONLY: "bookXX" where XX = chapter only (e.g., "jn11")
  //    This must come BEFORE general compact splits to get correct confidence
  const compactChapterMatch = raw.trim().match(/^([a-z\d\s]+?)(\d{1,3})$/i);
  if (compactChapterMatch && rawTokens.length === 1) {
    const bookPart = compactChapterMatch[1].trim();
    const digits = compactChapterMatch[2];
    const bookCode = lookupBookCode(bookPart, false);
    
    if (bookCode) {
      const chOnly = parseInt(digits, 10);
      
      // Check if this is a valid chapter (not trying all splits yet)
      const displayCode = INTERNAL_TO_DISPLAY[bookCode];
      const counts = VERSE_COUNTS_BY_CHAPTER[displayCode];
      
      if (counts && chOnly >= 1 && chOnly <= counts.length) {
        // Valid as chapter-only! Use chapter-only confidence
        addCandidate({ bookCode, chapter: chOnly, verse: 1 }, "chapter-only", 0.95);
        // Also add book 1:1 as alternate
        addCandidate({ bookCode, chapter: 1, verse: 1 }, "alt-inference", 0.55);
        
        // Also try split interpretations if digits allow (for "jn11" → "John 1:11" alternate)
        // But only if digits length > 1
        if (digits.length > 1) {
          for (let splitPos = 1; splitPos < digits.length; splitPos++) {
            const ch = parseInt(digits.slice(0, splitPos), 10);
            const v = parseInt(digits.slice(splitPos), 10);
            const confidence = digits.length >= 3 && splitPos === 1 ? 0.85 : 0.8;
            addCandidate({ bookCode, chapter: ch, verse: v }, "compact", confidence);
          }
        }
        
        return candidates.sort((a,b) => b.confidence - a.confidence);
      }
    }
  }
  
  // 4. For everything else, normalize and continue with existing logic
  const normalized = normalizeSpaceDelimitedDigits(raw.trim());
  
  // 5. COMPACT WITH SPLITS: "bookXXX" where XXX requires splitting (e.g., "jn111")
  //    Only reach here if chapter-only didn't match
  const compactMatch = normalized.match(/^([a-z\d\s]+?)(\d+)$/i);
  if (compactMatch) {
    const bookPart = compactMatch[1].trim();
    const digits = compactMatch[2];
    const bookCode = lookupBookCode(bookPart, false);
    
    if (bookCode) {
      // Try chapter-only first
      const chOnly = parseInt(digits, 10);
      addCandidate({ bookCode, chapter: chOnly, verse: 1 }, "compact", 0.7);
      
      // Try all possible chapter:verse splits
      for (let splitPos = 1; splitPos < digits.length; splitPos++) {
        const ch = parseInt(digits.slice(0, splitPos), 10);
        const v = parseInt(digits.slice(splitPos), 10);
        // Bias early split slightly higher for 3+ digit inputs
        const confidence = digits.length >= 3 && splitPos === 1 ? 0.85 : 0.8;
        addCandidate({ bookCode, chapter: ch, verse: v }, "compact", confidence);
      }
    }
    return candidates.sort((a,b) => b.confidence - a.confidence);
  }
  
  // 5. Fallback to existing parseReferencesInternal logic for other formats
  try {
    const pieces = parseReferencesInternal(raw, { expandRangesToKeys: false });
    if (pieces.length > 0) {
      const first = pieces[0];
      if ('bookCode' in first) {
        addCandidate(first, "space-primary", 0.9);
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  return candidates.sort((a,b) => b.confidence - a.confidence);
}

/* ========================= Public API ========================= */
// Keep existing function signature, but use parseCandidates internally for backward compatibility
export function parseReferences(
  input: string,
  opts: ParseOptions = {}
): ParsedPiece[] {
  const candidates = parseCandidates(input);
  if (candidates.length === 0) return [];
  
  // Return first (highest confidence) candidate's ref
  return [candidates[0].ref];
}

/* Utility: format any parsed output as canonical keys */
export function toKeys(parsed: ParsedPiece | ParsedPiece[], opts: ParseOptions = {}): string[] {
  const list = Array.isArray(parsed) ? parsed : [parsed];
  const out: string[] = [];
  for (const p of list) {
    if ("bookCode" in (p as any)) {
      out.push(formatKey(p as CanonicalRef, { includeVersePartInKey: opts.includeVersePartInKey }));
    } else {
      const r = p as CanonicalRange;
      if (opts.expandRangesToKeys && opts.getVerseCount) {
        out.push(...toKeys(parseReferences("", { ...opts, expandRangesToKeys: true }))); // not used; we expand earlier
      } else {
        // When NOT expanding ranges, return only the start key
        const a = formatKey(r.start, { includeVersePartInKey: opts.includeVersePartInKey });
        out.push(a);
      }
    }
  }
  return out;
}

/* ========================= getVerseCount Implementation ========================= */
// Production-ready getVerseCount implementation with async probe + memoization
type GetVerseCountAsync = (book: BookCode, chapter: number) => Promise<number | undefined>;

export function createGetVerseCount(keyExists: (key: string) => Promise<boolean>) {
  const cache = new Map<string, number>();
  
  const getVerseCountAsync: GetVerseCountAsync = async (book: BookCode, chapter: number) => {
    const cacheKey = `${book}.${chapter}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    
    // Fast exponential search then binary search using canonical keys
    const bookTag = CANONICAL_BOOK_TAG[book];
    
    // Start with exponential search to find upper bound
    let max = 1;
    while (await keyExists(`${bookTag}.${chapter}:${max}`)) {
      max *= 2;
    }
    
    // Binary search between max/2 and max
    let low = Math.floor(max / 2);
    let high = max;
    let result = 0;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (await keyExists(`${bookTag}.${chapter}:${mid}`)) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    
    cache.set(cacheKey, result);
    return result || undefined;
  };
  
  // Synchronous wrapper that returns cached values
  const getVerseCount: GetVerseCount = (book: BookCode, chapter: number) => {
    const cacheKey = `${book}.${chapter}`;
    return cache.get(cacheKey);
  };
  
  // Pre-warm specific chapters
  const warmChapter = async (book: BookCode, chapter: number) => {
    await getVerseCountAsync(book, chapter);
  };
  
  const warmChapters = async (chapters: Array<{ book: BookCode; chapter: number }>) => {
    await Promise.all(chapters.map(({ book, chapter }) => warmChapter(book, chapter)));
  };
  
  return {
    getVerseCount,
    getVerseCountAsync,
    warmChapter,
    warmChapters
  };
}