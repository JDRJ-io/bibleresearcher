#!/usr/bin/env node

/**
 * Architecture Validation Script
 * Ensures no direct Supabase/fetch calls outside the BibleDataAPI facade
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const FACADE_FILE = 'client/src/data/BibleDataAPI.ts';
const ALLOWED_FETCH_FILES = [
  'client/src/data/BibleDataAPI.ts',
  'client/src/lib/supabaseLoader.ts', // Uses signed URLs - allowed
  'client/src/lib/queryClient.ts'     // TanStack Query - allowed
];

function getAllTsFiles(dir) {
  const files = [];
  const items = readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      files.push(...getAllTsFiles(fullPath));
    } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

function validateArchitecture() {
  console.log('🔍 Validating React anchor-based architecture...');
  
  const clientFiles = getAllTsFiles('client/src');
  const violations = [];
  
  for (const file of clientFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Check for direct Supabase imports outside facade
    if (file !== FACADE_FILE && content.includes('from @supabase/supabase-js')) {
      violations.push({
        file,
        line: lines.findIndex(line => line.includes('from @supabase/supabase-js')) + 1,
        message: 'Direct Supabase import outside facade - use BibleDataAPI instead'
      });
    }
    
    // Check for direct fetch calls outside allowed files
    if (!ALLOWED_FETCH_FILES.includes(file)) {
      lines.forEach((line, index) => {
        if (line.includes('fetch(') && !line.includes('//') && !line.includes('*')) {
          violations.push({
            file,
            line: index + 1,
            message: 'Direct fetch call outside facade - use BibleDataAPI instead'
          });
        }
      });
    }
    
    // Check for direct DOM manipulation outside guard hooks
    if (!file.includes('hooks/use') && 
        !file.includes('main.tsx') && 
        !file.includes('callback.tsx') &&
        !file.includes('supabaseClient.ts') &&
        !file.includes('sidebar.tsx') &&
        !file.includes('queueSync.ts')) {
      lines.forEach((line, index) => {
        if ((line.includes('document.') || line.includes('window.')) && 
            !line.includes('//') && !line.includes('*') && 
            !line.includes('import.meta.env') &&
            !line.includes('document.getElementById') &&
            !line.includes('document.querySelector') &&
            !line.includes('window.getSelection')) {
          violations.push({
            file,
            line: index + 1,
            message: 'Direct DOM access outside guard hooks - use useBodyClass/useHashParams/useTextSelection'
          });
        }
      });
    }
  }
  
  if (violations.length > 0) {
    console.log('❌ Architecture violations found:');
    violations.forEach(v => {
      console.log(`  ${v.file}:${v.line} - ${v.message}`);
    });
    process.exit(1);
  } else {
    console.log('✅ Architecture validation passed - all components follow facade pattern');
  }
}

// Run validation
validateArchitecture();