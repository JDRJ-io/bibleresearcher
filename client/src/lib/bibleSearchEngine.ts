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

// Comprehensive Bible book abbreviations mapping
const BIBLE_BOOKS = {
  // Old Testament
  'genesis': ['gen', 'ge', 'gn', 'genesis'],
  'exodus': ['exo', 'ex', 'exod', 'exodus'],
  'leviticus': ['lev', 'le', 'lv', 'leviticus'],
  'numbers': ['num', 'nu', 'nm', 'nb', 'numbers'],
  'deuteronomy': ['deu', 'dt', 'deut', 'deuteronomy'],
  'joshua': ['jos', 'josh', 'joshua'],
  'judges': ['jdg', 'jg', 'jgs', 'judges'],
  'ruth': ['rut', 'ru', 'ruth'],
  '1samuel': ['1sa', '1 sa', '1sam', '1 sam', '1 samuel', 'i samuel', 'first samuel'],
  '2samuel': ['2sa', '2 sa', '2sam', '2 sam', '2 samuel', 'ii samuel', 'second samuel'],
  '1kings': ['1ki', '1 ki', '1kgs', '1 kgs', '1 kings', 'i kings', 'first kings'],
  '2kings': ['2ki', '2 ki', '2kgs', '2 kgs', '2 kings', 'ii kings', 'second kings'],
  '1chronicles': ['1ch', '1 ch', '1chr', '1 chr', '1 chronicles', 'i chronicles', 'first chronicles'],
  '2chronicles': ['2ch', '2 ch', '2chr', '2 chr', '2 chronicles', 'ii chronicles', 'second chronicles'],
  'ezra': ['ezr', 'ez', 'ezra'],
  'nehemiah': ['neh', 'ne', 'nehemiah'],
  'esther': ['est', 'es', 'esth', 'esther'],
  'job': ['job', 'jb'],
  'psalms': ['psa', 'ps', 'psalm', 'psalms', 'pss'],
  'proverbs': ['pro', 'pr', 'prov', 'proverbs'],
  'ecclesiastes': ['ecc', 'ec', 'eccl', 'ecclesiastes', 'eccles'],
  'songofsolomon': ['sng', 'ss', 'song', 'sol', 'sos', 'song of solomon', 'song of songs', 'canticles'],
  'isaiah': ['isa', 'is', 'isaiah'],
  'jeremiah': ['jer', 'je', 'jeremiah'],
  'lamentations': ['lam', 'la', 'lamentations'],
  'ezekiel': ['eze', 'ek', 'ezek', 'ezekiel'],
  'daniel': ['dan', 'da', 'dn', 'daniel'],
  'hosea': ['hos', 'ho', 'hosea'],
  'joel': ['joe', 'jl', 'joel'],
  'amos': ['amo', 'am', 'amos'],
  'obadiah': ['oba', 'ob', 'obad', 'obadiah'],
  'jonah': ['jon', 'jnh', 'jonah'],
  'micah': ['mic', 'mi', 'micah'],
  'nahum': ['nah', 'na', 'nahum'],
  'habakkuk': ['hab', 'hb', 'habakkuk'],
  'zephaniah': ['zep', 'zp', 'zeph', 'zephaniah'],
  'haggai': ['hag', 'hg', 'haggai'],
  'zechariah': ['zec', 'zc', 'zech', 'zechariah'],
  'malachi': ['mal', 'ml', 'malachi'],
  
  // New Testament
  'matthew': ['mat', 'mt', 'matt', 'matthew'],
  'mark': ['mar', 'mk', 'mark'],
  'luke': ['luk', 'lk', 'luke'],
  'john': ['joh', 'jn', 'john'],
  'acts': ['act', 'ac', 'acts'],
  'romans': ['rom', 'ro', 'rm', 'romans'],
  '1corinthians': ['1co', '1 co', '1cor', '1 cor', '1 corinthians', 'i corinthians', 'first corinthians'],
  '2corinthians': ['2co', '2 co', '2cor', '2 cor', '2 corinthians', 'ii corinthians', 'second corinthians'],
  'galatians': ['gal', 'ga', 'galatians'],
  'ephesians': ['eph', 'ephesians'],
  'philippians': ['phi', 'php', 'philippians'],
  'colossians': ['col', 'colossians'],
  '1thessalonians': ['1th', '1 th', '1thess', '1 thess', '1 thessalonians', 'i thessalonians', 'first thessalonians'],
  '2thessalonians': ['2th', '2 th', '2thess', '2 thess', '2 thessalonians', 'ii thessalonians', 'second thessalonians'],
  '1timothy': ['1ti', '1 ti', '1tim', '1 tim', '1 timothy', 'i timothy', 'first timothy'],
  '2timothy': ['2ti', '2 ti', '2tim', '2 tim', '2 timothy', 'ii timothy', 'second timothy'],
  'titus': ['tit', 'ti', 'titus'],
  'philemon': ['phm', 'pm', 'philem', 'philemon'],
  'hebrews': ['heb', 'he', 'hebrews'],
  'james': ['jas', 'jm', 'james'],
  '1peter': ['1pe', '1 pe', '1pet', '1 pet', '1 peter', 'i peter', 'first peter'],
  '2peter': ['2pe', '2 pe', '2pet', '2 pet', '2 peter', 'ii peter', 'second peter'],
  '1john': ['1jo', '1 jo', '1jn', '1 jn', '1 john', 'i john', 'first john'],
  '2john': ['2jo', '2 jo', '2jn', '2 jn', '2 john', 'ii john', 'second john'],
  '3john': ['3jo', '3 jo', '3jn', '3 jn', '3 john', 'iii john', 'third john'],
  'jude': ['jud', 'jude'],
  'revelation': ['rev', 're', 'rv', 'revelation', 'revelations']
};

// Create reverse lookup map for fast searching
const ABBREVIATION_TO_BOOK: Record<string, string> = {};
Object.entries(BIBLE_BOOKS).forEach(([canonical, abbreviations]) => {
  abbreviations.forEach(abbrev => {
    ABBREVIATION_TO_BOOK[abbrev.toLowerCase()] = canonical;
  });
});

// Parse various verse reference formats
export function parseVerseReference(input: string): {
  book?: string;
  chapter?: number;
  verse?: number;
  endVerse?: number;
  confidence: number;
} | null {
  const normalized = input.toLowerCase().trim();
  
  // Pattern 1: "John 3:16" or "Jn 3:16" or "jn3:16"
  let match = normalized.match(/^(\d?\s*\w+)\s*(\d+):(\d+)(?:-(\d+))?$/);
  if (match) {
    const [, bookPart, chapterStr, verseStr, endVerseStr] = match;
    const book = ABBREVIATION_TO_BOOK[bookPart.replace(/\s/g, '')];
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
  
  // Pattern 2: "Genesis 1" (chapter only)
  match = normalized.match(/^(\d?\s*\w+)\s*(\d+)$/);
  if (match) {
    const [, bookPart, chapterStr] = match;
    const book = ABBREVIATION_TO_BOOK[bookPart.replace(/\s/g, '')];
    if (book) {
      return {
        book,
        chapter: parseInt(chapterStr),
        confidence: 0.8
      };
    }
  }
  
  // Pattern 3: Just book name
  const book = ABBREVIATION_TO_BOOK[normalized.replace(/\s/g, '')];
  if (book) {
    return {
      book,
      confidence: 0.6
    };
  }
  
  return null;
}

// Convert canonical book name to standard verse reference format
export function canonicalToReference(canonical: string): string {
  const bookMap: Record<string, string> = {
    'genesis': 'Gen',
    'exodus': 'Exo',
    'leviticus': 'Lev',
    'numbers': 'Num',
    'deuteronomy': 'Deu',
    'joshua': 'Jos',
    'judges': 'Jdg',
    'ruth': 'Rut',
    '1samuel': '1Sa',
    '2samuel': '2Sa',
    '1kings': '1Ki',
    '2kings': '2Ki',
    '1chronicles': '1Ch',
    '2chronicles': '2Ch',
    'ezra': 'Ezr',
    'nehemiah': 'Neh',
    'esther': 'Est',
    'job': 'Job',
    'psalms': 'Psa',
    'proverbs': 'Pro',
    'ecclesiastes': 'Ecc',
    'songofsolomon': 'Sng',
    'isaiah': 'Isa',
    'jeremiah': 'Jer',
    'lamentations': 'Lam',
    'ezekiel': 'Eze',
    'daniel': 'Dan',
    'hosea': 'Hos',
    'joel': 'Joe',
    'amos': 'Amo',
    'obadiah': 'Oba',
    'jonah': 'Jon',
    'micah': 'Mic',
    'nahum': 'Nah',
    'habakkuk': 'Hab',
    'zephaniah': 'Zep',
    'haggai': 'Hag',
    'zechariah': 'Zec',
    'malachi': 'Mal',
    'matthew': 'Mat',
    'mark': 'Mar',
    'luke': 'Luk',
    'john': 'Joh',
    'acts': 'Act',
    'romans': 'Rom',
    '1corinthians': '1Co',
    '2corinthians': '2Co',
    'galatians': 'Gal',
    'ephesians': 'Eph',
    'philippians': 'Phi',
    'colossians': 'Col',
    '1thessalonians': '1Th',
    '2thessalonians': '2Th',
    '1timothy': '1Ti',
    '2timothy': '2Ti',
    'titus': 'Tit',
    'philemon': 'Phm',
    'hebrews': 'Heb',
    'james': 'Jas',
    '1peter': '1Pe',
    '2peter': '2Pe',
    '1john': '1Jo',
    '2john': '2Jo',
    '3john': '3Jo',
    'jude': 'Jud',
    'revelation': 'Rev'
  };
  
  return bookMap[canonical] || canonical;
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
      this.verseMap.set(verse.reference, index);
      
      // Also map alternative formats
      const ref = verse.reference;
      if (ref.includes('.')) {
        this.verseMap.set(ref.replace('.', ' '), index);
      }
      if (ref.includes(' ')) {
        // STRAIGHT-LINE: Store in both formats for search flexibility
        this.verseMap.set(ref, index);
        this.verseMap.set(ref.replace(/\s/g, '.'), index);
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
    
    this.verses.forEach((verseData, index) => {
      const text = verseData.text?.[translationCode] || '';
      const lowerText = text.toLowerCase();
      
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