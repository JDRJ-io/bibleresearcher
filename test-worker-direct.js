// Test the actual labels worker directly with Dan.7:3 data
console.log('🔍 Testing labels worker directly with Dan.7:3 NLT data...');

// Create a mock worker message to test the exact worker logic
const testMessage = {
  type: 'LOAD_LABELS',
  translationCode: 'NLT',
  activeLabels: ['what', 'where', 'action'],
  supabaseUrl: 'https://ecaqvxbbscwcxbjpfrdm.supabase.co'
};

// Simulate the worker logic
async function simulateWorker() {
  try {
    console.log('📡 Fetching labels from worker URL...');
    const labelsUrl = `${testMessage.supabaseUrl}/storage/v1/object/public/anointed/labels/${testMessage.translationCode}/ALL.json`;
    
    const response = await fetch(labelsUrl);
    const allLabels = await response.json();
    
    console.log('✅ Labels loaded, filtering for active labels...');
    
    // Filter to only active labels (this is what the worker does)
    const filteredLabels = {};
    Object.entries(allLabels).forEach(([verseKey, verseLabels]) => {
      const filtered = {};
      testMessage.activeLabels.forEach(labelType => {
        if (verseLabels[labelType] && verseLabels[labelType].length > 0) {
          filtered[labelType] = verseLabels[labelType];
        }
      });
      if (Object.keys(filtered).length > 0) {
        filteredLabels[verseKey] = filtered;
      }
    });
    
    console.log(`🎯 Filtered to ${Object.keys(filteredLabels).length} verses with active labels`);
    
    // Show Dan.7:3 specifically
    if (filteredLabels['Dan.7:3']) {
      console.log('\n📖 Dan.7:3 filtered labels (what worker would return):');
      console.log(JSON.stringify(filteredLabels['Dan.7:3'], null, 2));
      
      // Show bitmap calculation
      const labelBits = {
        who: 1, what: 2, when: 4, where: 8, command: 16,
        action: 32, why: 64, seed: 128, harvest: 256, prediction: 512
      };
      
      console.log('\n🎨 Bitmap values for Dan.7:3:');
      Object.entries(filteredLabels['Dan.7:3']).forEach(([type, phrases]) => {
        const bit = labelBits[type];
        console.log(`  ${type}: "${phrases.join(', ')}" → bit ${bit} (0x${bit.toString(16)})`);
      });
      
    } else {
      console.log('❌ Dan.7:3 not in filtered results');
    }
    
    return filteredLabels;
    
  } catch (error) {
    console.error('❌ Worker simulation failed:', error);
  }
}

simulateWorker();