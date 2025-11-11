# Browser Testing Guide

This guide provides console snippets for testing Supabase integration, navigation history, and RLS policies directly in the browser.

## Prerequisites

- Open the app in your browser
- Open DevTools (F12 or Cmd+Option+I)
- Navigate to the Console tab
- Ensure you're logged in for testing authenticated features

## Table of Contents

1. [Setup: Load Supabase Client](#setup-load-supabase-client)
2. [Test Navigation History](#test-navigation-history)
3. [Test RLS Policies](#test-rls-policies)
4. [Test User Data APIs](#test-user-data-apis)

---

## Setup: Load Supabase Client

First, ensure the Supabase client is available on the window object for testing.

```javascript
// This snippet loads supabase-js and creates a client instance
(async () => {
  // Load supabase-js if needed
  if (!window.supabase) {
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  // Create (or reuse) a singleton on window
  window.__sb = window.__sb || window.supabase.createClient(
    'https://ecaqvxbbscwcxbjpfrdm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYXF2eGJic2N3Y3hianBmcmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTA2MTQsImV4cCI6MjA2MTA2NjYxNH0.yZgEijr7c_oAFu2oYWD4YCmrbusoWL3wgsAi757CCU8',
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  console.log('✅ Supabase client ready:', window.__sb);
})();
```

**Note:** The anon key is meant to be public; never expose your service role key.

---

## Test Navigation History

### Basic Insert Test

```javascript
// Test inserting a navigation history entry
(async () => {
  const sb = window.__sb;
  if (!sb) { console.error('❌ Supabase client not loaded'); return; }

  const { data: { user }, error: userErr } = await sb.auth.getUser();
  if (userErr) { console.error('auth.getUser error:', userErr); return; }
  if (!user) { console.warn('Not signed in — sign in first.'); return; }

  // Insert test entry (let DB set user_id via default auth.uid())
  const { data, error } = await sb
    .from('navigation_history')
    .insert({ verse_reference: 'John.3:16', translation: 'NKJV' })
    .select();

  console.log('Insert result:', error || data);
})();
```

### Load Recent History

```javascript
// Load last 15 navigation entries
(async () => {
  const sb = window.__sb;
  if (!sb) { console.error('❌ Supabase client not loaded'); return; }

  const { data: { user }, error: userErr } = await sb.auth.getUser();
  if (userErr) { console.error('auth.getUser error:', userErr); return; }
  if (!user) { console.warn('Not signed in'); return; }

  const { data, error } = await sb
    .from('navigation_history')
    .select('verse_reference, translation, visited_at')
    .order('visited_at', { ascending: false })
    .limit(15);

  console.log('Recent history:', error || data);
})();
```

### Test Cleanup RPC

```javascript
// Test the cleanup RPC (keeps newest 15 entries)
(async () => {
  const sb = window.__sb;
  if (!sb) { console.error('❌ Supabase client not loaded'); return; }

  const { data: { user }, error: userErr } = await sb.auth.getUser();
  if (userErr) { console.error('auth.getUser error:', userErr); return; }
  if (!user) { console.warn('Not signed in'); return; }

  const { data, error } = await sb.rpc('cleanup_nav_history', { p_keep: 15 });
  
  if (error) {
    console.error('❌ Cleanup failed:', error);
  } else {
    console.log('✅ Cleanup successful');
  }
})();
```

---

## Test RLS Policies

### Verify User Isolation

```javascript
// Verify that you only see your own navigation history
(async () => {
  const sb = window.__sb;
  if (!sb) { console.error('❌ Supabase client not loaded'); return; }

  const { data: { user }, error: userErr } = await sb.auth.getUser();
  if (userErr) { console.error('auth.getUser error:', userErr); return; }
  if (!user) { console.warn('Not signed in'); return; }

  console.log('Current user ID:', user.id);

  // Try to read all navigation history (should only return your own)
  const { data, error } = await sb
    .from('navigation_history')
    .select('*');

  if (error) {
    console.error('❌ Query failed:', error);
  } else {
    console.log('✅ Your navigation history entries:', data.length);
    console.log('All user_ids match?', data.every(row => row.user_id === user.id));
  }
})();
```

---

## Test User Data APIs

### Test Bookmarks

```javascript
// Test bookmark toggle
(async () => {
  const sb = window.__sb;
  if (!sb) { console.error('❌ Supabase client not loaded'); return; }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) { console.warn('Not signed in'); return; }

  const verseKey = 'John.3:16';
  const translation = 'KJV';

  // Check if bookmark exists
  const { data: existing } = await sb
    .from('user_bookmarks')
    .select('id')
    .eq('verse_key', verseKey)
    .eq('translation', translation)
    .maybeSingle();

  if (existing) {
    // Delete bookmark
    const { error } = await sb
      .from('user_bookmarks')
      .delete()
      .eq('id', existing.id);
    console.log(error ? '❌ Delete failed:' : '✅ Bookmark removed', error);
  } else {
    // Create bookmark
    const { error } = await sb
      .from('user_bookmarks')
      .insert({ verse_key: verseKey, translation: translation });
    console.log(error ? '❌ Insert failed:' : '✅ Bookmark created', error);
  }
})();
```

### Test Notes

```javascript
// Test saving a note
(async () => {
  const sb = window.__sb;
  if (!sb) { console.error('❌ Supabase client not loaded'); return; }

  const { data: { user } } = await sb.auth.getUser();
  if (!user) { console.warn('Not signed in'); return; }

  const { error } = await sb
    .from('user_notes')
    .upsert({
      verse_key: 'John.3:16',
      translation: 'KJV',
      note_text: 'For God so loved the world...',
    });

  console.log(error ? '❌ Note save failed:' : '✅ Note saved', error);
})();
```

---

## Complete Restore Flow Test

This snippet tests the entire restore flow: instant mount from cache, then hydrate from server.

```javascript
(async () => {
  // Ensure supabase client
  if (!window.supabase) {
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = resolve;
      document.head.appendChild(s);
    });
  }

  window.__sb = window.__sb || window.supabase.createClient(
    'https://ecaqvxbbscwcxbjpfrdm.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYXF2eGJic2N3Y3hianBmcmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTA2MTQsImV4cCI6MjA2MTA2NjYxNH0.yZgEijr7c_oAFu2oYWD4YCmrbusoWL3wgsAi757CCU8',
    { auth: { persistSession: true, autoRefreshToken: true } }
  );

  const getSb = async (timeoutMs = 1500) => {
    const t0 = performance.now();
    while (performance.now() - t0 < timeoutMs) {
      if (window.__sb) return window.__sb;
      await new Promise(r => setTimeout(r, 25));
    }
    return null;
  };

  const readLocal = () => {
    try { return JSON.parse(localStorage.getItem('anointed:lastLocation') || 'null'); }
    catch { return null; }
  };
  
  const writeLocal = (v, tr) => {
    try { localStorage.setItem('anointed:lastLocation', JSON.stringify({ v, tr, t: Date.now() })); }
    catch {}
  };

  // Instant mount from cache/URL
  const parseHashVerse = () => {
    const h = (location.hash || '').replace(/^#/, '').trim();
    return h && /^[A-Za-z]+\.\d+:\d+$/.test(h) ? h : null;
  };
  
  const cached = readLocal();
  const initialVerse = parseHashVerse() ?? cached?.v ?? 'John.3:16';
  const initialTr = cached?.tr ?? 'NKJV';
  console.log('[restore] instant mount ->', initialVerse, initialTr);

  // Hydrate from server (pointer + history) without blocking UI
  const sb = await getSb();
  if (!sb) return;
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  // Try combined RPC first
  const combined = await sb.rpc('bke_restore_state', { p_limit: 50 });
  if (!combined.error && combined.data?.length) {
    const row = combined.data[0];
    if (row?.verse_reference && row.verse_reference !== initialVerse) {
      console.log('[restore] snap to server pointer ->', row.verse_reference, row.translation);
      writeLocal(row.verse_reference, row.translation);
    }
    if (row?.recent) {
      console.log('[restore] recent history count:', row.recent.length);
    }
    return;
  }

  // Fallback: separate queries
  const ptr = await sb
    .from('user_last_location')
    .select('verse_reference, translation, updated_at')
    .single();

  if (!ptr.error && ptr.data) {
    const localTs = cached?.t ?? 0;
    const serverTs = new Date(ptr.data.updated_at).getTime();
    if (serverTs > localTs && ptr.data.verse_reference !== initialVerse) {
      console.log('[restore] snap to server pointer ->', ptr.data.verse_reference, ptr.data.translation);
      writeLocal(ptr.data.verse_reference, ptr.data.translation);
    }
  }

  // Recent history
  const hist = await sb
    .from('navigation_history')
    .select('verse_reference, translation, visited_at')
    .order('visited_at', { ascending: false })
    .limit(50);

  console.log('[restore] recent history result:', hist.error || `${hist.data?.length} entries`);
})();
```

---

## Troubleshooting

### Error: "Supabase client not exposed"
- Make sure you ran the setup snippet first
- Check that `window.__sb` exists: `console.log(window.__sb)`
- Ensure `supabaseClient.ts` is imported at app boot

### Error: "403 Forbidden"
- Your RLS policies are working (this is good!)
- Make sure you're signed in: `await window.__sb.auth.getUser()`
- Check that the policy uses `auth.uid() = user_id`

### Error: "column created_at does not exist"
- The `navigation_history` table uses `visited_at` not `created_at`
- Update any queries to use `visited_at`
- Check the migration file has the correct column names

---

## Notes

- All snippets use fire-and-forget promises to avoid blocking the UI
- The anon key is safe to expose in client code
- Never expose the service role key in browser console or client code
- Use DEV-only console logs; remove in production builds
