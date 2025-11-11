import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestResult {
  table: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function testTableRLS(tableName: string): Promise<void> {
  console.log(`\nTesting RLS on table: ${tableName}`);
  
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('permission denied') || 
          error.message.includes('row-level security') ||
          error.message.includes('no rows') ||
          error.code === 'PGRST301' || // No rows returned
          error.code === '42501') {    // Insufficient privilege
        results.push({
          table: tableName,
          passed: true,
          message: `✓ RLS blocked unauthorized access: ${error.message}`
        });
        console.log(`  ✓ RLS is working (blocked)`);
      } else {
        results.push({
          table: tableName,
          passed: false,
          message: `⚠ Unexpected error: ${error.message}`
        });
        console.log(`  ⚠ Unexpected error: ${error.message}`);
      }
    } else if (!data || data.length === 0) {
      results.push({
        table: tableName,
        passed: true,
        message: '✓ No data leaked (empty result set)'
      });
      console.log(`  ✓ No data leaked`);
    } else {
      results.push({
        table: tableName,
        passed: false,
        message: `❌ RLS FAIL: Unauthenticated user accessed ${data.length} row(s)`
      });
      console.log(`  ❌ RLS FAIL: Unauthenticated user accessed data`);
      console.log(`  Sample leaked data:`, JSON.stringify(data[0], null, 2));
    }
  } catch (err: any) {
    results.push({
      table: tableName,
      passed: false,
      message: `❌ Test error: ${err.message}`
    });
    console.log(`  ❌ Test error: ${err.message}`);
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('RLS SMOKE TEST - Unauthenticated Access Attempt');
  console.log('='.repeat(60));
  console.log('Testing with anonymous (unauthenticated) Supabase client');
  console.log('Expected: All user data tables should block access\n');

  const userTables = [
    'user_notes',
    'user_bookmarks',
    'user_highlights',
    'user_preferences',
    'user_sessions',
    'user_positions',
    'navigation_history',
    'hyperlink_clicks',
    'profiles',
    'forum_posts',
    'forum_votes',
    // Legacy tables
    'notes',
    'bookmarks',
    'highlights',
  ];

  for (const table of userTables) {
    await testTableRLS(table);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\n✓ Passed: ${passed}/${results.length}`);
  console.log(`✗ Failed: ${failed}/${results.length}\n`);

  if (failed > 0) {
    console.log('FAILED TESTS:');
    results
      .filter(r => !r.passed)
      .forEach(r => console.log(`  - ${r.table}: ${r.message}`));
    console.log('\n⚠️  WARNING: Some tables allow unauthorized access!');
    console.log('Review and fix RLS policies in Supabase SQL Editor.\n');
    process.exit(1);
  } else {
    console.log('✅ All tables are properly protected by RLS');
    console.log('No unauthorized access detected.\n');
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running RLS tests:', err);
  process.exit(1);
});
