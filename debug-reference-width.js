
// Debug Reference Column Width Mismatch
// Run this in browser console to see exact width differences

console.log('=== REFERENCE COLUMN WIDTH ANALYSIS ===');

// Get the reference header and first reference data cell
const refHeader = document.querySelector('.column-header-cell[data-column="reference"]');
const firstDataRow = document.querySelector('[data-verse-ref]');
const firstRefCell = firstDataRow?.querySelector('.cell-ref')?.parentElement;

if (!refHeader || !firstRefCell) {
  console.error('Could not find reference header or data cell');
} else {
  const headerStyle = getComputedStyle(refHeader);
  const cellStyle = getComputedStyle(firstRefCell);
  
  console.log('Reference Header:');
  console.log('- width:', headerStyle.width);
  console.log('- padding:', headerStyle.padding);
  console.log('- margin:', headerStyle.margin);
  console.log('- border:', headerStyle.border);
  console.log('- box-sizing:', headerStyle.boxSizing);
  
  console.log('\nReference Data Cell:');
  console.log('- width:', cellStyle.width);
  console.log('- padding:', cellStyle.padding);
  console.log('- margin:', cellStyle.margin);
  console.log('- border:', cellStyle.border);
  console.log('- box-sizing:', cellStyle.boxSizing);
  
  // Calculate actual pixel difference
  const headerWidth = parseFloat(headerStyle.width);
  const cellWidth = parseFloat(cellStyle.width);
  const difference = headerWidth - cellWidth;
  
  console.log('\n=== DIFFERENCE ANALYSIS ===');
  console.log(`Header width: ${headerWidth}px`);
  console.log(`Cell width: ${cellWidth}px`);
  console.log(`Difference: ${difference}px`);
  
  // Check CSS variables being used
  const rootStyle = getComputedStyle(document.documentElement);
  console.log('\n=== CSS VARIABLES ===');
  console.log('--adaptive-ref-width:', rootStyle.getPropertyValue('--adaptive-ref-width'));
  console.log('--ref-col-width:', rootStyle.getPropertyValue('--ref-col-width'));
  console.log('--w-ref:', rootStyle.getPropertyValue('--w-ref'));
  
  // Check viewport info
  console.log('\n=== VIEWPORT INFO ===');
  console.log('Window width:', window.innerWidth);
  console.log('Window height:', window.innerHeight);
  console.log('Orientation:', window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape');
}
