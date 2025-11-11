// Browser console debug script - paste this into the browser console
console.log('=== COLUMN WIDTH ALIGNMENT DEBUG ===');

// Get CSS variable values
const root = document.documentElement;
const computedStyle = getComputedStyle(root);

console.log('CSS Variables:');
console.log('--column-width-mult:', computedStyle.getPropertyValue('--column-width-mult'));
console.log('--w-ref:', computedStyle.getPropertyValue('--w-ref'));
console.log('--w-main:', computedStyle.getPropertyValue('--w-main'));
console.log('--w-alt:', computedStyle.getPropertyValue('--w-alt'));
console.log('--ref-col-width:', computedStyle.getPropertyValue('--ref-col-width'));
console.log('--main-col-width:', computedStyle.getPropertyValue('--main-col-width'));
console.log('--alt-col-width:', computedStyle.getPropertyValue('--alt-col-width'));

// Get actual header widths
const headers = document.querySelectorAll('.column-header-cell');
const dataColumns = document.querySelectorAll('.bible-column');

console.log('\nHeader Elements:');
headers.forEach((header, i) => {
  const computedHeaderStyle = getComputedStyle(header);
  const dataCol = header.getAttribute('data-column');
  console.log(`Header ${i} (${dataCol}):`, {
    width: computedHeaderStyle.width,
    minWidth: computedHeaderStyle.minWidth,
    textContent: header.textContent.trim()
  });
});

console.log('\nData Column Elements:');
dataColumns.forEach((col, i) => {
  if (i < 5) { // First few only
    const computedColStyle = getComputedStyle(col);
    console.log(`Data Column ${i}:`, {
      width: computedColStyle.width,
      minWidth: computedColStyle.minWidth
    });
  }
});

console.log('\n=== MISMATCH DETECTION ===');
// Check for mismatches
const refHeader = document.querySelector('[data-column="reference"]');
const mainHeader = document.querySelector('[data-column="main"]');
const altHeader = document.querySelector('[data-column="alt-translation"]');

if (refHeader) {
  console.log('Ref header width:', getComputedStyle(refHeader).width);
}
if (mainHeader) {
  console.log('Main header width:', getComputedStyle(mainHeader).width);
}
if (altHeader) {
  console.log('Alt header width:', getComputedStyle(altHeader).width);
}