// Direct test to verify labels are working end-to-end
console.log('🧪 TESTING COMPLETE LABELS PIPELINE');

// 1. Test label data can be fetched
async function testLabelFetch() {
  const url = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/labels/KJV/ALL.json';
  const res = await fetch(url);
  const data = await res.json();
  
  console.log('✅ Label data fetched:', Object.keys(data).length, 'verses');
  console.log('📝 Genesis 1:1 labels:', data['Gen.1:1']);
  
  return data;
}

// 2. Test label rendering logic
function testLabelRendering(text, labels, activeLabels) {
  console.log('\n🎨 Testing label rendering:');
  console.log('Text:', text);
  console.log('Labels:', labels);
  console.log('Active:', activeLabels);
  
  // Simulate what LabeledText should do
  const segments = [];
  let lastEnd = 0;
  
  // For each active label type
  for (const labelType of activeLabels) {
    if (labels[labelType]) {
      for (const phrase of labels[labelType]) {
        const index = text.indexOf(phrase);
        if (index >= 0) {
          // Add non-labeled text before this phrase
          if (index > lastEnd) {
            segments.push({ start: lastEnd, end: index, mask: 0, text: text.slice(lastEnd, index) });
          }
          // Add labeled phrase
          segments.push({ 
            start: index, 
            end: index + phrase.length, 
            mask: 1 << ['who', 'what', 'when', 'where', 'command', 'action', 'why', 'seed', 'harvest', 'prediction'].indexOf(labelType),
            text: phrase,
            labelType 
          });
          lastEnd = index + phrase.length;
        }
      }
    }
  }
  
  // Add remaining text
  if (lastEnd < text.length) {
    segments.push({ start: lastEnd, end: text.length, mask: 0, text: text.slice(lastEnd) });
  }
  
  // Sort segments by position
  segments.sort((a, b) => a.start - b.start);
  
  console.log('📊 Segments:', segments);
  
  // Show how it would render
  console.log('\n🖼️ Rendered output:');
  segments.forEach(seg => {
    if (seg.mask > 0) {
      console.log(`  [${seg.labelType}] "${seg.text}" (with styling)`);
    } else {
      console.log(`  [plain] "${seg.text}"`);
    }
  });
}

// 3. Test the actual store state
function testStoreState() {
  console.log('\n🏪 Testing store state:');
  
  // This would need to be run in the browser console where the app is loaded
  if (typeof useBibleStore !== 'undefined') {
    const state = useBibleStore.getState();
    console.log('Active labels:', state.activeLabels);
    console.log('Main translation:', state.translationState?.main);
  } else {
    console.log('⚠️ Store not available in this context');
  }
}

// Run tests
(async () => {
  try {
    // Test 1: Fetch labels
    const labelData = await testLabelFetch();
    
    // Test 2: Render Genesis 1:1 with "what" labels
    const gen11Text = "In the beginning God created the heaven and the earth.";
    const gen11Labels = labelData['Gen.1:1'];
    testLabelRendering(gen11Text, gen11Labels, ['what']);
    
    // Test 3: Check store
    testStoreState();
    
    console.log('\n✅ All tests complete! Check results above.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();