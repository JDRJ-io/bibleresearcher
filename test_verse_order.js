// Test script to examine canonical vs chronological verse ordering
import { BibleDataAPI } from './client/src/data/BibleDataAPI.js';

async function compareVerseOrders() {
  console.log("=== CANONICAL VS CHRONOLOGICAL VERSE ORDER COMPARISON ===\n");
  
  try {
    // Load canonical verse keys
    console.log("Loading canonical verse keys...");
    const canonicalKeys = await BibleDataAPI.loadVerseKeys(false);
    
    // Load chronological verse keys  
    console.log("Loading chronological verse keys...");
    const chronologicalKeys = await BibleDataAPI.loadVerseKeys(true);
    
    console.log(`\nCanonical order has ${canonicalKeys.length} verses`);
    console.log(`Chronological order has ${chronologicalKeys.length} verses`);
    
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
    
    // Show differences in first 50 verses
    console.log("\n=== DIFFERENCES IN FIRST 50 VERSES ===");
    let differences = 0;
    for (let i = 0; i < 50; i++) {
      if (canonicalKeys[i] !== chronologicalKeys[i]) {
        console.log(`Position ${i + 1}: Canonical=${canonicalKeys[i]} | Chronological=${chronologicalKeys[i]}`);
        differences++;
      }
    }
    console.log(`Found ${differences} differences in first 50 verses`);
    
  } catch (error) {
    console.error("Error comparing verse orders:", error);
  }
}

compareVerseOrders();