// verseMapConfig.ts
// -----------------------------------------------------------------------------
// Storage-aligned tags (what your verse references actually use)
// -----------------------------------------------------------------------------

export type BookCode =
  | "GEN"|"EXO"|"LEV"|"NUM"|"DEU"|"JOS"|"JDG"|"RUT"|"1SA"|"2SA"|"1KI"|"2KI"|"1CH"|"2CH"
  | "EZR"|"NEH"|"EST"|"JOB"|"PSA"|"PRO"|"ECC"|"SNG"|"ISA"|"JER"|"LAM"|"EZK"|"DAN"|"HOS"
  | "JOL"|"AMO"|"OBA"|"JON"|"MIC"|"NAM"|"HAB"|"ZEP"|"HAG"|"ZEC"|"MAL"
  | "MAT"|"MRK"|"LUK"|"JHN"|"ACT"|"ROM"|"1CO"|"2CO"|"GAL"|"EPH"|"PHP"|"COL"
  | "1TH"|"2TH"|"1TI"|"2TI"|"TIT"|"PHM"|"HEB"|"JAS"|"1PE"|"2PE"|"1JN"|"2JN"|"3JN"|"JUD"|"REV";

/** Make the parser emit these tags so keys match storage EXACTLY. */
export const CANONICAL_BOOK_TAG: Record<BookCode, string> = {
  // OT
  GEN:"Gen", EXO:"Exod", LEV:"Lev", NUM:"Num", DEU:"Deut",
  JOS:"Josh", JDG:"Judg", RUT:"Ruth",
  "1SA":"1Sam", "2SA":"2Sam", "1KI":"1Kgs", "2KI":"2Kgs", "1CH":"1Chr", "2CH":"2Chr",
  EZR:"Ezra", NEH:"Neh", EST:"Esth", JOB:"Job", PSA:"Ps", PRO:"Prov", ECC:"Eccl", SNG:"Song",
  ISA:"Isa", JER:"Jer", LAM:"Lam", EZK:"Ezek", DAN:"Dan", HOS:"Hos", JOL:"Joel", AMO:"Amos",
  OBA:"Obad", JON:"Jonah", MIC:"Mic", NAM:"Nah", HAB:"Hab", ZEP:"Zeph", HAG:"Hag", ZEC:"Zech", MAL:"Mal",

  // NT
  MAT:"Matt", MRK:"Mark", LUK:"Luke", JHN:"John", ACT:"Acts", ROM:"Rom",
  "1CO":"1Cor", "2CO":"2Cor", GAL:"Gal", EPH:"Eph", PHP:"Phil", COL:"Col",
  "1TH":"1Thess", "2TH":"2Thess", "1TI":"1Tim", "2TI":"2Tim", TIT:"Titus", PHM:"Phlm",
  HEB:"Heb", JAS:"Jas", "1PE":"1Pet", "2PE":"2Pet", "1JN":"1John", "2JN":"2John", "3JN":"3John",
  JUD:"Jude", REV:"Rev"
};

// -----------------------------------------------------------------------------
// Aliases keyed by the **stored tag** (the tag that appears in verse.reference)
// -----------------------------------------------------------------------------
export const SHORT_TAGS: Record<string, string[]> = {
  // OT - long vs short & cross-trad forms
  Gen:  ["Ge","Gn","Gen"],
  Exod: ["Ex","Exo","Exod"],
  Lev:  ["Le","Lv","Lev"],
  Num:  ["Nu","Nm","Num"],
  Deut: ["Dt","Deu","Deut"],

  Josh: ["Jos","Josh"],
  Judg: ["Jdg","Jg","Jgs","Judg"],
  Ruth: ["Ru","Rth","Ruth"],

  "1Sam": ["1Sa","1 Sam","1Sam","I Sam","First Samuel","1Samuel"],
  "2Sam": ["2Sa","2 Sam","2Sam","II Sam","Second Samuel","2Samuel"],

  "1Kgs": ["1Ki","1 Kgs","1Kings","1 Kings","I Kings"],
  "2Kgs": ["2Ki","2 Kgs","2Kings","2 Kings","II Kings"],

  "1Chr": ["1Ch","1 Chr","1Chron","1 Chronicles","I Chronicles"],
  "2Chr": ["2Ch","2 Chr","2Chron","2 Chronicles","II Chronicles"],

  Ezra: ["Ezr","Ezra"],
  Neh:  ["Ne","Neh"],
  Esth: ["Est","Es","Esther"],
  Job:  ["Job"],
  Ps:   ["Psa","Pss","Psalm","Psalms","Ps"],
  Prov: ["Prv","Pr","Prov","Pro"],
  Eccl: ["Ecc","Eccl","Eccles","Ecclesiastes","Qoh","Qoheleth"],
  Song: ["Cant","Ct","SoS","SS","Song of Songs","Song of Solomon"],
  Isa:  ["Is","Isa"],
  Jer:  ["Je","Jer"],
  Lam:  ["La","Lam"],
  Ezek: ["Eze","Ezk","Ezek","Ezech"],
  Dan:  ["Da","Dn","Dan"],
  Hos:  ["Ho","Hos"],
  Joel: ["Jl","Jol","Joel"],
  Amos: ["Am","Amo","Amos"],
  Obad: ["Ob","Oba","Obad","Obadiah"],
  Jonah:["Jon","Jnh","Jonah"],
  Mic:  ["Mi","Mic"],
  Nah:  ["Na","Nam","Nah","Nahum"],
  Hab:  ["Hb","Hab","Habakkuk"],
  Zeph: ["Zp","Zep","Zeph","Zephaniah"],
  Hag:  ["Hg","Hag"],
  Zech: ["Zc","Zec","Zech","Zechariah"],
  Mal:  ["Ml","Mal","Malachi"],

  // NT
  Matt: ["Mt","Mat","Matt","Matthew"],
  Mark: ["Mk","Mr","Mar","Mark"],
  Luke: ["Lk","Lc","Luk","Luke"],
  John: ["Jn","Jhn","Joh","John"],
  Acts: ["Ac","Act","Acts"],
  Rom:  ["Ro","Rm","Rom","Romans"],
  "1Cor":["1Co","1 Cor","1Cor","I Cor","First Corinthians","1Corinthians"],
  "2Cor":["2Co","2 Cor","2Cor","II Cor","Second Corinthians","2Corinthians"],
  Gal:  ["Ga","Gal","Galatians"],
  Eph:  ["Ephes","Eph","Ephesians"],
  Phil: ["Php","Phi","Phil","Philippians"],
  Col:  ["Col","Colos","Colossians"],
  "1Thess":["1Th","1 Thess","1Thess","I Thess","First Thessalonians","1Thessalonians"],
  "2Thess":["2Th","2 Thess","2Thess","II Thess","Second Thessalonians","2Thessalonians"],
  "1Tim":["1Ti","1 Tim","1Tim","I Tim","First Timothy","1Timothy"],
  "2Tim":["2Ti","2 Tim","2Tim","II Tim","Second Timothy","2Timothy"],
  Titus:["Tit","Ti","Titus"],
  Phlm: ["Phm","Philem","Philemon","Pm","Phlm"],
  Heb:  ["He","Heb","Hebrews"],
  Jas:  ["Jam","Jm","Jas","James"],
  "1Pet":["1Pe","1 Pet","1Pet","I Pet","First Peter","1Peter"],
  "2Pet":["2Pe","2 Pet","2Pet","II Pet","Second Peter","2Peter"],
  "1John":["1Jn","1 John","1John","I Jn","First John"],
  "2John":["2Jn","2 John","2John","II Jn","Second John"],
  "3John":["3Jn","3 John","3John","III Jn","Third John"],
  Jude: ["Jud","Jude"],
  Rev:  ["Re","Rv","Rev","Revelation","Revelations","Apoc","Apocalypse"]
};

// -----------------------------------------------------------------------------
// Verse map builder + resilient lookup
// -----------------------------------------------------------------------------

/** Build a Map<string, index> with canonical + space + alias keys. */
export function buildVerseMap(
  verses: Array<{ reference: string }>,
  opts: { addLowercase?: boolean } = {}
): Map<string, number> {
  const map = new Map<string, number>();
  const add = (k: string, i: number) => {
    if (!map.has(k)) map.set(k, i);
    if (opts.addLowercase) {
      const kl = k.toLowerCase();
      if (!map.has(kl)) map.set(kl, i);
    }
  };

  verses.forEach((v, index) => {
    const ref = v.reference;                 // e.g., "John.3:16"
    add(ref, index);
    if (ref.includes(".")) add(ref.replace(/\./g, " "), index); // "John 3:16"

    const m = ref.match(/^([^\.]+)\.(\d+:\d+[abc]?)$/);
    if (!m) return;
    const [, tag, rest] = m;                 // tag = "John", rest = "3:16"

    const aliases = SHORT_TAGS[tag] || [];
    for (const a of aliases) {
      add(`${a}.${rest}`, index);            // "Jn.3:16"
      add(`${a} ${rest}`, index);            // "Jn 3:16"
    }
  });

  return map;
}

/** Translate parser/staffer tags → stored tag (minimal, uses SHORT_TAGS keys). */
const TAG_TRANSLATE: Record<string, string> = (() => {
  const t: Record<string, string> = {};
  for (const storedTag of Object.keys(SHORT_TAGS)) {
    for (const alias of SHORT_TAGS[storedTag]) t[alias] = storedTag;
  }
  return t;
})();

/** Try raw key, translated tag, space variant, and lowercase variants. */
export function safeLookup(map: Map<string, number>, ref: string): number | undefined {
  if (map.has(ref)) return map.get(ref);

  // translate book tag if needed
  const m = ref.match(/^([^\.]+)\.(\d+:\d+[abc]?)$/);
  if (m) {
    const [, tag, rest] = m;
    const t = TAG_TRANSLATE[tag];
    if (t) {
      const tr = `${t}.${rest}`;
      if (map.has(tr)) return map.get(tr);
      const trSp = `${t} ${rest}`;
      if (map.has(trSp)) return map.get(trSp);
    }
  }

  const sp = ref.replace(/\./g, " ");
  if (map.has(sp)) return map.get(sp);

  // lowercase fallbacks (if map was built without addLowercase)
  const rl = ref.toLowerCase();
  if (map.has(rl)) return map.get(rl);
  const spl = sp.toLowerCase();
  if (map.has(spl)) return map.get(spl);

  return undefined;
}
