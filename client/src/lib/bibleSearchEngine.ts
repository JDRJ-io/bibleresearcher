// Intelligent Bible Search Engine with comprehensive book abbreviation support
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

// Comprehensive Bible book abbreviations mapping based on all standard citation styles
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

// Parse various verse reference formats with comprehensive support for all abbreviation styles
export function parseVerseReference(input: string): {
  book?: string;
  chapter?: number;
  verse?: number;
  endVerse?: number;
  confidence: number;
} | null {
  const normalized = input.toLowerCase().trim();
  
  // Remove common punctuation and normalize spacing
  const cleaned = normalized.replace(/[.,;]/g, '').replace(/\s+/g, ' ');
  
  // Pattern 1: Full reference with verse - handles all formats from the mapping
  // Examples: "John 3:16", "Jn 3:16", "jn3:16", "Gen.1:1", "Gen 1.1", "1 Sam 1:1", etc.
  let match = cleaned.match(/^(\d?\s*\w+(?:\s+\w+)?)\s*(\d+)[:\.](\d+)(?:[-–](\d+))?$/);
  if (match) {
    const [, bookPart, chapterStr, verseStr, endVerseStr] = match;
    
    // Try multiple ways to match the book (case-insensitive)
    const bookVariants = [
      bookPart.trim().toLowerCase(),
      bookPart.replace(/\s/g, '').toLowerCase(),
      bookPart.replace(/\s+/g, ' ').trim().toLowerCase()
    ];
    
    let book = null;
    for (const variant of bookVariants) {
      book = ABBREVIATION_TO_BOOK[variant];
      if (book) break;
    }
    
    if (book) {
      return {
        book,
        chapter: parseInt(chapterStr),
        verse: parseInt(verseStr),
        endVerse: endVerseStr ? parseInt(endVerseStr) : undefined,
        confidence: 0.95
      };
    }
  }
  
  // Pattern 2: Dot notation - "Gen.1:1", "John.3:16"
  match = cleaned.match(/^(\d?\s*\w+(?:\s+\w+)?)\.(\d+):(\d+)(?:[-–](\d+))?$/);
  if (match) {
    const [, bookPart, chapterStr, verseStr, endVerseStr] = match;
    const book = ABBREVIATION_TO_BOOK[bookPart.replace(/\s/g, '').toLowerCase()] || ABBREVIATION_TO_BOOK[bookPart.trim().toLowerCase()];
    if (book) {
      return {
        book,
        chapter: parseInt(chapterStr),
        verse: parseInt(verseStr),
        endVerse: endVerseStr ? parseInt(endVerseStr) : undefined,
        confidence: 0.95
      };
    }
  }
  
  // Pattern 3: Chapter only - "Genesis 1", "Gen 1", "Ps 23"
  match = cleaned.match(/^(\d?\s*\w+(?:\s+\w+)?)\s+(\d+)$/);
  if (match) {
    const [, bookPart, chapterStr] = match;
    const bookVariants = [
      bookPart.trim().toLowerCase(),
      bookPart.replace(/\s/g, '').toLowerCase(),
      bookPart.replace(/\s+/g, ' ').trim().toLowerCase()
    ];
    
    let book = null;
    for (const variant of bookVariants) {
      book = ABBREVIATION_TO_BOOK[variant];
      if (book) break;
    }
    
    if (book) {
      return {
        book,
        chapter: parseInt(chapterStr),
        confidence: 0.8
      };
    }
  }
  
  // Pattern 4: Book name only - "Genesis", "Gen", "1 Samuel", etc.
  const bookVariants = [
    cleaned.trim().toLowerCase(),
    cleaned.replace(/\s/g, '').toLowerCase(),
    cleaned.replace(/\s+/g, ' ').trim().toLowerCase()
  ];
  
  for (const variant of bookVariants) {
    const book = ABBREVIATION_TO_BOOK[variant];
    if (book) {
      return {
        book,
        confidence: 0.6
      };
    }
  }
  
  return null;
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

// Main search engine
export class BibleSearchEngine {
  private verses: any[] = [];
  private verseMap = new Map<string, number>();
  
  constructor(verses: any[]) {
    this.verses = verses;
    this.buildVerseMap();
  }
  
  private buildVerseMap() {
    this.verses.forEach((verse, index) => {
      // STRAIGHT-LINE: Assume verses are in dot format, store directly
      this.verseMap.set(verse.reference, index);
      
      // ONLY for search flexibility: also allow space format input
      const ref = verse.reference;
      if (ref.includes('.')) {
        this.verseMap.set(ref.replace(/\./g, ' '), index);
      }
    });
  }
  
  search(query: string, translationCode: string = 'KJV', maxResults: number = 100, searchAllTranslations: boolean = false): SearchResult[] {
    const results: SearchResult[] = [];
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return results;
    
    // Try to parse as verse reference first
    const parsedRef = parseVerseReference(normalizedQuery);
    if (parsedRef && parsedRef.confidence > 0.5) {
      const refResults = this.searchByReference(parsedRef, translationCode);
      results.push(...refResults);
    }
    
    // If not a high-confidence reference match, search text content
    if (!parsedRef || parsedRef.confidence < 0.9) {
      if (searchAllTranslations) {
        const multiResults = this.searchByTextAllTranslations(normalizedQuery, maxResults - results.length);
        results.push(...multiResults);
      } else {
        const textResults = this.searchByText(normalizedQuery, translationCode, maxResults - results.length);
        results.push(...textResults);
      }
    }
    
    // Sort by confidence, then by verse order
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
    const { book, chapter, verse, endVerse } = parsed;
    
    const bookRef = canonicalToReference(book!);
    
    if (verse) {
      // Specific verse or verse range
      const startRef = `${bookRef}.${chapter}:${verse}`;
      const endRef = endVerse ? `${bookRef}.${chapter}:${endVerse}` : startRef;
      
      for (let v = verse; v <= (endVerse || verse); v++) {
        const ref = `${bookRef}.${chapter}:${v}`;
        const index = this.verseMap.get(ref);
        if (index !== undefined) {
          const verseData = this.verses[index];
          const text = verseData.text?.[translationCode] || '';
          
          results.push({
            verseId: verseData.id,
            reference: ref,
            text,
            index,
            highlightedText: text,
            type: 'reference',
            confidence: 0.98
          });
        }
      }
    } else if (chapter) {
      // Whole chapter
      const chapterPattern = `${bookRef}.${chapter}:`;
      this.verses.forEach((verseData, index) => {
        if (verseData.reference.startsWith(chapterPattern)) {
          const text = verseData.text?.[translationCode] || '';
          results.push({
            verseId: verseData.id,
            reference: verseData.reference,
            text,
            index,
            highlightedText: text,
            type: 'reference',
            confidence: 0.85
          });
        }
      });
    } else {
      // Whole book
      this.verses.forEach((verseData, index) => {
        if (verseData.reference.startsWith(bookRef + '.')) {
          const text = verseData.text?.[translationCode] || '';
          results.push({
            verseId: verseData.id,
            reference: verseData.reference,
            text,
            index,
            highlightedText: text,
            type: 'reference',
            confidence: 0.7
          });
        }
      });
    }
    
    return results;
  }
  
  private searchByText(query: string, translationCode: string, maxResults: number): SearchResult[] {
    const results: SearchResult[] = [];
    const words = query.split(/\s+/).filter(w => w.length > 0);
    
    console.log(`🔍 searchByText: query="${query}", translationCode="${translationCode}", maxResults=${maxResults}`);
    console.log(`🔍 searchByText: verses count=${this.verses.length}`);
    
    this.verses.forEach((verseData, index) => {
      const text = verseData.text?.[translationCode] || '';
      const lowerText = text.toLowerCase();
      
      if (index < 3) {
        console.log(`🔍 searchByText sample verse ${index}:`, {
          reference: verseData.reference,
          text: text?.substring(0, 50) + '...',
          textLength: text?.length,
          hasTranslation: !!text
        });
      }
      
      // Calculate relevance score
      let score = 0;
      let highlightedText = text;
      
      // Exact phrase match gets highest score
      if (lowerText.includes(query)) {
        score += 10;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
      } else {
        // Individual word matches
        words.forEach(word => {
          if (lowerText.includes(word)) {
            score += 1;
            const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
          }
        });
      }
      
      if (score > 0) {
        results.push({
          verseId: verseData.id,
          reference: verseData.reference,
          text,
          index,
          highlightedText,
          type: 'text',
          confidence: Math.min(score / 10, 0.6), // Text search max confidence is 0.6
          translationCode
        });
      }
    });
    
    return results.slice(0, maxResults);
  }

  private searchByTextAllTranslations(query: string, maxResults: number): SearchResult[] {
    const results: SearchResult[] = [];
    const words = query.split(/\s+/).filter(w => w.length > 0);
    const translationCodes = ['KJV', 'ESV', 'NIV', 'NLT', 'NASB', 'CSB', 'AMP', 'BSB', 'WEB', 'YLT', 'LSB', 'NKJV'];
    
    this.verses.forEach((verseData, index) => {
      const translationResults: Array<{translation: string, text: string, score: number, highlightedText: string}> = [];
      
      // Search each available translation for this verse
      translationCodes.forEach(tCode => {
        const text = verseData.text?.[tCode] || '';
        if (!text) return;
        
        const lowerText = text.toLowerCase();
        let score = 0;
        let highlightedText = text;
        
        // Exact phrase match gets highest score
        if (lowerText.includes(query)) {
          score += 10;
          const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          highlightedText = text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
        } else {
          // Individual word matches
          words.forEach(word => {
            if (lowerText.includes(word)) {
              score += 1;
              const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
              highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
            }
          });
        }
        
        if (score > 0) {
          translationResults.push({
            translation: tCode,
            text,
            score,
            highlightedText
          });
        }
      });
      
      // Add results for each translation that matched
      translationResults.forEach(result => {
        results.push({
          verseId: verseData.id,
          reference: verseData.reference,
          text: result.text,
          index,
          highlightedText: result.highlightedText,
          type: 'text',
          confidence: Math.min(result.score / 10, 0.6),
          translationCode: result.translation
        });
      });
    });
    
    return results
      .sort((a, b) => {
        // Sort by confidence first, then by verse order, then group same verses together
        if (a.confidence !== b.confidence) return b.confidence - a.confidence;
        if (a.index !== b.index) return a.index - b.index;
        return a.translationCode!.localeCompare(b.translationCode!);
      })
      .slice(0, maxResults);
  }
}