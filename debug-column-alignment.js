
// Column Alignment Diagnostic Script - Run in browser console
console.log('=== COLUMN ALIGNMENT AUDIT ===');

// Get all header cells and data cells from first row
const headerCells = [...document.querySelectorAll('.column-header-cell')];
const dataCells = [...document.querySelectorAll('[data-verse-ref] > div')]; // VirtualRow children

console.log('Found headers:', headerCells.length, 'Found data cells:', dataCells.length);

if (headerCells.length === 0) {
  console.log('❌ No header cells found - check selector .column-header-cell');
}

if (dataCells.length === 0) {
  console.log('❌ No data cells found - check selector [data-verse-ref] > div');
}

// Audit each column pair
const mismatches = [];
headerCells.forEach((header, i) => {
  const dataCell = dataCells[i];
  if (!dataCell) {
    console.log(`⚠️  Column ${i}: No matching data cell`);
    return;
  }

  const headerStyles = getComputedStyle(header);
  const dataStyles = getComputedStyle(dataCell);
  
  const headerWidth = headerStyles.width;
  const dataWidth = dataStyles.width;
  const match = headerWidth === dataWidth;
  
  const result = {
    column: header.dataset.column || `col-${i}`,
    headerWidth,
    dataWidth,
    match,
    headerPadding: headerStyles.padding,
    dataPadding: dataStyles.padding,
    headerMargin: headerStyles.margin,
    dataMargin: dataStyles.margin,
    headerBorder: headerStyles.borderRight,
    dataBorder: dataStyles.borderRight,
    headerBoxSizing: headerStyles.boxSizing,
    dataBoxSizing: dataStyles.boxSizing
  };
  
  console.log(
    `${match ? '✅' : '❌'} ${result.column}:`,
    `header: ${headerWidth} | data: ${dataWidth}`,
    match ? '' : '← MISMATCH'
  );
  
  if (!match) {
    mismatches.push(result);
    console.log(`   Header padding: ${result.headerPadding}, Data padding: ${result.dataPadding}`);
    console.log(`   Header border: ${result.headerBorder}, Data border: ${result.dataBorder}`);
  }
});

console.log('\n=== SUMMARY ===');
console.log(`Total columns: ${headerCells.length}`);
console.log(`Mismatched columns: ${mismatches.length}`);

if (mismatches.length > 0) {
  console.log('\n❌ MISMATCHES FOUND:');
  mismatches.forEach(m => {
    console.log(`- ${m.column}: ${m.headerWidth} vs ${m.dataWidth}`);
  });
} else {
  console.log('✅ All columns aligned perfectly!');
}

// Check CSS variables being used
console.log('\n=== CSS VARIABLES ===');
const root = getComputedStyle(document.documentElement);
console.log('--adaptive-ref-width:', root.getPropertyValue('--adaptive-ref-width'));
console.log('--adaptive-main-width:', root.getPropertyValue('--adaptive-main-width'));
console.log('--adaptive-cross-width:', root.getPropertyValue('--adaptive-cross-width'));
console.log('--column-width-mult:', root.getPropertyValue('--column-width-mult'));
