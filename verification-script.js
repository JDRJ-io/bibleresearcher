/**
 * Quick verification script for user data APIs
 * Replace :uidA and :uidB with real auth user IDs from your project
 * Run this in Supabase SQL editor after the migration
 */

// Test user IDs - REPLACE THESE WITH REAL USER IDS
const uidA = 'your-user-id-a-here'; // Replace with actual user UUID
const uidB = 'your-user-id-b-here'; // Replace with actual user UUID

console.log('Running user data verification tests...');

// A) Round-trip: bookmark isolation
const bookmarkTests = `
-- A) Round-trip: bookmark isolation
INSERT INTO public.user_bookmarks (user_id, translation, verse_key) 
VALUES ('${uidA}', 'KJV', 'John.3:16')
ON CONFLICT DO NOTHING;

SELECT count(*) as a FROM public.user_bookmarks 
WHERE user_id='${uidA}' AND translation='KJV' AND verse_key='John.3:16';

SELECT count(*) as b FROM public.user_bookmarks 
WHERE user_id='${uidB}' AND translation='KJV' AND verse_key='John.3:16';
-- Expect: a=1, b=0
`;

// B) Highlights: write & read per user  
const highlightTests = `
-- B) Highlights: write & read per user
INSERT INTO public.user_highlights (user_id, translation, verse_key, segments, text_len, server_rev)
VALUES ('${uidA}', 'KJV', 'John.3:16', '[{"start":5,"end":12,"color":"yellow"}]', 25, 1)
ON CONFLICT (user_id, translation, verse_key) DO UPDATE
  SET segments=EXCLUDED.segments, text_len=EXCLUDED.text_len, server_rev=EXCLUDED.server_rev;

SELECT segments FROM public.user_highlights 
WHERE user_id='${uidA}' AND translation='KJV' AND verse_key='John.3:16';

SELECT segments FROM public.user_highlights 
WHERE user_id='${uidB}' AND translation='KJV' AND verse_key='John.3:16';
-- Expect: one row for uidA, none for uidB
`;

// C) Notes: write & read per user
const noteTests = `
-- C) Notes: write & read per user
INSERT INTO public.user_notes (user_id, translation, verse_key, note_text, server_rev)
VALUES ('${uidA}', 'KJV', 'John.3:16', 'For God so loved...', 1)
ON CONFLICT (user_id, translation, verse_key) DO UPDATE
  SET note_text=EXCLUDED.note_text, server_rev=EXCLUDED.server_rev;

SELECT note_text FROM public.user_notes 
WHERE user_id='${uidA}' AND translation='KJV' AND verse_key='John.3:16';

SELECT note_text FROM public.user_notes 
WHERE user_id='${uidB}' AND translation='KJV' AND verse_key='John.3:16';
-- Expect: value for uidA, no row for uidB
`;

// Navigation History Test
const navigationTests = `
-- D) Navigation History: write & read per user
INSERT INTO public.navigation_history (user_id, verse_reference, translation)
VALUES ('${uidA}', 'John.3:16', 'KJV');

SELECT verse_reference FROM public.navigation_history 
WHERE user_id='${uidA}' AND verse_reference='John.3:16';

SELECT verse_reference FROM public.navigation_history 
WHERE user_id='${uidB}' AND verse_reference='John.3:16';
-- Expect: one row for uidA, none for uidB
`;

// User Sessions Test
const sessionTests = `
-- E) User Sessions: write & read per user
INSERT INTO public.user_sessions (user_id, last_verse_position, current_translation)
VALUES ('${uidA}', 'John.3:16', 'KJV')
ON CONFLICT (user_id) DO UPDATE
  SET last_verse_position=EXCLUDED.last_verse_position, current_translation=EXCLUDED.current_translation;

SELECT last_verse_position FROM public.user_sessions 
WHERE user_id='${uidA}';

SELECT last_verse_position FROM public.user_sessions 
WHERE user_id='${uidB}';
-- Expect: value for uidA, no row for uidB
`;

// RLS Policy Verification
const rlsTests = `
-- F) RLS Policy verification
SELECT schemaname, tablename, rowsecurity, hasrls 
FROM pg_tables 
WHERE tablename IN ('user_bookmarks', 'user_notes', 'user_highlights', 'navigation_history', 'user_sessions');
-- Expect: hasrls=true for all tables

SELECT policyname, tablename, permissive, roles
FROM pg_policies 
WHERE tablename IN ('user_bookmarks', 'user_notes', 'user_highlights', 'navigation_history', 'user_sessions');
-- Expect: policies exist for each table
`;

console.log('BOOKMARK TESTS:');
console.log(bookmarkTests);

console.log('\nHIGHLIGHT TESTS:');
console.log(highlightTests);

console.log('\nNOTE TESTS:');
console.log(noteTests);

console.log('\nNAVIGATION TESTS:');
console.log(navigationTests);

console.log('\nSESSION TESTS:');
console.log(sessionTests);

console.log('\nRLS VERIFICATION:');
console.log(rlsTests);

console.log('\nINSTRUCTIONS:');
console.log('1. Replace uidA and uidB with real user UUIDs from your auth.users table');
console.log('2. Run each test block in Supabase SQL editor');  
console.log('3. Verify isolation: user A sees their data, user B sees none');
console.log('4. Check RLS is enabled and policies exist');