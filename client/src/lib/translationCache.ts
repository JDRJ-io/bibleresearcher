import { create } from 'zustand';

interface TranslationSlice {
  texts: Record<string, Record<string,string>>;   // lang → { verseID → text }
  loading: Record<string, boolean>;
}

export const useTranslationStore = create<TranslationSlice>(() => ({
  texts:   {},
  loading: {},
}));

export async function ensureTranslation(lang: string) {
  const { texts, loading } = useTranslationStore.getState();
  if (texts[lang] || loading[lang]) return;                 // already loaded / in flight

  useTranslationStore.setState(s => ({ loading: { ...s.loading, [lang]: true } }));

  const url = `/translations/${lang}.txt`;                  // Vite proxy → Supabase public URL
  const raw = await fetch(url).then(r => r.text());

  const map = Object.fromEntries(
    raw.trim().split(/\n/).map(line => {
      const [id, verse] = line.split('#');                  // Gen.1:1#In the beginning...
      return [id, verse];
    })
  );

  useTranslationStore.setState(s => ({
    loading: { ...s.loading, [lang]: false },
    texts:   { ...s.texts,   [lang]: map   },
  }));
}