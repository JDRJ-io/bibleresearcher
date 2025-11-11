// Intelligent Bible Search Engine with comprehensive book abbreviation support
import { parseReferences, toKeys } from './bible-reference-parser';
import { createBibleVerseCounter } from './verse-count-helper';
import { stripUserMarkup, highlightPlainText } from './utils/textSanitize';

export interface SearchResult {
  verseId: string;
  reference: string;
  text: string;
  index: number;
  highlightedText: string;
  type: 'verse' | 'reference' | 'text';
  confidence: number;
  translationCode?: string;
}

// Legacy book mapping (kept for compatibility) - replaced by bible-reference-parser
const BIBLE_BOOKS = {
  // Old Testament (39 books) - includes all variations from the mapping document
  'gen': ['genesis', 'gen', 'ge', 'gn', 'gen.', 'gen1', 'gen1:1'],
  'exo': ['exodus', 'exod', 'exo', 'ex', 'exod.', 'exod1', 'exod1:1'],
  'lev': ['leviticus', 'lev', 'le', 'lv', 'lev.', 'lev1', 'lev1:1'],
  'num': ['numbers', 'num', 'nu', 'nm', 'nb', 'num.', 'num1', 'num1:1'],
  'deu': ['deuteronomy', 'deut', 'deu', 'dt', 'deut.', 'deut1', 'deut1:1'],
  'jos': ['joshua', 'josh', 'jos', 'josh.', 'josh1', 'josh1:1'],
  'jdg': ['judges', 'judg', 'jdg', 'jg', 'jgs', 'judg.', 'judg1', 'judg1:1'],
  'rut': ['ruth', 'ruth', 'rut', 'ru', 'ruth1', 'ruth1:1'],
  '1sa': ['1samuel', '1 sam', '1sam', '1sa', '1 sa', '1 sam.', '1sam1', '1sam1:1', 'i samuel', 'first samuel'],
  '2sa': ['2samuel', '2 sam', '2sam', '2sa', '2 sa', '2 sam.', '2sam1', '2sam1:1', 'ii samuel', 'second samuel'],
  '1ki': ['1kings', '1 kings', '1ki', '1 ki', '1kgs', '1 kgs', '1 kings.', '1kings1', '1kings1:1', 'i kings', 'first kings'],
  '2ki': ['2kings', '2 kings', '2ki', '2 ki', '2kgs', '2 kgs', '2 kings.', '2kings1', '2kings1:1', 'ii kings', 'second kings'],
  '1ch': ['1chronicles', '1 chron', '1chron', '1ch', '1 ch', '1chr', '1 chr', '1 chron.', '1chr1', '1chr1:1', 'i chronicles', 'first chronicles'],
  '2ch': ['2chronicles', '2 chron', '2chron', '2ch', '2 ch', '2chr', '2 chr', '2 chron.', '2chr1', '2chr1:1', 'ii chronicles', 'second chronicles'],
  'ezr': ['ezra', 'ezra', 'ezr', 'ez', 'ezra1', 'ezra1:1'],
  'neh': ['nehemiah', 'neh', 'ne', 'neh.', 'neh1', 'neh1:1'],
  'est': ['esther', 'est', 'es', 'esth', 'est.', 'est1', 'est1:1'],
  'job': ['job', 'job', 'jb', 'job1', 'job1:1'],
  'psa': ['psalms', 'ps', 'psa', 'psalm', 'psalms', 'pss', 'ps.', 'ps1', 'ps1:1'],
  'pro': ['proverbs', 'prov', 'pro', 'pr', 'prv', 'prov.', 'prov1', 'prov1:1'],
  'ecc': ['ecclesiastes', 'eccles', 'ecc', 'ec', 'eccl', 'eccles.', 'eccles1', 'eccles1:1'],
  'sng': ['songofsolomon', 'song', 'sng', 'ss', 'sol', 'sos', 'song of solomon', 'song of songs', 'canticles', 'song1', 'song1:1'],
  'isa': ['isaiah', 'isa', 'is', 'isa.', 'isa1', 'isa1:1'],
  'jer': ['jeremiah', 'jer', 'je', 'jer.', 'jer1', 'jer1:1'],
  'lam': ['lamentations', 'lam', 'la', 'lam.', 'lam1', 'lam1:1'],
  'ezk': ['ezekiel', 'ezek', 'eze', 'ek', 'ezk', 'ezek.', 'ezek1', 'ezek1:1'],
  'dan': ['daniel', 'dan', 'da', 'dn', 'dan.', 'dan1', 'dan1:1'],
  'hos': ['hosea', 'hos', 'ho', 'hos.', 'hos1', 'hos1:1'],
  'jol': ['joel', 'joel', 'joe', 'jl', 'joel1', 'joel1:1'],
  'amo': ['amos', 'amos', 'amo', 'am', 'amos1', 'amos1:1'],
  'oba': ['obadiah', 'obad', 'oba', 'ob', 'obad.', 'obad1', 'obad1:1'],
  'jon': ['jonah', 'jon', 'jnh', 'jon.', 'jon1', 'jon1:1'],
  'mic': ['micah', 'mic', 'mi', 'mic.', 'mic1', 'mic1:1'],
  'nam': ['nahum', 'nah', 'nam', 'na', 'nah.', 'nah1', 'nah1:1'],
  'hab': ['habakkuk', 'hab', 'hb', 'hab.', 'hab1', 'hab1:1'],
  'zep': ['zephaniah', 'zeph', 'zep', 'zp', 'zeph.', 'zeph1', 'zeph1:1'],
  'hag': ['haggai', 'hag', 'hg', 'hag.', 'hag1', 'hag1:1'],
  'zec': ['zechariah', 'zech', 'zec', 'zc', 'zech.', 'zech1', 'zech1:1'],
  'mal': ['malachi', 'mal', 'ml', 'mal.', 'mal1', 'mal1:1'],
  
  // New Testament (27 books) - includes all variations from the mapping document
  'mat': ['matthew', 'matt', 'mat', 'mt', 'matt.', 'matt1', 'matt1:1'],
  'mrk': ['mark', 'mk', 'mar', 'mrk', 'mk.', 'mk1', 'mk1:1'],
  'luk': ['luke', 'lk', 'luk', 'lk.', 'lk1', 'lk1:1'],
  'jhn': ['john', 'jn', 'joh', 'jhn', 'jn.', 'jn1', 'jn1:1'],
  'act': ['acts', 'acts', 'act', 'ac', 'acts1', 'acts1:1'],
  'rom': ['romans', 'rom', 'ro', 'rm', 'rom.', 'rom1', 'rom1:1'],
  '1co': ['1corinthians', '1 cor', '1cor', '1co', '1 co', '1 cor.', '1cor1', '1cor1:1', 'i corinthians', 'first corinthians'],
  '2co': ['2corinthians', '2 cor', '2cor', '2co', '2 co', '2 cor.', '2cor1', '2cor1:1', 'ii corinthians', 'second corinthians'],
  'gal': ['galatians', 'gal', 'ga', 'gal.', 'gal1', 'gal1:1'],
  'eph': ['ephesians', 'eph', 'eph.', 'eph1', 'eph1:1'],
  'php': ['philippians', 'phil', 'phi', 'php', 'phil.', 'phil1', 'phil1:1'],
  'col': ['colossians', 'col', 'col.', 'col1', 'col1:1'],
  '1th': ['1thessalonians', '1 thess', '1thess', '1th', '1 th', '1 thess.', '1th1', '1th1:1', 'i thessalonians', 'first thessalonians'],
  '2th': ['2thessalonians', '2 thess', '2thess', '2th', '2 th', '2 thess.', '2th1', '2th1:1', 'ii thessalonians', 'second thessalonians'],
  '1ti': ['1timothy', '1 tim', '1tim', '1ti', '1 ti', '1 tim.', '1ti1', '1ti1:1', 'i timothy', 'first timothy'],
  '2ti': ['2timothy', '2 tim', '2tim', '2ti', '2 ti', '2 tim.', '2ti1', '2ti1:1', 'ii timothy', 'second timothy'],
  'tit': ['titus', 'tit', 'ti', 'tit.', 'tit1', 'tit1:1'],
  'phm': ['philemon', 'philem', 'phm', 'pm', 'philem.', 'philem1', 'philem1:1'],
  'heb': ['hebrews', 'heb', 'he', 'heb.', 'heb1', 'heb1:1'],
  'jas': ['james', 'jas', 'jm', 'jas.', 'jas1', 'jas1:1'],
  '1pe': ['1peter', '1 pet', '1pet', '1pe', '1 pe', '1 pet.', '1pe1', '1pe1:1', 'i peter', 'first peter'],
  '2pe': ['2peter', '2 pet', '2pet', '2pe', '2 pe', '2 pet.', '2pe1', '2pe1:1', 'ii peter', 'second peter'],
  '1jn': ['1john', '1 jn', '1jn', '1jo', '1 jo', '1 jn.', '1jn1', '1jn1:1', 'i john', 'first john'],
  '2jn': ['2john', '2 jn', '2jn', '2jo', '2 jo', '2 jn.', '2jn1', '2jn1:1', 'ii john', 'second john'],
  '3jn': ['3john', '3 jn', '3jn', '3jo', '3 jo', '3 jn.', '3jn1', '3jn1:1', 'iii john', 'third john'],
  'jud': ['jude', 'jude', 'jud', 'jude1', 'jude1:1'],
  'rev': ['revelation', 'rev', 're', 'rv', 'revelation', 'revelations', 'rev.', 'rev1', 'rev1:1']
};

// Create reverse lookup map for fast searching - maps all abbreviations to canonical form
const ABBREVIATION_TO_BOOK: Record<string, string> = {};
Object.entries(BIBLE_BOOKS).forEach(([canonical, abbreviations]) => {
  // Add the canonical form itself
  ABBREVIATION_TO_BOOK[canonical.toLowerCase()] = canonical;
  // Add all abbreviations
  abbreviations.forEach(abbrev => {
    ABBREVIATION_TO_BOOK[abbrev.toLowerCase().replace(/\s+/g, '')] = canonical;
    // Also add version with spaces preserved for phrases like "1 sam"
    ABBREVIATION_TO_BOOK[abbrev.toLowerCase()] = canonical;
  });
});

// Enhanced verse reference parsing using the advanced bible-reference-parser
export function parseVerseReference(input: string): {
  book?: string;
  chapter?: number;
  verse?: number;
  endVerse?: number;
  confidence: number;
  references?: string[];
} | null {
  if (!input?.trim()) return null;
  
  try {
    // Use the advanced bible-reference-parser
    const parsed = parseReferences(input.trim());
    
    if (parsed.length === 0) return null;
    
    // Convert parsed results to verse keys
    const keys = toKeys(parsed);
    
    if (keys.length === 0) return null;
    
    // For single reference, extract book/chapter/verse details
    if (parsed.length === 1) {
      const piece = parsed[0];
      
      if ('bookCode' in piece) {
        // Single verse reference
        const ref = piece as any;
        return {
          book: ref.bookCode.toLowerCase(),
          chapter: ref.chapter,
          verse: ref.verse,
          confidence: 0.95,
          references: keys
        };
      } else {
        // Range reference
        const range = piece as any;
        const startRef = range.start;
        const endRef = range.end;
        
        // If same chapter, return start verse and end verse
        if (startRef.bookCode === endRef.bookCode && startRef.chapter === endRef.chapter) {
          return {
            book: startRef.bookCode.toLowerCase(),
            chapter: startRef.chapter,
            verse: startRef.verse,
            endVerse: endRef.verse,
            confidence: 0.95,
            references: keys
          };
        } else {
          // Cross-chapter range, return as general reference
          return {
            book: startRef.bookCode.toLowerCase(),
            chapter: startRef.chapter,
            confidence: 0.9,
            references: keys
          };
        }
      }
    }
    
    // Multiple references, return the first one as primary
    const firstPiece = parsed[0];
    if ('bookCode' in firstPiece) {
      const ref = firstPiece as any;
      return {
        book: ref.bookCode.toLowerCase(),
        chapter: ref.chapter,
        verse: ref.verse,
        confidence: 0.85,
        references: keys
      };
    }
    
    return {
      confidence: 0.8,
      references: keys
    };
  } catch (error) {
    console.warn('Failed to parse verse reference:', error);
    return null;
  }
}

// Convert canonical book name to the exact format used in verse keys  
export function canonicalToReference(canonical: string): string {
  // Map canonical abbreviations to the exact format used in actual verse keys
  const canonicalToVerseFormat: Record<string, string> = {
    'gen': 'Gen',
    'exo': 'Exod',
    'lev': 'Lev',
    'num': 'Num',
    'deu': 'Deut',
    'jos': 'Josh',
    'jdg': 'Judg',
    'rut': 'Ruth',
    '1sa': '1Sam',
    '2sa': '2Sam',
    '1ki': '1Kgs',
    '2ki': '2Kgs',
    '1ch': '1Chr',
    '2ch': '2Chr',
    'ezr': 'Ezra',
    'neh': 'Neh',
    'est': 'Esth',
    'job': 'Job',
    'psa': 'Ps',
    'pro': 'Prov',
    'ecc': 'Eccl',
    'sng': 'Song',
    'isa': 'Isa',
    'jer': 'Jer',
    'lam': 'Lam',
    'ezk': 'Ezek',
    'dan': 'Dan',
    'hos': 'Hos',
    'jol': 'Joel',
    'amo': 'Amos',
    'oba': 'Obad',
    'jon': 'Jonah',
    'mic': 'Mic',
    'nam': 'Nah',
    'hab': 'Hab',
    'zep': 'Zeph',
    'hag': 'Hag',
    'zec': 'Zech',
    'mal': 'Mal',
    'mat': 'Matt',
    'mrk': 'Mark',
    'luk': 'Luke',
    'jhn': 'John',
    'act': 'Acts',
    'rom': 'Rom',
    '1co': '1Cor',
    '2co': '2Cor',
    'gal': 'Gal',
    'eph': 'Eph',
    'php': 'Phil',
    'col': 'Col',
    '1th': '1Thess',
    '2th': '2Thess',
    '1ti': '1Tim',
    '2ti': '2Tim',
    'tit': 'Titus',
    'phm': 'Phlm',
    'heb': 'Heb',
    'jas': 'Jas',
    '1pe': '1Pet',
    '2pe': '2Pet',
    '1jn': '1John',
    '2jn': '2John',
    '3jn': '3John',
    'jud': 'Jude',
    'rev': 'Rev'
  };
  
  return canonicalToVerseFormat[canonical.toLowerCase()] || canonical;
}

import { buildVerseMap, safeLookup } from './verseMapConfig';

// Main search engine
export class BibleSearchEngine {
  private verses: any[] = [];
  private verseMap = new Map<string, number>();
  
  constructor(verses: any[]) {
    this.verses = verses;
    this.buildVerseMap();
  }
  
  private buildVerseMap() {
    this.verseMap = buildVerseMap(this.verses, { addLowercase: true });
  }
  
  search(query: string, translationCode: string = 'KJV', maxResults: number = 100, searchAllTranslations: boolean = false): SearchResult[] {
    const results: SearchResult[] = [];
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return results;
    
    const parsedRef = parseVerseReference(normalizedQuery);
    
    if (parsedRef && parsedRef.confidence > 0.5) {
      const refResults = this.searchByReference(parsedRef, translationCode);
      results.push(...refResults);
    }
    
    if (!parsedRef || parsedRef.confidence < 0.9) {
      if (searchAllTranslations) {
        const multiResults = this.searchByTextAllTranslations(normalizedQuery, maxResults - results.length);
        results.push(...multiResults);
      } else {
        const textResults = this.searchByText(normalizedQuery, translationCode, maxResults - results.length);
        results.push(...textResults);
      }
    }
    
    return results
      .sort((a, b) => {
        if (a.confidence !== b.confidence) return b.confidence - a.confidence;
        return a.index - b.index;
      })
      .slice(0, maxResults);
  }
  
  private searchByReference(parsed: ReturnType<typeof parseVerseReference>, translationCode: string): SearchResult[] {
    if (!parsed) return [];
    
    const results: SearchResult[] = [];
    const { book, chapter, verse, endVerse, references } = parsed;
    
    if (references && references.length > 0) {
      
      references.forEach(ref => {
        // Handle range references (format: "Gen.1:1–Gen.1:3")
        if (ref.includes('–')) {
          const [startRef, endRef] = ref.split('–');
          
          // Extract chapter and verse info from range
          const startMatch = startRef.match(/(.+)\.(\d+):(\d+)$/);
          const endMatch = endRef.match(/(.+)\.(\d+):(\d+)$/);
          
          if (startMatch && endMatch) {
            const [, startBook, startChapter, startVerse] = startMatch;
            const [, endBook, endChapter, endVerse] = endMatch;
            
            // Same chapter range - iterate through verses
            if (startBook === endBook && startChapter === endChapter) {
              for (let v = parseInt(startVerse); v <= parseInt(endVerse); v++) {
                const verseRef = `${startBook}.${startChapter}:${v}`;
                const index = safeLookup(this.verseMap, verseRef);
                if (index !== undefined) {
                  const verseData = this.verses[index];
                  const text = stripUserMarkup(verseData.text?.[translationCode] || '');
                  
                  results.push({
                    verseId: verseData.id,
                    reference: verseRef,
                    text,
                    index,
                    highlightedText: text,
                    type: 'reference',
                    confidence: 0.98,
                    translationCode
                  });
                }
              }
            } else {
              // Cross-chapter range - handle differently
              // For now, just add start and end verses
              [startRef, endRef].forEach(verseRef => {
                const index = safeLookup(this.verseMap, verseRef);
                if (index !== undefined) {
                  const verseData = this.verses[index];
                  const text = stripUserMarkup(verseData.text?.[translationCode] || '');
                  
                  results.push({
                    verseId: verseData.id,
                    reference: verseRef,
                    text,
                    index,
                    highlightedText: text,
                    type: 'reference',
                    confidence: 0.95,
                    translationCode
                  });
                }
              });
            }
          }
        } else {
          // Single verse reference
          const index = safeLookup(this.verseMap, ref);
          if (index !== undefined) {
            const verseData = this.verses[index];
            const text = stripUserMarkup(verseData.text?.[translationCode] || '');
            
            results.push({
              verseId: verseData.id,
              reference: ref,
              text,
              index,
              highlightedText: text,
              type: 'reference',
              confidence: 0.98,
              translationCode
            });
          }
        }
      });
      
      return results;
    }
    
    // Fallback to legacy behavior if no references array
    const bookRef = canonicalToReference(book!);
    
    if (verse) {
      // Specific verse or verse range
      for (let v = verse; v <= (endVerse || verse); v++) {
        const ref = `${bookRef}.${chapter}:${v}`;
        const index = safeLookup(this.verseMap, ref);
        if (index !== undefined) {
          const verseData = this.verses[index];
          const text = stripUserMarkup(verseData.text?.[translationCode] || '');
          
          results.push({
            verseId: verseData.id,
            reference: ref,
            text,
            index,
            highlightedText: text,
            type: 'reference',
            confidence: 0.98,
            translationCode
          });
        }
      }
    } else if (chapter) {
      // Whole chapter
      const chapterPattern = `${bookRef}.${chapter}:`;
      this.verses.forEach((verseData, index) => {
        if (verseData.reference.startsWith(chapterPattern)) {
          const text = stripUserMarkup(verseData.text?.[translationCode] || '');
          results.push({
            verseId: verseData.id,
            reference: verseData.reference,
            text,
            index,
            highlightedText: text,
            type: 'reference',
            confidence: 0.85,
            translationCode
          });
        }
      });
    } else {
      // Whole book
      this.verses.forEach((verseData, index) => {
        if (verseData.reference.startsWith(bookRef + '.')) {
          const text = stripUserMarkup(verseData.text?.[translationCode] || '');
          results.push({
            verseId: verseData.id,
            reference: verseData.reference,
            text,
            index,
            highlightedText: text,
            type: 'reference',
            confidence: 0.7,
            translationCode
          });
        }
      });
    }
    
    return results;
  }
  
  private searchByText(query: string, translationCode: string, maxResults: number): SearchResult[] {
    const results: SearchResult[] = [];
    const phrase = query.toLowerCase();
    const words = phrase.split(/\s+/).filter(Boolean);
    
    this.verses.forEach((verseData, index) => {
      const raw = verseData.text?.[translationCode] || '';
      const plain = stripUserMarkup(raw);
      const lc = plain.toLowerCase();
      
      let score = 0;
      if (lc.includes(phrase)) score += 10;
      else for (const w of words) if (lc.includes(w)) score += 1;
      
      if (score > 0) {
        results.push({
          verseId: verseData.id,
          reference: verseData.reference,
          text: plain,
          index,
          highlightedText: highlightPlainText(plain, phrase, words),
          type: 'text',
          confidence: Math.min(score / 10, 0.6),
          translationCode
        });
      }
    });
    
    return results.slice(0, maxResults);
  }

  private searchByTextAllTranslations(query: string, maxResults: number): SearchResult[] {
    const results: SearchResult[] = [];
    const words = query.split(/\s+/).filter(Boolean);
    const phrase = query.toLowerCase();
    const translationCodes = ['KJV', 'BSB', 'WEB', 'YLT'];
    
    this.verses.forEach((verseData, index) => {
      for (const tCode of translationCodes) {
        const raw = verseData.text?.[tCode] || '';
        if (!raw) continue;
        const plain = stripUserMarkup(raw);
        const lc = plain.toLowerCase();
        
        let score = 0;
        if (lc.includes(phrase)) score += 10;
        else for (const w of words) if (lc.includes(w)) score += 1;
        
        if (score > 0) {
          results.push({
            verseId: verseData.id,
            reference: verseData.reference,
            text: plain,
            index,
            highlightedText: highlightPlainText(plain, phrase, words),
            type: 'text',
            confidence: Math.min(score / 10, 0.6),
            translationCode: tCode
          });
        }
      }
    });
    
    return results
      .sort((a, b) => a.confidence !== b.confidence ? b.confidence - a.confidence : a.index - b.index || a.translationCode!.localeCompare(b.translationCode!))
      .slice(0, maxResults);
  }
}