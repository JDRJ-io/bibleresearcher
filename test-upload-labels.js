import { supabase } from './client/src/lib/supabaseClient.js';
import fs from 'fs';

// Create comprehensive sample labels data
const sampleLabelsData = {
  "Gen.1:1": {
    "who": ["God"],
    "what": ["heaven", "earth"],
    "when": ["In the beginning"],
    "action": ["created"]
  },
  "Gen.1:2": {
    "what": ["earth"],
    "where": ["deep", "waters"],
    "action": ["was", "moved"]
  },
  "Gen.1:3": {
    "who": ["God"],
    "what": ["Light"],
    "command": ["Let there be light"],
    "action": ["said"]
  },
  "Gen.1:4": {
    "who": ["God"],
    "what": ["light", "darkness"],
    "action": ["saw", "divided"]
  },
  "Gen.1:5": {
    "who": ["God"],
    "what": ["light", "darkness"],
    "when": ["Day", "Night", "evening", "morning"],
    "action": ["called"]
  },
  "Gen.4:16": {
    "who": ["Cain"],
    "where": ["land of Nod", "east of Eden"],
    "action": ["went out", "dwelt"]
  },
  "Gen.4:17": {
    "who": ["Cain", "his wife"],
    "what": ["city", "son"],
    "action": ["knew", "conceived", "bare", "builded", "called"]
  },
  "Gen.4:18": {
    "who": ["Irad", "Enoch", "Mehujael", "Methusael", "Lamech"],
    "action": ["begat"]
  },
  "Gen.4:19": {
    "who": ["Lamech"],
    "what": ["wives"],
    "action": ["took"]
  },
  "Gen.4:20": {
    "who": ["Adah", "Jabal"],
    "what": ["son", "cattle", "tents"],
    "action": ["bare", "dwell"]
  },
  "Gen.4:21": {
    "who": ["Jubal"],
    "what": ["harp", "organ"],
    "action": ["handle"]
  }
};

async function uploadLabelsFile() {
  try {
    const jsonContent = JSON.stringify(sampleLabelsData, null, 2);
    
    console.log('Uploading labels file to anointed/labels/KJV/all.json...');
    console.log('File size:', jsonContent.length, 'characters');
    console.log('Verses with labels:', Object.keys(sampleLabelsData).length);
    
    const { data, error } = await supabase
      .storage
      .from('anointed')
      .upload('labels/KJV/all.json', jsonContent, {
        contentType: 'application/json',
        upsert: true
      });
    
    if (error) {
      console.error('Upload failed:', error);
      return;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Test download to verify
    console.log('\nTesting download...');
    const { data: downloadData, error: downloadError } = await supabase
      .storage
      .from('anointed')
      .download('labels/KJV/all.json');
    
    if (downloadError) {
      console.error('Download test failed:', downloadError);
      return;
    }
    
    const downloadedText = await downloadData.text();
    const parsedData = JSON.parse(downloadedText);
    
    console.log('✅ Download test successful');
    console.log('Downloaded verses:', Object.keys(parsedData).length);
    console.log('Sample data for Gen.1:1:', parsedData['Gen.1:1']);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadLabelsFile();