// COLUMN ALIGNMENT DEBUGGER - Visual verification
console.log('🔍 COLUMN ALIGNMENT DEBUG');

// Add visual debug borders
const debugStyle = document.createElement('style');
debugStyle.innerHTML = `
  .column-header-cell { outline: 2px solid red !important; outline-offset: -1px !important; }
  .row .cell { outline: 2px solid blue !important; outline-offset: -1px !important; }
  .column-header-cell[data-column="reference"] { outline-color: orange !important; }
  .cell[data-column="reference"], .cell-ref { outline-color: orange !important; }
`;
document.head.appendChild(debugStyle);

// Quick Column Width Audit
[...document.querySelectorAll('.column-header-cell')].forEach((h, i) => {
  const d = document.querySelectorAll(`[data-verse-ref] > div`)[i];
  if (h && d) {
    const hWidth = getComputedStyle(h).width;
    const dWidth = getComputedStyle(d).width;
    const match = hWidth === dWidth ? '✅' : '❌';
    console.log(`${match} ${h.dataset.column || `col-${i}`}: header=${hWidth} | data=${dWidth}`);
  }
});

// Check CSS Variables
const root = getComputedStyle(document.documentElement);
console.log('🎯 CSS Variables:', {
  refWidth: root.getPropertyValue('--adaptive-ref-width'),
  mainWidth: root.getPropertyValue('--adaptive-main-width'),
  crossWidth: root.getPropertyValue('--adaptive-cross-width')
});

// Remove debug borders after 5 seconds
setTimeout(() => {
  document.head.removeChild(debugStyle);
  console.log('🧹 Debug borders removed');
}, 5000);