// Debug script to check actual computed widths
console.log('=== COLUMN WIDTH DEBUG ===');

// Check CSS variables
const root = document.documentElement;
const refWidth = getComputedStyle(root).getPropertyValue('--w-ref');
const adaptiveRefWidth = getComputedStyle(root).getPropertyValue('--adaptive-ref-width');
const columnWidthMult = getComputedStyle(root).getPropertyValue('--column-width-mult');

console.log('CSS Variables:');
console.log('--w-ref:', refWidth);
console.log('--adaptive-ref-width:', adaptiveRefWidth);
console.log('--column-width-mult:', columnWidthMult);

// Check header element
const headerCell = document.querySelector('[data-column="reference"]');
if (headerCell) {
  const headerStyles = getComputedStyle(headerCell);
  console.log('\nHeader Cell:');
  console.log('Computed width:', headerStyles.width);
  console.log('Computed min-width:', headerStyles.minWidth);
}

// Check data row element
const dataCell = document.querySelector('[data-verse-ref] > div:first-child');
if (dataCell) {
  const dataStyles = getComputedStyle(dataCell);
  console.log('\nData Cell:');
  console.log('Computed width:', dataStyles.width);
  console.log('Computed min-width:', dataStyles.minWidth);
}

// Check if portrait or landscape
const isPortrait = window.innerHeight > window.innerWidth;
console.log('\nMode:', isPortrait ? 'Portrait' : 'Landscape');