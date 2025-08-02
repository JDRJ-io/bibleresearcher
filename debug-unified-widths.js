
// Debug script to verify unified width system
console.log('=== UNIFIED WIDTH SYSTEM DEBUG ===');

const isPortrait = window.innerHeight > window.innerWidth;
console.log('Mode:', isPortrait ? 'Portrait' : 'Landscape');

if (isPortrait) {
  // Check adaptive width CSS variables
  const root = getComputedStyle(document.documentElement);
  console.log('Portrait Adaptive Widths:');
  console.log('--adaptive-ref-width:', root.getPropertyValue('--adaptive-ref-width'));
  console.log('--adaptive-main-width:', root.getPropertyValue('--adaptive-main-width'));
  console.log('--adaptive-cross-width:', root.getPropertyValue('--adaptive-cross-width'));
} else {
  // Check unified CSS variables
  const root = getComputedStyle(document.documentElement);
  console.log('Landscape Unified Widths:');
  console.log('--unified-ref-width:', root.getPropertyValue('--unified-ref-width'));
  console.log('--unified-main-width:', root.getPropertyValue('--unified-main-width'));
  console.log('--unified-cross-width:', root.getPropertyValue('--unified-cross-width'));
}

// Check actual element widths
const headerCell = document.querySelector('[data-column="reference"]');
const dataCell = document.querySelector('[data-verse-ref] > div:first-child');

if (headerCell && dataCell) {
  const headerWidth = getComputedStyle(headerCell).width;
  const dataWidth = getComputedStyle(dataCell).width;
  
  console.log('\nActual Element Widths:');
  console.log('Header:', headerWidth);
  console.log('Data:', dataWidth);
  console.log('Match:', headerWidth === dataWidth ? 'YES ✅' : 'NO ❌');
} else {
  console.log('Elements not found for comparison');
}
