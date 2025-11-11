
// Run this in browser console to see actual widths
const headerCell = document.querySelector('[data-column="reference"]');
const dataCell = document.querySelector('[data-verse-ref] > div:first-child');

console.log('=== ACTUAL WIDTH DEBUG ===');
if (headerCell) {
  const headerStyles = getComputedStyle(headerCell);
  console.log('Header width:', headerStyles.width);
  console.log('Header min-width:', headerStyles.minWidth);
}

if (dataCell) {
  const dataStyles = getComputedStyle(dataCell);
  console.log('Data width:', dataStyles.width);
  console.log('Data min-width:', dataStyles.minWidth);
}

// Check CSS variables
const root = getComputedStyle(document.documentElement);
console.log('--adaptive-ref-width:', root.getPropertyValue('--adaptive-ref-width'));
console.log('--ref-col-width:', root.getPropertyValue('--ref-col-width'));
console.log('--w-ref:', root.getPropertyValue('--w-ref'));

const isPortrait = window.innerHeight > window.innerWidth;
console.log('Portrait mode:', isPortrait);
