
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Read the offset files
const strongsVersesContent = fs.readFileSync('strongsVersesOffsets.json', 'utf8');
const strongsIndexContent = fs.readFileSync('strongsIndexOffsets.json', 'utf8');

// Simple upload using the Supabase client
async function uploadOffsets() {
  try {
    // Use environment variables (from Secrets)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('📤 Uploading strongsVersesOffsets.json...');
    const { error: versesError } = await supabase
      .storage
      .from('anointed')
      .upload('strongs/strongsVersesOffsets.json', strongsVersesContent, { 
        upsert: true,
        contentType: 'application/json'
      });
    
    if (versesError) throw versesError;
    console.log('✅ strongsVersesOffsets.json uploaded successfully');
    
    console.log('📤 Uploading strongsIndexOffsets.json...');
    const { error: indexError } = await supabase
      .storage
      .from('anointed')
      .upload('strongs/strongsIndexOffsets.json', strongsIndexContent, { 
        upsert: true,
        contentType: 'application/json'
      });
    
    if (indexError) throw indexError;
    console.log('✅ strongsIndexOffsets.json uploaded successfully');
    
    console.log('🎉 All Strong\'s offset files uploaded to Supabase Storage!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

uploadOffsets();
