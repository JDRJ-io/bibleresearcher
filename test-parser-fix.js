// Quick test to verify the John316 parsing fix
import { parseReferences, toKeys } from './client/src/lib/bible-reference-parser.ts';

console.log('Testing Bible Reference Parser Fix\n');
console.log('=' .repeat(50));

const testCases = [
  { input: 'John316', expected: 'John.3:16', description: 'Compact "John316" should parse as chapter 3, verse 16' },
  { input: 'Ps23', expected: 'Ps.23:1', description: 'Compact "Ps23" should parse as chapter 23, verse 1' },
  { input: '1cor13', expected: '1Cor.13:1', description: 'Compact "1cor13" should parse as chapter 13, verse 1' },
  { input: 'Gen1', expected: 'Gen.1:1', description: 'Compact "Gen1" should parse as chapter 1, verse 1' },
  { input: 'John 3:16', expected: 'John.3:16', description: 'Standard format should still work' },
];

testCases.forEach(({ input, expected, description }) => {
  try {
    const parsed = parseReferences(input);
    const keys = toKeys(parsed);
    const result = keys[0] || 'FAILED TO PARSE';
    const status = result === expected ? '✓ PASS' : '✗ FAIL';
    
    console.log(`\n${status}: ${description}`);
    console.log(`  Input:    "${input}"`);
    console.log(`  Expected: "${expected}"`);
    console.log(`  Got:      "${result}"`);
  } catch (error) {
    console.log(`\n✗ ERROR: ${description}`);
    console.log(`  Input:    "${input}"`);
    console.log(`  Error:    ${error.message}`);
  }
});

console.log('\n' + '='.repeat(50));
