#!/usr/bin/env node

/**
 * Generates ~100 KB offsets map for cf1 in 800 ms
 * Pipe to node scripts/build-offsets.ts cf1.txt cf1_offsets.json
 * supabase storage cp cf1_offsets.json anointed/references/
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function buildOffsets() {
  try {
    console.log('# Generates ~100 KB offsets map for cf1 in 800 ms');
    
    // Download cf1.txt from Supabase
    const { data, error } = await supabase.storage
      .from('anointed')
      .download('references/cf1.txt');
    
    if (error) {
      console.error('Error downloading cf1.txt:', error);
      return;
    }
    
    const text = await data.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    const offsets: Record<string, [number, number]> = {};
    let currentOffset = 0;
    
    lines.forEach(line => {
      const [verseID] = line.split('$$');
      if (verseID) {
        const lineLength = Buffer.byteLength(line, 'utf8') + 1; // +1 for newline
        offsets[verseID.trim()] = [currentOffset, currentOffset + lineLength];
        currentOffset += lineLength;
      }
    });
    
    // Upload offsets to Supabase
    const offsetsJson = JSON.stringify(offsets);
    const { error: uploadError } = await supabase.storage
      .from('anointed')
      .upload('references/cf1_offsets.json', offsetsJson, {
        contentType: 'application/json',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading offsets:', uploadError);
      return;
    }
    
    console.log(`✅ Generated offsets for ${Object.keys(offsets).length} verses`);
    console.log(`📁 Uploaded cf1_offsets.json to anointed/references/`);
    
  } catch (error) {
    console.error('Failed to build offsets:', error);
  }
}

buildOffsets();