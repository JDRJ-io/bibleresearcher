import React from 'react';
import { supabase } from '@/lib/supabaseClient';

type Row = Record<string, any>;

const VERSE = 'John.3:16';
const TR = 'NKJV';

export default function DebugSelfTest() {
  const [log, setLog] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [cleanup, setCleanup] = React.useState(true);
  const [user, setUser] = React.useState<{id:string; email:string|null}|null>(null);

  const push = (m: string) => setLog((prev) => [...prev, m]);

  const must = (ok: boolean, where: string, extra?: any) => {
    if (!ok) throw new Error(`❌ FAIL at ${where} ${extra ? JSON.stringify(extra) : ''}`);
    push(`✅ ${where}`);
  };

  const getUser = async () => {
    const { data, error } = await supabase().auth.getUser();
    if (error) throw error;
    if (!data.user) throw new Error('No Supabase user (not signed in).');
    return { id: data.user.id, email: data.user.email ?? null };
  };

  const run = async () => {
    setLoading(true);
    setLog([]);
    try {
      push('🔐 Checking auth/session…');
      const me = await getUser();
      setUser(me);
      push(`👤 user_id=${me.id} email=${me.email ?? '(none)'}`);

      // 1) Save a color (sanity)
      push('🎨 Saving a user color…');
      {
        const { error } = await supabase().rpc('fn_save_color', { p_color: '#FF8C00', p_label: 'SelfTest Orange' });
        must(!error, 'fn_save_color', error);
      }

      // 2) Upsert a note
      push('📝 Upserting a note…');
      {
        const noteBody = `Self-test note @ ${new Date().toISOString()}`;
        const { data, error } = await supabase().rpc('fn_upsert_note', {
          p_verse_key: VERSE,
          p_translation: TR,
          p_body: noteBody,
        });
        must(!error && data, 'fn_upsert_note', error ?? data);

        // Read back (direct table) - using correct schema field 'body'
        const r = await supabase()
          .from('user_notes')
          .select('id, verse_key, translation, body, updated_at')
          .eq('verse_key', VERSE)
          .eq('translation', TR)
          .order('updated_at', { ascending: false })
          .limit(1);
        must(!r.error && r.data && r.data.length > 0, 'read note back', r.error ?? r.data);
        push(`📝 Note body: ${r.data![0].body}`);
      }

      // 3) Upsert a bookmark
      push('🔖 Upserting a bookmark…');
      {
        const { data, error } = await supabase().rpc('fn_upsert_bookmark', {
          p_verse_key: VERSE,
          p_label: 'SelfTest Bookmark',
          p_translation: TR,
        });
        must(!error && data, 'fn_upsert_bookmark', error ?? data);

        // Read back (direct table) - using correct schema fields
        const r = await supabase()
          .from('user_bookmarks')
          .select('id, verse_key, translation, created_at')
          .eq('verse_key', VERSE)
          .eq('translation', TR)
          .order('created_at', { ascending: false })
          .limit(1);
        must(!r.error && r.data && r.data.length > 0, 'read bookmark back', r.error ?? r.data);
        push(`🔖 Bookmark found for verse: ${r.data![0].verse_key}`);
      }

      // 4) Add/merge a highlight range
      push('🖍️ Adding a highlight range…');
      {
        const { error } = await supabase().rpc('fn_add_highlight_range', {
          p_verse_key: VERSE,
          p_translation: TR,
          p_start: 0,
          p_end: 12,
          p_color: '#FF8C00',
          p_note: null,
          p_opacity: 0.9,
        });
        must(!error, 'fn_add_highlight_range', error);

        // Trim a portion
        const er = await supabase().rpc('fn_erase_highlight_range', {
          p_verse_key: VERSE,
          p_translation: TR,
          p_start: 5,
          p_end: 7,
        });
        must(!er.error, 'fn_erase_highlight_range', er.error);

        // Read back via RPC (batch)
        const rr = await supabase().rpc('fn_get_highlight_ranges', {
          p_verse_keys: [VERSE],
          p_translation: TR,
        });
        must(!rr.error && Array.isArray(rr.data), 'fn_get_highlight_ranges', rr.error ?? rr.data);
        push(`🖍️ Ranges found: ${rr.data.length}`);
        if (rr.data.length > 0) {
          const sample: Row = rr.data[0];
          push(`🖍️ Sample range: [${sample.start_offset}, ${sample.end_offset}) color=${sample.color_hex}`);
        }
      }

      // 5) Simulate visible verses batch load (200)
      push('📦 Batch-loading ~200 visible verses…');
      {
        const vs = Array.from({ length: 200 }, (_, i) => `John.3:${1 + i % 36}`);
        const { data, error } = await supabase().rpc('fn_get_highlight_ranges', {
          p_verse_keys: vs,
          p_translation: TR,
        });
        must(!error && Array.isArray(data), 'batch fn_get_highlight_ranges', error ?? data);
        push(`📦 Batch returned ${data.length} rows (ok if 0–a few).`);
      }

      // 6) Optional cleanup
      if (cleanup) {
        push('🧹 Cleanup enabled: removing self-test bookmark and note…');
        // delete the most recent bookmark/note for VERSE
        const b = await supabase()
          .from('user_bookmarks')
          .select('id')
          .eq('verse_key', VERSE)
          .eq('translation', TR)
          .order('created_at', { ascending: false })
          .limit(1);
        if (!b.error && b.data?.[0]) {
          await supabase().rpc('fn_delete_bookmark', { p_id: b.data[0].id });
          push('🧹 Deleted test bookmark.');
        }

        const n = await supabase()
          .from('user_notes')
          .select('id')
          .eq('verse_key', VERSE)
          .eq('translation', TR)
          .order('updated_at', { ascending: false })
          .limit(1);
        if (!n.error && n.data?.[0]) {
          await supabase().rpc('fn_delete_note', { p_id: n.data[0].id });
          push('🧹 Deleted test note.');
        }

        // Highlights: leave them (useful to see merges/splits). If you want to wipe, uncomment:
        // await supabase().from('user_highlight_ranges').delete().eq('verse_key', VERSE).eq('translation', TR);
        // push('🧹 Deleted test highlight ranges for the verse.');
      }

      push('🎉 All tests completed.');
    } catch (e: any) {
      push(`❌ ERROR: ${e?.message ?? e}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Bible Data Self-Test</h1>
      <div className="text-sm opacity-80">
        Verse: <code>{VERSE}</code> • Translation: <code>{TR}</code>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={run}
          disabled={loading}
        >
          {loading ? 'Running…' : 'Run Self-Test'}
        </button>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={cleanup}
            onChange={(e) => setCleanup(e.target.checked)}
          />
          Cleanup bookmark/note after test
        </label>
      </div>
      <div className="rounded border p-3 text-sm bg-gray-50 dark:bg-gray-800">
        {user ? (
          <div className="mb-2">
            <span className="font-mono">user_id:</span> {user.id}
            {user.email ? <> • <span className="font-mono">{user.email}</span></> : null}
          </div>
        ) : (
          <div className="mb-2">Not signed in.</div>
        )}
        <ol className="list-decimal ml-5 space-y-1">
          {log.map((l, i) => <li key={i}>{l}</li>)}
        </ol>
      </div>
      <p className="text-xs opacity-70">
        If anything fails with <code>permission denied</code>, make sure you're signed in and that
        the RPCs have <code>GRANT EXECUTE … TO authenticated</code>.
      </p>
    </div>
  );
}