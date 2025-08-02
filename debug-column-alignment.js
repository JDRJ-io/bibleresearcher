// Quick audit script (drop-in to DevTools console)
[...document.querySelectorAll('.column-header-cell')].forEach((h, i) => {
  const d = document.querySelectorAll(`.row-0 > .cell`)[i] || 
            document.querySelectorAll(`[data-verse-ref] > div`)[i]; // fallback selector

  if (h && d) {
    console.log(
      h.dataset.column || `col-${i}`,
      'header:', getComputedStyle(h).width,
      '| cell:',  getComputedStyle(d).width
    );
  } else {
    console.log(`col-${i}`, 'header:', h ? getComputedStyle(h).width : 'NOT FOUND', 
                '| cell:', d ? getComputedStyle(d).width : 'NOT FOUND');
  }
});

// Also check CSS variables for reference
const root = getComputedStyle(document.documentElement);
console.log('\n=== CSS VARIABLES ===');
console.log('--adaptive-ref-width:', root.getPropertyValue('--adaptive-ref-width'));
console.log('--adaptive-main-width:', root.getPropertyValue('--adaptive-main-width'));
console.log('--adaptive-cross-width:', root.getPropertyValue('--adaptive-cross-width'));
console.log('--column-width-mult:', root.getPropertyValue('--column-width-mult'));

// Check portrait/landscape mode
const isPortrait = window.innerHeight > window.innerWidth;
console.log('\nMode:', isPortrait ? 'Portrait' : 'Landscape');
console.log('Viewport:', `${window.innerWidth}×${window.innerHeight}`);