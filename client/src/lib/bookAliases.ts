/**
 * Comprehensive Bible Book Alias System
 * 
 * Provides extensive alias mappings for all 66 canonical books to support
 * diverse user input patterns including:
 * - Full book names
 * - Common abbreviations
 * - Legacy/alternate names (Canticles, Apocalypse, etc.)
 * - Spaceless ordinals (1sam, 2cor, etc.)
 * - Roman numerals (i john, ii corinthians, etc.)
 * - Multi-language support ready
 * 
 * All aliases are lowercased and normalized for matching.
 */

export type BookCode =
  | "Gen" | "Exod" | "Lev" | "Num" | "Deut" | "Josh" | "Judg" | "Ruth"
  | "1Sam" | "2Sam" | "1Kgs" | "2Kgs" | "1Chr" | "2Chr" | "Ezra" | "Neh" | "Esth"
  | "Job" | "Ps" | "Prov" | "Eccl" | "Song" | "Isa" | "Jer" | "Lam" | "Ezek"
  | "Dan" | "Hos" | "Joel" | "Amos" | "Obad" | "Jonah" | "Mic" | "Nah" | "Hab"
  | "Zeph" | "Hag" | "Zech" | "Mal"
  | "Matt" | "Mark" | "Luke" | "John" | "Acts" | "Rom" | "1Cor" | "2Cor" | "Gal"
  | "Eph" | "Phil" | "Col" | "1Thess" | "2Thess" | "1Tim" | "2Tim" | "Titus" | "Phlm"
  | "Heb" | "Jas" | "1Pet" | "2Pet" | "1John" | "2John" | "3John" | "Jude" | "Rev";

export const BOOK_CODES: BookCode[] = [
  "Gen", "Exod", "Lev", "Num", "Deut", "Josh", "Judg", "Ruth",
  "1Sam", "2Sam", "1Kgs", "2Kgs", "1Chr", "2Chr", "Ezra", "Neh", "Esth",
  "Job", "Ps", "Prov", "Eccl", "Song", "Isa", "Jer", "Lam", "Ezek",
  "Dan", "Hos", "Joel", "Amos", "Obad", "Jonah", "Mic", "Nah", "Hab",
  "Zeph", "Hag", "Zech", "Mal",
  "Matt", "Mark", "Luke", "John", "Acts", "Rom", "1Cor", "2Cor", "Gal",
  "Eph", "Phil", "Col", "1Thess", "2Thess", "1Tim", "2Tim", "Titus", "Phlm",
  "Heb", "Jas", "1Pet", "2Pet", "1John", "2John", "3John", "Jude", "Rev"
];

export const BOOK_DISPLAY: Record<BookCode, string> = {
  "Gen": "Genesis",
  "Exod": "Exodus",
  "Lev": "Leviticus",
  "Num": "Numbers",
  "Deut": "Deuteronomy",
  "Josh": "Joshua",
  "Judg": "Judges",
  "Ruth": "Ruth",
  "1Sam": "1 Samuel",
  "2Sam": "2 Samuel",
  "1Kgs": "1 Kings",
  "2Kgs": "2 Kings",
  "1Chr": "1 Chronicles",
  "2Chr": "2 Chronicles",
  "Ezra": "Ezra",
  "Neh": "Nehemiah",
  "Esth": "Esther",
  "Job": "Job",
  "Ps": "Psalms",
  "Prov": "Proverbs",
  "Eccl": "Ecclesiastes",
  "Song": "Song of Songs",
  "Isa": "Isaiah",
  "Jer": "Jeremiah",
  "Lam": "Lamentations",
  "Ezek": "Ezekiel",
  "Dan": "Daniel",
  "Hos": "Hosea",
  "Joel": "Joel",
  "Amos": "Amos",
  "Obad": "Obadiah",
  "Jonah": "Jonah",
  "Mic": "Micah",
  "Nah": "Nahum",
  "Hab": "Habakkuk",
  "Zeph": "Zephaniah",
  "Hag": "Haggai",
  "Zech": "Zechariah",
  "Mal": "Malachi",
  "Matt": "Matthew",
  "Mark": "Mark",
  "Luke": "Luke",
  "John": "John",
  "Acts": "Acts",
  "Rom": "Romans",
  "1Cor": "1 Corinthians",
  "2Cor": "2 Corinthians",
  "Gal": "Galatians",
  "Eph": "Ephesians",
  "Phil": "Philippians",
  "Col": "Colossians",
  "1Thess": "1 Thessalonians",
  "2Thess": "2 Thessalonians",
  "1Tim": "1 Timothy",
  "2Tim": "2 Timothy",
  "Titus": "Titus",
  "Phlm": "Philemon",
  "Heb": "Hebrews",
  "Jas": "James",
  "1Pet": "1 Peter",
  "2Pet": "2 Peter",
  "1John": "1 John",
  "2John": "2 John",
  "3John": "3 John",
  "Jude": "Jude",
  "Rev": "Revelation"
};

/**
 * Comprehensive alias map - maps all variations to canonical BookCode
 * All keys are lowercased for case-insensitive matching
 */
export const ALIAS_TO_CODE: Record<string, BookCode> = {
  // Genesis
  "genesis": "Gen", "gen": "Gen", "ge": "Gen", "gn": "Gen",
  
  // Exodus
  "exodus": "Exod", "exod": "Exod", "exo": "Exod", "ex": "Exod",
  
  // Leviticus
  "leviticus": "Lev", "lev": "Lev", "lv": "Lev", "le": "Lev",
  
  // Numbers
  "numbers": "Num", "num": "Num", "nm": "Num", "nb": "Num", "nu": "Num",
  
  // Deuteronomy
  "deuteronomy": "Deut", "deut": "Deut", "dt": "Deut", "deu": "Deut", "de": "Deut",
  
  // Joshua
  "joshua": "Josh", "josh": "Josh", "jos": "Josh", "jsh": "Josh",
  
  // Judges
  "judges": "Judg", "judg": "Judg", "jdg": "Judg", "jgs": "Judg", "jg": "Judg",
  
  // Ruth
  "ruth": "Ruth", "ru": "Ruth", "rut": "Ruth", "rth": "Ruth",
  
  // 1 Samuel
  "1 samuel": "1Sam", "1samuel": "1Sam", "1 sam": "1Sam", "1sam": "1Sam",
  "i samuel": "1Sam", "isamuel": "1Sam", "i sam": "1Sam", "isam": "1Sam",
  "first samuel": "1Sam", "1st samuel": "1Sam", "1 sa": "1Sam", "1sa": "1Sam",
  "1 sm": "1Sam", "1sm": "1Sam", "1s": "1Sam",
  
  // 2 Samuel
  "2 samuel": "2Sam", "2samuel": "2Sam", "2 sam": "2Sam", "2sam": "2Sam",
  "ii samuel": "2Sam", "iisamuel": "2Sam", "ii sam": "2Sam", "iisam": "2Sam",
  "second samuel": "2Sam", "2nd samuel": "2Sam", "2 sa": "2Sam", "2sa": "2Sam",
  "2 sm": "2Sam", "2sm": "2Sam", "2s": "2Sam",
  
  // 1 Kings
  "1 kings": "1Kgs", "1kings": "1Kgs", "1 kgs": "1Kgs", "1kgs": "1Kgs",
  "i kings": "1Kgs", "ikings": "1Kgs", "i kgs": "1Kgs", "ikgs": "1Kgs",
  "first kings": "1Kgs", "1st kings": "1Kgs", "1 ki": "1Kgs", "1ki": "1Kgs",
  "1 kg": "1Kgs", "1kg": "1Kgs", "1k": "1Kgs",
  
  // 2 Kings
  "2 kings": "2Kgs", "2kings": "2Kgs", "2 kgs": "2Kgs", "2kgs": "2Kgs",
  "ii kings": "2Kgs", "iikings": "2Kgs", "ii kgs": "2Kgs", "iikgs": "2Kgs",
  "second kings": "2Kgs", "2nd kings": "2Kgs", "2 ki": "2Kgs", "2ki": "2Kgs",
  "2 kg": "2Kgs", "2kg": "2Kgs", "2k": "2Kgs",
  
  // 1 Chronicles
  "1 chronicles": "1Chr", "1chronicles": "1Chr", "1 chr": "1Chr", "1chr": "1Chr",
  "i chronicles": "1Chr", "ichronicles": "1Chr", "i chr": "1Chr", "ichr": "1Chr",
  "first chronicles": "1Chr", "1st chronicles": "1Chr", "1 ch": "1Chr", "1ch": "1Chr",
  "1 chron": "1Chr", "1chron": "1Chr", "1 paralipomenon": "1Chr", "i paralipomenon": "1Chr",
  
  // 2 Chronicles
  "2 chronicles": "2Chr", "2chronicles": "2Chr", "2 chr": "2Chr", "2chr": "2Chr",
  "ii chronicles": "2Chr", "iichronicles": "2Chr", "ii chr": "2Chr", "iichr": "2Chr",
  "second chronicles": "2Chr", "2nd chronicles": "2Chr", "2 ch": "2Chr", "2ch": "2Chr",
  "2 chron": "2Chr", "2chron": "2Chr", "2 paralipomenon": "2Chr", "ii paralipomenon": "2Chr",
  
  // Ezra
  "ezra": "Ezra", "ezr": "Ezra", "ez": "Ezra",
  
  // Nehemiah
  "nehemiah": "Neh", "neh": "Neh", "ne": "Neh",
  
  // Esther
  "esther": "Esth", "esth": "Esth", "est": "Esth", "es": "Esth",
  
  // Job
  "job": "Job", "jb": "Job",
  
  // Psalms
  "psalms": "Ps", "psalm": "Ps", "ps": "Ps", "psa": "Ps", "psm": "Ps",
  "pslm": "Ps", "pslms": "Ps", "pss": "Ps",
  
  // Proverbs
  "proverbs": "Prov", "proverb": "Prov", "prov": "Prov", "pr": "Prov",
  "prv": "Prov", "pro": "Prov",
  
  // Ecclesiastes
  "ecclesiastes": "Eccl", "eccles": "Eccl", "eccl": "Eccl", "ecc": "Eccl",
  "ec": "Eccl", "qoh": "Eccl", "qoheleth": "Eccl",
  
  // Song of Songs
  "song of songs": "Song", "song": "Song", "songofsongs": "Song",
  "song of solomon": "Song", "songofsolomon": "Song",
  "canticles": "Song", "canticle of canticles": "Song",
  "ss": "Song", "so": "Song", "sos": "Song", "cant": "Song",
  
  // Isaiah
  "isaiah": "Isa", "isa": "Isa", "is": "Isa", "isaih": "Isa",
  
  // Jeremiah
  "jeremiah": "Jer", "jer": "Jer", "je": "Jer", "jr": "Jer",
  
  // Lamentations
  "lamentations": "Lam", "lam": "Lam", "la": "Lam",
  
  // Ezekiel
  "ezekiel": "Ezek", "ezek": "Ezek", "eze": "Ezek", "ezk": "Ezek",
  "ek": "Ezek", "ezech": "Ezek",
  
  // Daniel
  "daniel": "Dan", "dan": "Dan", "da": "Dan", "dn": "Dan",
  
  // Hosea
  "hosea": "Hos", "hos": "Hos", "ho": "Hos",
  
  // Joel
  "joel": "Joel", "joe": "Joel", "jl": "Joel", "jol": "Joel",
  
  // Amos
  "amos": "Amos", "amo": "Amos", "am": "Amos",
  
  // Obadiah
  "obadiah": "Obad", "obad": "Obad", "ob": "Obad", "oba": "Obad",
  
  // Jonah
  "jonah": "Jonah", "jon": "Jonah", "jnh": "Jonah",
  
  // Micah
  "micah": "Mic", "mic": "Mic", "mi": "Mic",
  
  // Nahum
  "nahum": "Nah", "nah": "Nah", "na": "Nah", "nam": "Nah",
  
  // Habakkuk
  "habakkuk": "Hab", "hab": "Hab", "hb": "Hab",
  
  // Zephaniah
  "zephaniah": "Zeph", "zeph": "Zeph", "zep": "Zeph", "zp": "Zeph",
  
  // Haggai
  "haggai": "Hag", "hag": "Hag", "hg": "Hag",
  
  // Zechariah
  "zechariah": "Zech", "zech": "Zech", "zec": "Zech", "zc": "Zech",
  "zechar": "Zech", "zach": "Zech",
  
  // Malachi
  "malachi": "Mal", "mal": "Mal", "ml": "Mal",
  
  // Matthew
  "matthew": "Matt", "matt": "Matt", "mt": "Matt", "mat": "Matt",
  "mathew": "Matt",
  
  // Mark
  "mark": "Mark", "mk": "Mark", "mrk": "Mark", "mr": "Mark", "mar": "Mark",
  
  // Luke
  "luke": "Luke", "lk": "Luke", "luk": "Luke", "lu": "Luke",
  
  // John (Gospel)
  "john": "John", "jn": "John", "jhn": "John", "joh": "John",
  
  // Acts
  "acts": "Acts", "act": "Acts", "ac": "Acts", "acts of the apostles": "Acts",
  
  // Romans
  "romans": "Rom", "rom": "Rom", "ro": "Rom", "rm": "Rom",
  
  // 1 Corinthians
  "1 corinthians": "1Cor", "1corinthians": "1Cor", "1 cor": "1Cor", "1cor": "1Cor",
  "i corinthians": "1Cor", "icorinthians": "1Cor", "i cor": "1Cor", "icor": "1Cor",
  "first corinthians": "1Cor", "1st corinthians": "1Cor", "1 co": "1Cor", "1co": "1Cor",
  
  // 2 Corinthians
  "2 corinthians": "2Cor", "2corinthians": "2Cor", "2 cor": "2Cor", "2cor": "2Cor",
  "ii corinthians": "2Cor", "iicorinthians": "2Cor", "ii cor": "2Cor", "iicor": "2Cor",
  "second corinthians": "2Cor", "2nd corinthians": "2Cor", "2 co": "2Cor", "2co": "2Cor",
  
  // Galatians
  "galatians": "Gal", "gal": "Gal", "ga": "Gal",
  
  // Ephesians
  "ephesians": "Eph", "eph": "Eph", "ephes": "Eph",
  
  // Philippians
  "philippians": "Phil", "phil": "Phil", "php": "Phil", "phi": "Phil", "pp": "Phil",
  
  // Colossians
  "colossians": "Col", "col": "Col", "co": "Col",
  
  // 1 Thessalonians
  "1 thessalonians": "1Thess", "1thessalonians": "1Thess", "1 thess": "1Thess", "1thess": "1Thess",
  "i thessalonians": "1Thess", "ithessalonians": "1Thess", "i thess": "1Thess", "ithess": "1Thess",
  "first thessalonians": "1Thess", "1st thessalonians": "1Thess", "1 th": "1Thess", "1th": "1Thess",
  
  // 2 Thessalonians
  "2 thessalonians": "2Thess", "2thessalonians": "2Thess", "2 thess": "2Thess", "2thess": "2Thess",
  "ii thessalonians": "2Thess", "iithessalonians": "2Thess", "ii thess": "2Thess", "iithess": "2Thess",
  "second thessalonians": "2Thess", "2nd thessalonians": "2Thess", "2 th": "2Thess", "2th": "2Thess",
  
  // 1 Timothy
  "1 timothy": "1Tim", "1timothy": "1Tim", "1 tim": "1Tim", "1tim": "1Tim",
  "i timothy": "1Tim", "itimothy": "1Tim", "i tim": "1Tim", "itim": "1Tim",
  "first timothy": "1Tim", "1st timothy": "1Tim", "1 ti": "1Tim", "1ti": "1Tim",
  
  // 2 Timothy
  "2 timothy": "2Tim", "2timothy": "2Tim", "2 tim": "2Tim", "2tim": "2Tim",
  "ii timothy": "2Tim", "iitimothy": "2Tim", "ii tim": "2Tim", "iitim": "2Tim",
  "second timothy": "2Tim", "2nd timothy": "2Tim", "2 ti": "2Tim", "2ti": "2Tim",
  
  // Titus
  "titus": "Titus", "tit": "Titus", "ti": "Titus", "tts": "Titus",
  
  // Philemon
  "philemon": "Phlm", "philem": "Phlm", "phm": "Phlm", "phlm": "Phlm", "pm": "Phlm",
  
  // Hebrews
  "hebrews": "Heb", "heb": "Heb", "he": "Heb",
  
  // James
  "james": "Jas", "jas": "Jas", "jm": "Jas", "jam": "Jas",
  
  // 1 Peter
  "1 peter": "1Pet", "1peter": "1Pet", "1 pet": "1Pet", "1pet": "1Pet",
  "i peter": "1Pet", "ipeter": "1Pet", "i pet": "1Pet", "ipet": "1Pet",
  "first peter": "1Pet", "1st peter": "1Pet", "1 pe": "1Pet", "1pe": "1Pet",
  "1 pt": "1Pet", "1pt": "1Pet",
  
  // 2 Peter
  "2 peter": "2Pet", "2peter": "2Pet", "2 pet": "2Pet", "2pet": "2Pet",
  "ii peter": "2Pet", "iipeter": "2Pet", "ii pet": "2Pet", "iipet": "2Pet",
  "second peter": "2Pet", "2nd peter": "2Pet", "2 pe": "2Pet", "2pe": "2Pet",
  "2 pt": "2Pet", "2pt": "2Pet",
  
  // 1 John
  "1 john": "1John", "1john": "1John", "1 jn": "1John", "1jn": "1John",
  "i john": "1John", "ijohn": "1John", "i jn": "1John", "ijn": "1John",
  "first john": "1John", "1st john": "1John", "1 jo": "1John", "1jo": "1John",
  
  // 2 John
  "2 john": "2John", "2john": "2John", "2 jn": "2John", "2jn": "2John",
  "ii john": "2John", "iijohn": "2John", "ii jn": "2John", "iijn": "2John",
  "second john": "2John", "2nd john": "2John", "2 jo": "2John", "2jo": "2John",
  
  // 3 John
  "3 john": "3John", "3john": "3John", "3 jn": "3John", "3jn": "3John",
  "iii john": "3John", "iiijohn": "3John", "iii jn": "3John", "iiijn": "3John",
  "third john": "3John", "3rd john": "3John", "3 jo": "3John", "3jo": "3John",
  
  // Jude
  "jude": "Jude", "jud": "Jude", "jd": "Jude",
  
  // Revelation
  "revelation": "Rev", "rev": "Rev", "re": "Rev", "rv": "Rev",
  "revelations": "Rev", "apocalypse": "Rev", "apoc": "Rev",
};

/**
 * Opinionated short forms for very compact user typing
 * These handle edge cases and prioritize common interpretations
 * 
 * Priority rules:
 * - "jn" → John (Gospel, most common)
 * - "jon" → Jonah (prophet, but will fallback to John if verse invalid)
 * - "ps" → Psalms
 * - "rom" → Romans
 * - "heb" → Hebrews (not Habakkuk)
 */
export const ABBREV_TO_BOOK: Record<string, BookCode> = {
  // Very short forms that need disambiguation
  "jn": "John",      // Most common usage
  "jon": "Jonah",    // Will validate and fallback to John if needed
  "ps": "Ps",
  "rom": "Rom",
  "heb": "Heb",      // Hebrews, not Habakkuk (hb → Hab)
  "hb": "Hab",       // Habakkuk gets "hb"
  "jam": "Jas",
  "phil": "Phil",
  
  // Single letter shortcuts (controversial but useful)
  // Only use these if they don't create conflicts
  // "j": "John",     // Too ambiguous - commented out
  // "p": "Ps",       // Too ambiguous - commented out
};

/**
 * Helper function to resolve book from user input
 * Handles spaces, case normalization, and fallback logic
 */
export function resolveBook(raw: string): BookCode | undefined {
  if (!raw) return undefined;
  
  // Normalize: trim, lowercase, collapse multiple spaces
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, " ");
  
  // Try exact match with spaces
  let result = ABBREV_TO_BOOK[normalized] || ALIAS_TO_CODE[normalized];
  
  if (result) return result;
  
  // Try without spaces (handles "1sam", "2cor", etc.)
  const spaceless = normalized.replace(/\s+/g, "");
  result = ABBREV_TO_BOOK[spaceless] || ALIAS_TO_CODE[spaceless];
  
  return result;
}

/**
 * Get all aliases for a given book code
 * Useful for reverse lookup and display purposes
 */
export function getAliasesForBook(code: BookCode): string[] {
  const aliases: string[] = [];
  
  for (const [alias, bookCode] of Object.entries(ALIAS_TO_CODE)) {
    if (bookCode === code) {
      aliases.push(alias);
    }
  }
  
  for (const [alias, bookCode] of Object.entries(ABBREV_TO_BOOK)) {
    if (bookCode === code && !aliases.includes(alias)) {
      aliases.push(alias);
    }
  }
  
  return aliases.sort((a, b) => a.length - b.length); // Sort by length
}
