// Direct test of labels worker for Dan.7:3 in NLT
// This will show exactly what labels are found and what bitmasks are generated

async function testLabelsForDan73() {
  console.log('🔍 Testing labels for Dan.7:3 in NLT translation...');
  
  try {
    // First, let's fetch the labels file directly
    const labelsUrl = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/labels/NLT/ALL.json';
    
    const response = await fetch(labelsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch labels: ${response.status}`);
    }
    
    const labelsData = await response.json();
    console.log('✅ Labels file loaded successfully');
    
    // Look for Dan.7:3 specifically
    const verseKey = 'Dan.7:3';
    const verseLabels = labelsData[verseKey];
    
    console.log(`\n📖 Labels for ${verseKey}:`);
    if (verseLabels) {
      console.log(JSON.stringify(verseLabels, null, 2));
      
      // Now let's get the verse text to see what would be highlighted
      console.log(`\n📝 Verse text needed for Dan.7:3 in NLT to test highlighting...`);
      
      // Calculate bitmasks for each label category
      console.log(`\n🎨 Bitmask calculations:`);
      
      const labelBits = {
        who: 1,        // 0001
        what: 2,       // 0010  
        when: 4,       // 0100
        where: 8,      // 1000
        command: 16,   // 10000
        action: 32,    // 100000
        why: 64,       // 1000000
        seed: 128,     // 10000000
        harvest: 256,  // 100000000
        prediction: 512 // 1000000000
      };
      
      Object.entries(verseLabels).forEach(([labelType, phrases]) => {
        if (phrases && phrases.length > 0) {
          const bitValue = labelBits[labelType];
          console.log(`  ${labelType}: ${phrases.join(', ')} → bitmask: ${bitValue} (binary: ${bitValue.toString(2).padStart(10, '0')})`);
        }
      });
      
    } else {
      console.log(`❌ No labels found for ${verseKey}`);
      
      // Let's check what verses ARE in the file
      const allVerses = Object.keys(labelsData);
      const danVerses = allVerses.filter(v => v.startsWith('Dan.'));
      console.log(`\n📚 Daniel verses found in labels file (first 10):`, danVerses.slice(0, 10));
    }
    
  } catch (error) {
    console.error('❌ Error testing labels:', error);
  }
}

testLabelsForDan73();