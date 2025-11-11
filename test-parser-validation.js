/**
 * Test script for bible-reference-parser validation enhancement
 * 
 * This script tests that the parser now correctly validates against
 * the canonical verse key Map, fixing issues like "jn 3 16" → John.316:1
 */

import { parseReferences, toKeys } from './client/src/lib/bible-reference-parser.ts';

// Test cases
const testCases = [
  {
    input: 'jn 3 16',
    expected: 'John.3:16',
    description: 'Space-separated format (was parsing as John.316:1)'
  },
  {
    input: 'John316',
    expected: 'John.3:16',
    description: 'Compact format without space'
  },
  {
    input: 'Ps23',
    expected: 'Ps.23:1',
    description: 'Chapter-only format (should stay as chapter 23)'
  },
  {
    input: '1cor13',
    expected: '1Cor.13:1',
    description: 'Numbered book with chapter'
  },
  {
    input: 'Gen1',
    expected: 'Gen.1:1',
    description: 'Single digit chapter'
  },
  {
    input: 'Romans 8',
    expected: 'Rom.8:1',
    description: 'Full book name with chapter'
  }
];

console.log('\n🧪 Testing Bible Reference Parser Validation\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

for (const test of testCases) {
  try {
    const parsed = parseReferences(test.input);
    const keys = toKeys(parsed);
    const result = keys[0] || 'FAILED TO PARSE';
    
    const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
    
    if (result === test.expected) {
      passed++;
    } else {
      failed++;
    }
    
    console.log(`\n${status}`);
    console.log(`  Input:    "${test.input}"`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got:      ${result}`);
    console.log(`  Note:     ${test.description}`);
    
  } catch (error) {
    failed++;
    console.log(`\n❌ ERROR`);
    console.log(`  Input: "${test.input}"`);
    console.log(`  Error: ${error.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`);

if (failed === 0) {
  console.log('🎉 All tests passed! The parser validation is working correctly.\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please review the results above.\n');
  process.exit(1);
}
