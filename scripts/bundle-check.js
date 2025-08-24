#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

async function checkBundleSize() {
  try {
    // Run build
    console.log('🔍 Building project...');
    await execAsync('npm run build');
    
    // Check main bundle size
    const indexPath = join(process.cwd(), 'dist/assets/index.js');
    const stats = statSync(indexPath);
    const sizeInMB = stats.size / (1024 * 1024);
    
    console.log(`📦 Bundle size: ${sizeInMB.toFixed(2)} MB`);
    console.log(`📊 BUNDLE METRICS: Main bundle - ${stats.size} bytes`);
    
    // Check if gzipped (validate-architecture.sh step 5 checks dist/assets/index.js size)
    try {
      const { stdout } = await execAsync(`gzip -c ${indexPath} | wc -c`);
      const gzippedSize = parseInt(stdout.trim()) / (1024 * 1024);
      console.log(`📦 Gzipped size: ${gzippedSize.toFixed(2)} MB`);
      
      // Gate at 2MB gzipped - fail CI if exceeded
      if (gzippedSize > 2) {
        console.error('🚨 BUNDLE TOO LARGE: Main bundle exceeds 2MB gzipped limit');
        process.exit(1);
      } else {
        console.log('✅ Bundle size within limits');
      }
    } catch (error) {
      console.log('⚠️  Could not check gzipped size');
    }
    
  } catch (error) {
    console.error('❌ Bundle check failed:', error.message);
    process.exit(1);
  }
}

checkBundleSize();