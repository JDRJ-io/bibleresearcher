// Direct examination of verse order files
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecaqvxbbscwcxbjpfrdm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYXF2eGJic2N3Y3hianBmcmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjU0NzMsImV4cCI6MjA2MDI0MTQ3M30.JKdFBZv_VRdEuqP2L2A75WtdB3gY6HqP52qiuKOi2-8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function compareVerseOrders() {
  console.log("=== EXAMINING CANONICAL VS CHRONOLOGICAL VERSE ORDER ===\n");
  
  try {
    // Get canonical verse keys
    console.log("Fetching canonical verse keys...");
    const { data: canonicalData, error: canonicalError } = await supabase.storage
      .from("anointed")
      .download("metadata/verseKeys-canonical.json");
    
    if (canonicalError) throw canonicalError;
    
    const canonicalText = await canonicalData.text();
    const canonicalKeys = JSON.parse(canonicalText);
    
    // Get chronological verse keys
    console.log("Fetching chronological verse keys...");
    const { data: chronologicalData, error: chronologicalError } = await supabase.storage
      .from("anointed")
      .download("metadata/verseKeys-chronological.json");
    
    if (chronologicalError) throw chronologicalError;
    
    const chronologicalText = await chronologicalData.text();
    const chronologicalKeys = JSON.parse(chronologicalText);
    
    console.log(`\nCanonical order: ${canonicalKeys.length} verses`);
    console.log(`Chronological order: ${chronologicalKeys.length} verses`);
    
    // Show first 20 verses in each order
    console.log("\n=== FIRST 20 VERSES - CANONICAL ORDER ===");
    for (let i = 0; i < 20; i++) {
      console.log(`${i + 1}. ${canonicalKeys[i]}`);
    }
    
    console.log("\n=== FIRST 20 VERSES - CHRONOLOGICAL ORDER ===");
    for (let i = 0; i < 20; i++) {
      console.log(`${i + 1}. ${chronologicalKeys[i]}`);
    }
    
    // Find where Genesis starts in chronological order
    const genStartChronological = chronologicalKeys.findIndex(key => key.startsWith('Gen.'));
    console.log(`\nGenesis 1:1 appears at position ${genStartChronological + 1} in chronological order`);
    
    // Show key differences
    console.log("\n=== KEY DIFFERENCES ===");
    let differences = 0;
    for (let i = 0; i < Math.min(50, canonicalKeys.length); i++) {
      if (canonicalKeys[i] !== chronologicalKeys[i]) {
        console.log(`Position ${i + 1}: Canon=${canonicalKeys[i]} | Chrono=${chronologicalKeys[i]}`);
        differences++;
      }
    }
    console.log(`\nFound ${differences} differences in first 50 positions`);
    
  } catch (error) {
    console.error("Error:", error);
  }
}

compareVerseOrders();