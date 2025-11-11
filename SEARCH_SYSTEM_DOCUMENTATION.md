# 📖 Biblical Research Platform - Search System Documentation

**Version:** 2.0  
**Last Updated:** October 25, 2025  
**Test Accuracy:** 100% (63/63 test cases passing)  
**Performance:** Sub-millisecond parsing (P50: 0.00ms, P99: 7.00ms)

---

## 🎯 System Overview

The Biblical Research Platform features a **multi-layered intelligent search system** designed to handle any input format users might type, from academic OSIS notation to casual abbreviations like "jn 3 16". The system combines reference parsing, full-text search, and Strong's concordance lookup into a unified interface.

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                 SEARCH SYSTEM ARCHITECTURE              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌──────────────────┐            │
│  │ User Input      │  │ Search Modal UI  │            │
│  │ "jn 3 16"       │→│ (SearchModal.tsx) │            │
│  └─────────────────┘  └──────────────────┘            │
│           │                     │                      │
│           ↓                     ↓                      │
│  ┌─────────────────────────────────────────┐          │
│  │ Bible Reference Parser                  │          │
│  │ (bible-reference-parser.ts)             │          │
│  │ • 300+ book aliases                     │          │
│  │ • Fuzzy typo matching                   │          │
│  │ • Verse validation (31,102 verses)      │          │
│  │ • Ambiguity resolution                  │          │
│  └─────────────────────────────────────────┘          │
│           │                                            │
│           ↓                                            │
│  ┌─────────────────┐  ┌──────────────────┐           │
│  │ Text Search     │  │ Strong's Search  │           │
│  │ (bibleSearch    │  │ (strongsService  │           │
│  │  Engine.ts)     │  │  .ts)            │           │
│  └─────────────────┘  └──────────────────┘           │
│           │                     │                      │
│           ↓                     ↓                      │
│  ┌─────────────────────────────────────────┐          │
│  │ Results Display & Navigation            │          │
│  │ • Reference matches                     │          │
│  │ • Text matches                          │          │
│  │ • Confidence scores                     │          │
│  └─────────────────────────────────────────┘          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 1. Bible Reference Parser

**File:** `client/src/lib/bible-reference-parser.ts`  
**Dependencies:** `client/src/lib/bookAliases.ts`

### Features

✅ **100% Test Accuracy** (63/63 test cases)  
✅ **300+ Book Aliases** supporting diverse input patterns  
✅ **Fuzzy Typo Matching** (Levenshtein distance ≤2)  
✅ **Verse Validation** against 31,102 canonical verses  
✅ **Ambiguity Resolution** using verse existence checks  
✅ **Sub-millisecond Performance** (avg 0.41ms per parse)

### Supported Input Formats

#### 1. Standard References
```javascript
"John 3:16"          → John.3:16
"Psalm 23:1"         → Ps.23:1
"Revelation 7:9-10"  → Rev.7:9
"Genesis 1:1"        → Gen.1:1
"Matthew 5:3"        → Matt.5:3
```

#### 2. OSIS Notation (Academic)
```javascript
"John.3.16"          → John.3:16
"1Sam.17.45"         → 1Sam.17:45
"Rev.7.9-10"         → Rev.7:9
"Ps.23.1"            → Ps.23:1
```

#### 3. Chapter-Only References
```javascript
"Psalm 23"           → Ps.23:1
"Romans 8"           → Rom.8:1
"1 Samuel 17"        → 1Sam.17:1
"Psalm 119"          → Ps.119:1
```

#### 4. Compact Formats (No Spaces)
```javascript
"John316"            → John.3:16  // Smart digit splitting
"Ps23"               → Ps.23:1    // Chapter-only preferred
"Gen1:1"             → Gen.1:1
"Rom8:28"            → Rom.8:28
"1cor13"             → 1Cor.13:1  // Numbered books
```

#### 5. Space-Delimited (Casual Typing)
```javascript
"jn 3 16"            → John.3:16  // Spaces as delimiters
"john 3 17"          → John.3:17
"1 john 3"           → 1John.3:1
"psalm 23"           → Ps.23:1
"1 cor 13 4"         → 1Cor.13:4
```

#### 6. Abbreviations
```javascript
"Jn 3:16"            → John.3:16
"1 Co 13:4"          → 1Cor.13:4
"Psa 23:1"           → Ps.23:1
"Gen 1:1"            → Gen.1:1
"Matt 6:9"           → Matt.6:9
"Phil 4:13"          → Phil.4:13
"1 Sam 16:7"         → 1Sam.16:7
"2 Tim 3:16"         → 2Tim.3:16
```

#### 7. Fuzzy Typos (Auto-Corrected)
```javascript
"Jhon 3:16"          → John.3:16  // Famous verse NT preference
"Pslm 23"            → Ps.23:1
"Isaih 53:5"         → Isa.53:5   // Levenshtein ≤2
"Mathew 5:3"         → Matt.5:3
"Revelations 22:21"  → Rev.22:21  // Common plural form
```

#### 8. Ranges
```javascript
// Same-Chapter Ranges
"John 3:16-17"       → John.3:16 (start verse)
"Romans 12:1-2"      → Rom.12:1
"Ephesians 2:8-9"    → Eph.2:8

// Cross-Chapter Ranges
"Isaiah 52:13-53:3"  → Isa.52:13
"Matthew 5-7"        → Matt.5:1
"Genesis 1-2"        → Gen.1:1
```

#### 9. Alternate Book Names
```javascript
"Song of Solomon 2:4" → Song.2:4
"Canticles 2:4"       → Song.2:4  // Catholic name
"Apocalypse 22:21"    → Rev.22:21  // Greek name
"Song of Songs 1:1"   → Song.1:1
```

#### 10. Edge Formats
```javascript
"Rev. 7:9-10"        → Rev.7:9    // Period after abbrev
"1 Cor. 13:13"       → 1Cor.13:13
"Ps. 23:1"           → Ps.23:1
```

#### 11. Mixed Case
```javascript
"JOHN 3:16"          → John.3:16
"psalm 23"           → Ps.23:1
"1COR13"             → 1Cor.13:1
```

### Parsing Algorithm

#### Phase 1: Input Normalization
1. **Space normalization** - Convert space-delimited numbers to colon format
   - "jn 3 16" → "jn 3:16"
   - Preserves book names with spaces ("1 John", "Song of Solomon")

2. **Case normalization** - Convert to lowercase for matching
3. **Punctuation handling** - Remove extraneous periods, normalize separators

#### Phase 2: Book Resolution
1. **Direct alias lookup** - Check 300+ aliases from `ALIAS_TO_CODE`
2. **Fuzzy matching** - Levenshtein distance ≤2 for typos
3. **Ambiguity resolution** - If multiple books match:
   - Try each with the parsed chapter/verse
   - Return the one that produces a valid verse reference
   - Example: "jon 3:16" tries both Jonah and John, validates existence

#### Phase 3: Chapter/Verse Parsing
1. **Pattern matching** - Regex to extract chapter and verse
2. **Smart digit splitting** - For compact formats like "John316":
   - Try chapter-only interpretation first ("316" → chapter 316 invalid)
   - Fall back to split ("3" chapter, "16" verse)
   - Validate against verse counts
3. **Range handling** - Detect and parse verse/chapter ranges

#### Phase 4: Validation
1. **Verse existence** - Check against 31,102 canonical verse map
2. **Chapter count** - Validate chapter number against book
3. **Verse count** - Validate verse number against chapter
4. **Correction** - Auto-correct to nearest valid reference if needed

### Core Functions

```typescript
// Main entry point
parseReferences(input: string) → ParsedPiece[]

// Convert parsed refs to canonical keys
toKeys(parsed: ParsedPiece[]) → string[]

// Format a reference for display
formatKey(ref: CanonicalRef) → string

// Examples
parseReferences("jn 3 16")
// → [{ bookCode: "JHN", chapter: 3, verse: 16 }]

toKeys(parsed)
// → ["John.3:16"]

formatKey({ bookCode: "JHN", chapter: 3, verse: 16 })
// → "John.3:16"
```

---

## 📖 2. Book Alias System

**File:** `client/src/lib/bookAliases.ts`

### Comprehensive Alias Coverage

The system includes **300+ aliases** covering:

- ✅ Full book names ("Genesis", "Revelation")
- ✅ Common abbreviations ("Gen", "Rev")
- ✅ Very short forms ("Jn", "Ps", "Rom")
- ✅ Legacy names ("Canticles", "Apocalypse")
- ✅ Ordinal variants ("1 Samuel", "1sam", "1 Sam", "isam", "i samuel")
- ✅ Roman numerals ("I John", "II Corinthians", "III John")
- ✅ Spaceless variants ("1cor", "2tim", "3jn")
- ✅ Common typos ("Revelations", "Mathew")

### Book Code Types

```typescript
type BookCode =
  | "Gen" | "Exod" | "Lev" | "Num" | "Deut" | ... // OT (39 books)
  | "Matt" | "Mark" | "Luke" | "John" | "Acts" | ... // NT (27 books)
```

### Alias Maps

#### ALIAS_TO_CODE
Primary alias lookup - 300+ entries
```typescript
{
  "genesis": "Gen",
  "gen": "Gen",
  "ge": "Gen",
  "gn": "Gen",
  "john": "John",
  "jn": "John",
  "jhn": "John",
  "1 corinthians": "1Cor",
  "1cor": "1Cor",
  "i corinthians": "1Cor",
  "song of solomon": "Song",
  "canticles": "Song",
  "apocalypse": "Rev",
  "revelations": "Rev",
  // ... 290+ more
}
```

#### ABBREV_TO_BOOK
Opinionated short forms for disambiguation
```typescript
{
  "jn": "John",    // Gospel (most common)
  "jon": "Jonah",  // Prophet (with validation fallback to John)
  "ps": "Ps",      // Psalms
  "rom": "Rom",    // Romans
  "heb": "Heb",    // Hebrews (not Habakkuk)
  "hb": "Hab",     // Habakkuk gets "hb"
}
```

### Helper Functions

```typescript
// Resolve book from any user input
resolveBook(raw: string): BookCode | undefined

// Get all aliases for a book
getAliasesForBook(code: BookCode): string[]

// Examples
resolveBook("jn")          // → "John"
resolveBook("1 cor")       // → "1Cor"
resolveBook("canticles")   // → "Song"
getAliasesForBook("John")  // → ["john", "jn", "jhn", "joh"]
```

### Ambiguity Resolution Rules

When multiple books match an abbreviation, the system:

1. **Validates verse existence** - Tries each candidate with the chapter/verse
2. **Prefers valid references** - Returns the book where the verse actually exists
3. **NT preference for typos** - Short typos (≤4 chars, distance 1-2) prefer NT books
4. **Fallback to first match** - If ambiguity can't be resolved

**Examples:**
```javascript
// "jon 3:16"
// → Tries: Jonah.3:16 (invalid - only 4 chapters)
// → Tries: John.3:16 (valid ✓)
// → Returns: "John"

// "Jhon 3:16" (typo)
// → Fuzzy matches: John (distance 1), Jonah (distance 2)
// → NT preference for short input with small distance
// → Returns: "John"
```

---

## 🔍 3. Text Search Engine

**File:** `client/src/lib/bibleSearchEngine.ts`

### Features

- Multi-translation search (KJV, BSB, WEB, YLT)
- Phrase and word matching
- Ranked results with confidence scores
- Context highlighting
- Fuzzy word matching

### Search Modes

#### Reference-First Mode (Default)
1. Tries to parse as verse reference
2. If successful, returns exact verses
3. If unsuccessful, falls back to text search

#### Text-Only Mode
Direct full-text search across translations

#### Mixed Mode
Shows both reference matches AND text matches

### Ranking Algorithm

```typescript
Base Scores:
- Exact phrase match:     0.90
- All words present:      0.70
- Partial word match:     0.50

Bonuses:
- Correct word order:     +0.10
- Word proximity:         +0.05
- Translation match:      +0.05

Final Score = Base + Bonuses
```

### Usage

```typescript
const engine = new BibleSearchEngine(translationMaps);

// Search for reference
const results = await engine.search("John 3:16");
// → [{ verseId: "...", reference: "John.3:16", confidence: 0.95 }]

// Search for text
const results = await engine.search("love your enemies");
// → Ranked list of verses containing the phrase
```

---

## 🔤 4. Strong's Concordance Search

**File:** `client/src/lib/strongsService.ts`

### Features

- **14,000+ Strong's numbers** (H1-H8674 Hebrew, G1-G5624 Greek)
- Word definitions and etymology
- Verse occurrence lookup
- Frequency analysis
- Progressive loading (batched)

### Search Interface

```typescript
// Search by Strong's number
searchByStrongsNumber("H430")
// → All verses with אֱלֹהִים (Elohim - God)

searchByStrongsNumber("G26")
// → All verses with ἀγάπη (agape - love)

// Get definition
getStrongsDefinition("H430")
// → {
//   number: "H430",
//   word: "אֱלֹהִים",
//   transliteration: "Elohim",
//   pronunciation: "el-o-heem'",
//   definition: "God, gods, judges, angels",
//   occurrences: 2606
// }
```

### Data Storage

- **Index:** `strongs_index.json` in Supabase Storage
- **Verses:** `strongs_verses.json` in Supabase Storage
- **Loading:** Progressive batches via Web Worker
- **Cache:** In-memory with IndexedDB fallback

---

## 🎨 5. Search Modal UI

**File:** `client/src/components/bible/SearchModal.tsx`

### UI Layout

```
┌────────────────────────────────────────┐
│  🔍 Search  [Ctrl+K / Cmd+K]          │
├────────────────────────────────────────┤
│  [References] [Text] [History]         │
│                                        │
│  ┌──────────────────────────────┐     │
│  │ jn 3 17                      │     │
│  └──────────────────────────────┘     │
│                                        │
│  Translation: [KJV ▼] ☑️ Search All   │
│                                        │
│  📍 References (1)                     │
│  ┌──────────────────────────────┐     │
│  │ ✨ John 3:17  (Exact match)   │     │
│  │ For God sent not his Son...   │     │
│  └──────────────────────────────┘     │
│                                        │
│  📝 Text Matches (0)                   │
│  No text matches                       │
│                                        │
│  ⏱️ Recent Searches                    │
│  • john 3:16                           │
│  • psalm 23                            │
│                                        │
└────────────────────────────────────────┘
```

### Features

✅ **Dual-mode search** - References AND text simultaneously  
✅ **Real-time results** - Debounced at 300ms  
✅ **Translation selector** - Search specific or all translations  
✅ **Result grouping** - Separates references from text matches  
✅ **Confidence badges** - Visual indicators of match quality  
✅ **Keyboard navigation** - Arrow keys, Enter, Escape  
✅ **Search history** - Last 10 searches saved  
✅ **Mobile optimized** - Touch-friendly responsive design  
✅ **Bible Picker** - Visual book/chapter/verse selector

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open search modal |
| `Ctrl+R` | Random verse |
| `↑` / `↓` | Navigate results |
| `Enter` | Select result |
| `Esc` | Close modal |
| `Tab` | Switch between References/Text tabs |

### Search Flow

```
User Input
    ↓
Debounce (300ms)
    ↓
┌─────────────────┐
│ Reference Parse │
└─────────────────┘
    ↓
 Success?
    ├─ Yes → Show reference matches (high confidence)
    └─ No  → Show text search results
    ↓
Merge & Rank
    ↓
Display with Badges
```

---

## 📊 6. Performance & Testing

### Test Suite

**File:** `evaluate-search.ts`, `test-queries.json`

**Test Coverage:**
- 63 test queries across 15 categories
- 100% accuracy (63/63 passing)
- Average latency: 0.41ms per parse

**Test Categories:**
1. ✅ Standard References (5/5)
2. ✅ Chapter Only (3/3)
3. ✅ Abbreviations (8/8)
4. ✅ OSIS Format (4/4)
5. ✅ Cross-Chapter Ranges (3/3)
6. ✅ Typos and Fuzzy (5/5)
7. ✅ Compact Format (4/4)
8. ✅ Alternate Book Names (4/4)
9. ✅ Edge Formats (3/3)
10. ✅ Multiple Verses (3/3)
11. ✅ Popular Verses (5/5)
12. ✅ Numbers Book (5/5)
13. ✅ Short Books (4/4)
14. ✅ Mixed Format (4/4)
15. ✅ Wisdom Literature (3/3)

### Performance Metrics

```
Reference Parsing:
├─ P50 latency: 0.00ms
├─ P99 latency: 7.00ms
├─ Average: 0.41ms
└─ Accuracy: 100%

Text Search:
├─ Full Bible scan: <50ms
├─ Index size: ~4MB per translation
└─ Concurrent translations: 4

Strong's Search:
├─ Initial load: 2-3s (progressive)
├─ Lookup time: <1ms
└─ Data size: ~2MB total

Cache Efficiency:
├─ Reference hits: 95%+
├─ Text cache: Per query+translation
└─ Strong's cache: In-memory + IndexedDB
```

### Running Tests

```bash
# Run full test suite
npx tsx evaluate-search.ts

# View results
cat search-audit-summary.txt
cat search-audit-report.csv
```

---

## 🔧 7. Integration Guide

### Adding the Parser to Your Component

```typescript
import { parseReferences, toKeys } from '@/lib/bible-reference-parser';

function MyComponent() {
  const handleSearch = (input: string) => {
    // Parse the input
    const parsed = parseReferences(input);
    
    // Convert to verse keys
    const keys = toKeys(parsed);
    
    // keys = ["John.3:16"] or multiple for ranges
    navigateToVerse(keys[0]);
  };
}
```

### Using the Search Engine

```typescript
import { BibleSearchEngine } from '@/lib/bibleSearchEngine';

const engine = new BibleSearchEngine(translationMaps);

// Reference search
const refResults = await engine.search("John 3:16");

// Text search
const textResults = await engine.search("love your enemies");

// Filter by translation
const kjvResults = textResults.filter(r => r.translationCode === 'KJV');
```

### Using Strong's Search

```typescript
import { searchByStrongsNumber, getStrongsDefinition } from '@/lib/strongsService';

// Search for Strong's number
const verses = await searchByStrongsNumber("H430"); // אֱלֹהִים (Elohim)

// Get definition
const def = await getStrongsDefinition("H430");
console.log(def.word); // "אֱלֹהִים"
console.log(def.definition); // "God, gods, judges..."
console.log(def.occurrences); // 2606
```

---

## 🎯 8. Best Practices

### For Developers

1. **Always validate references** - Use the verse validation functions
2. **Cache aggressively** - Reference lookups are fast, text search should be cached
3. **Progressive loading** - Load Strong's data in batches
4. **Debounce searches** - 300ms minimum for text search
5. **Show confidence scores** - Help users understand match quality

### For Users

1. **Be flexible** - System understands most input formats
2. **Use abbreviations** - "jn 3 16" works as well as "John 3:16"
3. **Typos are okay** - Fuzzy matching corrects common mistakes
4. **Try text search** - If reference fails, text search may find it
5. **Use keyboard shortcuts** - Ctrl+K for quick access

---

## 🚀 9. Future Enhancements

### Planned Features

1. **Natural language intents**
   - "ten commandments" → Exodus 20
   - "lord's prayer" → Matthew 6:9-13
   - "beatitudes" → Matthew 5:3-12

2. **Semantic search**
   - Embedding-based similarity across translations
   - Conceptual searches ("verses about hope")

3. **Multi-language support**
   - Spanish aliases ("Juan 3:16")
   - Portuguese, French, German aliases
   - RTL support for Hebrew/Greek

4. **Cross-version alignment**
   - Handle verse numbering differences
   - Apocrypha support
   - Variant textual traditions

5. **Advanced filters**
   - Testament filter (OT/NT only)
   - Book category (Law, Prophets, Gospels, Epistles)
   - Date range (chronological order)

6. **Telemetry & Learning**
   - Log parse failures for improvement
   - Track popular abbreviations
   - Auto-suggest new aliases
   - User preference learning

---

## 📚 10. API Reference

### Bible Reference Parser

```typescript
// Parse user input into structured references
function parseReferences(
  input: string,
  opts?: ParseOptions
): ParsedPiece[]

// Convert parsed refs to canonical keys
function toKeys(
  parsed: ParsedPiece[],
  opts?: ParseOptions
): string[]

// Format a reference for display
function formatKey(
  ref: CanonicalRef,
  includeVersePart?: boolean
): string

type ParseOptions = {
  expandFollowing?: boolean;        // Expand f/ff
  expandRangesToKeys?: boolean;     // Expand ranges to list
  getVerseCount?: GetVerseCount;    // Verse count function
  preferNTForAmbiguous?: boolean;   // NT preference
  includeVersePartInKey?: boolean;  // Include a/b/c parts
}

type ParsedPiece = CanonicalRef | CanonicalRange

type CanonicalRef = {
  bookCode: BookCode;
  chapter: number;
  verse: number;
  part?: "a" | "b" | "c";
}

type CanonicalRange = {
  start: CanonicalRef;
  end: CanonicalRef;
  source?: "range" | "following";
}
```

### Book Aliases

```typescript
// Resolve book from any input
function resolveBook(raw: string): BookCode | undefined

// Get all aliases for a book
function getAliasesForBook(code: BookCode): string[]

// Type definitions
type BookCode = "Gen" | "Exod" | "Lev" | ... | "Rev"

const BOOK_CODES: BookCode[]
const BOOK_DISPLAY: Record<BookCode, string>
const ALIAS_TO_CODE: Record<string, BookCode>
const ABBREV_TO_BOOK: Record<string, BookCode>
```

### Search Engine

```typescript
class BibleSearchEngine {
  constructor(translationMaps: Map<string, Map<string, string>>)
  
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>
  
  parseVerseReference(input: string): ReferenceInfo | null
}

interface SearchResult {
  verseId: string;
  reference: string;
  text: string;
  index: number;
  highlightedText: string;
  type: 'verse' | 'reference' | 'text';
  confidence: number;
  translationCode?: string;
}
```

### Strong's Service

```typescript
// Search by Strong's number
function searchByStrongsNumber(
  number: string
): Promise<StrongsVerse[]>

// Get definition
function getStrongsDefinition(
  number: string
): Promise<StrongsDefinition>

interface StrongsDefinition {
  number: string;          // "H430" or "G26"
  word: string;            // Hebrew or Greek
  transliteration: string;
  pronunciation: string;
  definition: string;
  occurrences: number;
}
```

---

## 📞 Support & Contribution

### Reporting Issues

When reporting parsing failures:
1. Include the exact input string
2. Expected output
3. Actual output
4. Translation being used

### Adding New Aliases

To add book aliases:
1. Edit `client/src/lib/bookAliases.ts`
2. Add to `ALIAS_TO_CODE` map
3. Run test suite: `npx tsx evaluate-search.ts`
4. Verify 100% accuracy maintained

### Test Coverage

All new features should include test cases in `test-queries.json`.

---

## 📖 Glossary

**OSIS** - Open Scripture Information Standard (academic notation)  
**BookCode** - Internal canonical book identifier  
**ParsedPiece** - Structured reference or range from parser  
**Strong's Number** - Concordance reference for original word  
**Canonical Key** - Standard format "Book.Chapter:Verse"  
**Fuzzy Matching** - Typo-tolerant string comparison  
**Levenshtein Distance** - Edit distance between strings  
**Ambiguity Resolution** - Choosing correct book when multiple match  

---

**End of Documentation** • Biblical Research Platform v2.0 • Search System
