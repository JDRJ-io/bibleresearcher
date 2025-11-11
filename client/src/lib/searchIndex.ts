// src/lib/searchIndex.ts
export type Occ = {
  verse: string;
  language: string;
  strongs: string;
  morph: string;
  syntax: string;
  surface?: string;
  translit?: string;
  gloss?: string;
  snippet_html?: string;
  i?: number;
};

export type LemmaPayload = {
  lemma: string;
  total: number;
  group_morph_syntax: { morph: string; syntax: string; count: number; occurrences: Occ[] }[];
  group_morph: { morph: string; count: number; occurrences: Occ[] }[];
  all_canonical: Occ[];
};

const BASE =
  (import.meta.env.VITE_SEARCH_INDEX_BASE as string) ||
  "https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/strongs/search_index_v1";

// Convert raw Strong's into lemma key (H#### / G####)
export function toLemmaKey(strongs: string | number, languageHint?: "Hebrew" | "Greek"): string {
  const n = String(strongs).replace(/\D/g, "");
  if (!n) throw new Error(`Bad strongs: ${strongs}`);
  if (languageHint === "Hebrew") return `H${n}`;
  if (languageHint === "Greek") return `G${n}`;
  // try to infer: 1–9999 Greek, 100–9000 Hebrew? Prefer explicit hint from your click context.
  return `G${n}`;
}

// If you forced lowercase filenames at build-time, add .toLowerCase() here.
function lemmaFile(lemma: string) {
  return `${BASE}/lemmas/${lemma}.json`;
}

export async function fetchLemma(lemma: string): Promise<LemmaPayload> {
  const res = await fetch(lemmaFile(lemma), { cache: "force-cache" });
  if (!res.ok) throw new Error(`Lemma not found: ${lemma}`);
  return res.json();
}