#!/usr/bin/env tsx

import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing environment variable:');
  console.error('  DATABASE_URL: required for direct PostgreSQL access');
  process.exit(1);
}

const sql = postgres(databaseUrl, {
  max: 1
});

const USER_TABLES = [
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
  'forum_comments',
  'forum_votes',
  'notes',
  'bookmarks',
  'highlights',
];

interface RLSStatus {
  schemaname: string;
  tablename: string;
  rowsecurity: boolean;
}

interface PolicyInfo {
  schemaname: string;
  tablename: string;
  policyname: string;
  cmd: string;
  qual: string;
}

async function checkRLS() {
  console.log('🔍 Supabase Row-Level Security Audit\n');
  console.log('━'.repeat(80));
  
  console.log('📊 Querying PostgreSQL metadata for RLS status...\n');

  try {
    const rlsStatus = await sql`
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    const policyCount = await sql`
      SELECT 
        c.relname as tablename,
        COUNT(p.polname) as policy_count
      FROM pg_class c
      LEFT JOIN pg_policy p ON p.polrelid = c.oid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      GROUP BY c.relname
      ORDER BY c.relname;
    `;

    const policyMap = new Map(
      policyCount.map((row: any) => [row.tablename, parseInt(row.policy_count)])
    );

    const results: { 
      table: string; 
      status: 'enabled' | 'disabled' | 'not_found';
      policyCount: number;
    }[] = [];

    for (const tableName of USER_TABLES) {
      const tableInfo = rlsStatus.find((row: any) => row.tablename === tableName);
      
      if (!tableInfo) {
        results.push({ table: tableName, status: 'not_found', policyCount: 0 });
      } else {
        const status = tableInfo.rls_enabled ? 'enabled' : 'disabled';
        const policyCount = policyMap.get(tableName) || 0;
        results.push({ table: tableName, status, policyCount });
      }
    }

    let hasIssues = false;

    results.forEach(({ table, status, policyCount }) => {
      const icon = status === 'enabled' ? '✅' : status === 'not_found' ? '⚠️' : '❌';
      const statusText = status === 'enabled' 
        ? `RLS ENABLED (${policyCount} policies)` 
        : status === 'not_found' 
        ? 'TABLE NOT FOUND' 
        : 'RLS DISABLED';
      
      console.log(`${icon} ${table.padEnd(25)} ${statusText}`);
      
      if (status === 'disabled') {
        hasIssues = true;
      } else if (status === 'enabled' && policyCount === 0) {
        console.log(`   ⚠️  Warning: RLS enabled but no policies defined!`);
        hasIssues = true;
      }
    });

    console.log('\n' + '━'.repeat(80));

    if (hasIssues) {
      console.log('\n⚠️  WARNING: Some tables have RLS issues!');
      console.log('\nTo enable RLS on a table, run:');
      console.log('  ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;');
      console.log('\nThen add appropriate policies. Example:');
      console.log('  CREATE POLICY "Users can only access their own data"');
      console.log('    ON table_name FOR ALL');
      console.log('    USING (auth.uid() = user_id);');
    } else {
      console.log('\n✅ All user-data tables have RLS enabled with policies!');
    }

    console.log('\n📋 Detailed Policy Information:');
    console.log('   Run this in Supabase SQL Editor to see policy details:\n');
    console.log(`
    SELECT 
      c.relname as table,
      p.polname as policy,
      CASE p.polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
      END as command,
      pg_get_expr(p.polqual, p.polrelid) as using_expression
    FROM pg_policy p
    JOIN pg_class c ON c.oid = p.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    ORDER BY table, policy;
  `);

  } catch (error) {
    console.error('❌ Failed to query database:', error);
    throw error;
  }
}

async function checkStoragePolicies() {
  console.log('\n\n🗄️  Storage Bucket Policy Check\n');
  console.log('━'.repeat(80));
  
  console.log('\n⚠️  Manual verification required:');
  console.log('1. Go to Supabase Dashboard → Storage');
  console.log('2. Check each bucket\'s policies');
  console.log('3. Ensure private buckets have auth.uid() checks\n');
  
  console.log('Example secure storage policy:');
  console.log(`
    -- Allow authenticated users to read their own files
    CREATE POLICY "Users can view their own files"
    ON storage.objects FOR SELECT
    USING (auth.uid()::text = (storage.foldername(name))[1]);

    -- Allow authenticated users to upload to their own folder
    CREATE POLICY "Users can upload to their own folder"
    ON storage.objects FOR INSERT
    WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
  `);
}

async function main() {
  try {
    await checkRLS();
    await checkStoragePolicies();
    
    console.log('\n' + '━'.repeat(80));
    console.log('\n🎯 Next Steps:');
    console.log('  1. Fix any tables with RLS disabled or missing policies');
    console.log('  2. Verify storage bucket policies in Supabase Dashboard');
    console.log('  3. Test policies with a non-admin user account');
    console.log('  4. Document any SECURITY DEFINER functions\n');
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
