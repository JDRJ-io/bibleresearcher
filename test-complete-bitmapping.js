// Complete demonstration of Dan.7:3 bitmapping process
console.log('🔬 COMPLETE BITMAPPING DEMONSTRATION FOR DAN.7:3 NLT');
console.log('='.repeat(80));

async function demonstrateCompleteBitmapping() {
  try {
    // Step 1: Get verse text from NLT translation
    console.log('\n📖 STEP 1: Getting verse text from NLT translation');
    const nltResponse = await fetch('https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/translations/NLT.txt');
    const nltText = await nltResponse.text();
    const dan73Line = nltText.split('\n').find(line => line.startsWith('Dan.7:3#'));
    if (!dan73Line) {
      throw new Error('Dan.7:3 not found in NLT translation');
    }
    const verseText = dan73Line.split('#')[1];
    
    console.log('   Dan.7:3 NLT: "' + verseText + '"');
    
    // Step 2: Get labels from labels file
    console.log('\n🏷️  STEP 2: Getting labels from NLT labels file');
    const labelsResponse = await fetch('https://ecaqvxbbscwcxbjpfrdm.supabase.co/storage/v1/object/public/anointed/labels/NLT/ALL.json');
    const allLabels = await labelsResponse.json();
    const verseLabels = allLabels['Dan.7:3'];
    
    console.log('   Raw labels data:', JSON.stringify(verseLabels, null, 4));
    
    // Step 3: Filter for active labels (simulate what worker does)
    console.log('\n⚡ STEP 3: Worker filtering (active labels: what, where, action)');
    const activeTypes = ['what', 'where', 'action'];
    const filteredLabels = {};
    activeTypes.forEach(type => {
      if (verseLabels[type] && verseLabels[type].length > 0) {
        filteredLabels[type] = verseLabels[type];
      }
    });
    
    console.log('   Filtered labels:', JSON.stringify(filteredLabels, null, 4));
    
    // Step 4: Bitmap assignments
    console.log('\n🎨 STEP 4: Bitmap assignments');
    const labelBits = {
      who: 1,        // 0001 (binary)
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
    
    Object.entries(filteredLabels).forEach(([type, phrases]) => {
      const bit = labelBits[type];
      console.log(`   ${type}: "${phrases.join(', ')}" → bit ${bit} (binary: ${bit.toString(2).padStart(10, '0')})`);
    });
    
    // Step 5: Segmentation algorithm (sweep line)
    console.log('\n🔪 STEP 5: Text segmentation using sweep-line algorithm');
    
    // Build events array
    const events = [];
    Object.entries(filteredLabels).forEach(([type, phrases]) => {
      const bit = labelBits[type];
      phrases.forEach(phrase => {
        // Find all occurrences of phrase in verse text
        const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let match;
        while ((match = regex.exec(verseText)) !== null) {
          events.push({ pos: match.index, type: 'start', bit, phrase, labelType: type });
          events.push({ pos: match.index + match[0].length, type: 'end', bit, phrase, labelType: type });
        }
      });
    });
    
    // Sort events by position, starts before ends
    events.sort((a, b) => a.pos - b.pos || (a.type === 'start' ? -1 : 1));
    
    console.log('\n   Event sequence:');
    events.forEach((event, i) => {
      console.log(`   [${i}] pos=${event.pos} ${event.type} "${event.phrase}" (${event.labelType}) bit=${event.bit}`);
    });
    
    // Step 6: Generate segments
    console.log('\n📊 STEP 6: Generating text segments with bitmasks');
    
    let currentMask = 0;
    let lastPos = 0;
    const segments = [];
    
    events.forEach((event, i) => {
      // Add segment before this event
      if (event.pos > lastPos) {
        const segmentText = verseText.slice(lastPos, event.pos);
        segments.push({
          text: segmentText,
          mask: currentMask,
          start: lastPos,
          end: event.pos
        });
        
        console.log(`   Segment: "${segmentText}" → mask=${currentMask} (${currentMask.toString(2).padStart(10, '0')})`);
      }
      
      // Update mask based on event
      if (event.type === 'start') {
        currentMask |= event.bit;
        console.log(`   + START "${event.phrase}" → mask now ${currentMask} (${currentMask.toString(2).padStart(10, '0')})`);
      } else {
        currentMask &= ~event.bit;
        console.log(`   - END "${event.phrase}" → mask now ${currentMask} (${currentMask.toString(2).padStart(10, '0')})`);
      }
      
      lastPos = event.pos;
    });
    
    // Final segment
    if (lastPos < verseText.length) {
      const finalText = verseText.slice(lastPos);
      segments.push({
        text: finalText,
        mask: currentMask,
        start: lastPos,
        end: verseText.length
      });
      console.log(`   Final: "${finalText}" → mask=${currentMask} (${currentMask.toString(2).padStart(10, '0')})`);
    }
    
    // Step 7: CSS class mapping
    console.log('\n💄 STEP 7: CSS class mapping');
    
    const cssMap = {
      1: 'fx-bold',        // who
      2: 'fx-shadow',      // what  
      4: 'fx-under',       // when
      8: 'fx-bracket',     // where
      16: 'fx-drop-shadow', // command
      32: 'fx-ital',       // action
      64: 'fx-cursive',    // why
      128: 'fx-super-ast', // seed
      256: 'fx-super-eq',  // harvest
      512: 'fx-super-tilde' // prediction
    };
    
    console.log('\n   Final segments with CSS classes:');
    segments.forEach((segment, i) => {
      const cssClasses = [];
      Object.entries(cssMap).forEach(([bit, className]) => {
        if (segment.mask & parseInt(bit)) {
          cssClasses.push(className);
        }
      });
      
      console.log(`   [${i}] "${segment.text}" → CSS: ${cssClasses.join(' ') || 'none'}`);
    });
    
    // Step 8: HTML output simulation
    console.log('\n🌐 STEP 8: Final HTML output');
    
    let htmlOutput = '';
    segments.forEach(segment => {
      const cssClasses = [];
      Object.entries(cssMap).forEach(([bit, className]) => {
        if (segment.mask & parseInt(bit)) {
          cssClasses.push(className);
        }
      });
      
      if (cssClasses.length > 0) {
        htmlOutput += `<span class="${cssClasses.join(' ')}">${segment.text}</span>`;
      } else {
        htmlOutput += segment.text;
      }
    });
    
    console.log('\n   HTML: ' + htmlOutput);
    
    console.log('\n✅ COMPLETE BITMAPPING PROCESS DEMONSTRATED');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

demonstrateCompleteBitmapping();