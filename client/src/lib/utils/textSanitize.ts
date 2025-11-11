export function stripUserMarkup(html: string): string {
  if (!html) return "";
  html = html
    .replace(/<\/?mark[^>]*>/gi, "")
    .replace(/<span[^>]*class=["'][^"']*(highlight|hl|mark)[^"']*["'][^>]*>/gi, "")
    .replace(/<\/span>/gi, "");
  return html.replace(/<[^>]+>/g, "");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type Range = { start: number; end: number };

const MIN_TOKEN_LEN = 2;
const WHOLE_WORDS = false;

function findAll(haystackLc: string, needleLc: string): Range[] {
  const out: Range[] = [];
  if (!needleLc) return out;

  if (WHOLE_WORDS) {
    const re = new RegExp(`\\b${needleLc.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "gi");
    let m: RegExpExecArray | null;
    while ((m = re.exec(haystackLc)) !== null) {
      out.push({ start: m.index, end: m.index + m[0].length });
    }
    return out;
  }

  let i = 0;
  while (i <= haystackLc.length - needleLc.length) {
    const idx = haystackLc.indexOf(needleLc, i);
    if (idx === -1) break;
    out.push({ start: idx, end: idx + needleLc.length });
    i = idx + Math.max(needleLc.length, 1);
  }
  return out;
}

function overlaps(a: Range, b: Range) {
  return a.start < b.end && b.start < a.end;
}

function normalizeRanges(ranges: Range[]): Range[] {
  ranges.sort((r1, r2) => r1.start - r2.start || (r2.end - r2.start) - (r1.end - r1.start));
  const kept: Range[] = [];
  for (const r of ranges) {
    if (kept.some(k => overlaps(k, r))) continue;
    kept.push(r);
  }
  kept.sort((a, b) => a.start - b.start);
  return kept;
}

export function highlightPlainText(
  plain: string,
  phraseLc: string,
  wordsRaw: string[]
): string {
  if (!plain) return "";

  const lc = plain.toLowerCase();
  const ranges: Range[] = [];

  if (phraseLc) ranges.push(...findAll(lc, phraseLc));

  const words = Array.from(new Set(wordsRaw.map(w => w.toLowerCase().trim()).filter(w => w.length >= MIN_TOKEN_LEN)))
    .sort((a, b) => b.length - a.length);

  for (const w of words) {
    ranges.push(...findAll(lc, w));
  }

  const finalRanges = normalizeRanges(ranges);
  if (finalRanges.length === 0) return esc(plain);

  let out = "";
  let cursor = 0;
  for (const r of finalRanges) {
    if (cursor < r.start) out += esc(plain.slice(cursor, r.start));
    out += `<mark class="bg-yellow-200 dark:bg-yellow-800">` + esc(plain.slice(r.start, r.end)) + `</mark>`;
    cursor = r.end;
  }
  if (cursor < plain.length) out += esc(plain.slice(cursor));
  return out;
}
