#!/bin/bash

echo "🔍 Validating architecture integrity..."

# Step 6: CI guard - prevent /api/references paths (excluding fetch guard comments)
if grep -R "/api/references" client/src | grep -v "fetch-guard" | grep -v "includes('/api/references/')"; then
  echo "❌ stray /api/references path found" 
  exit 1
fi

# Additional checks for data integrity
echo "✅ No stray /api/references paths found"

# Check for direct supabase calls outside BibleDataAPI
DIRECT_SUPABASE_CALLS=$(grep -R "supabase\.storage\.from" client/src --exclude-dir=data --exclude="*BibleDataAPI*" | grep -v "supabaseClient.ts" | wc -l)
if [ "$DIRECT_SUPABASE_CALLS" -gt 0 ]; then
  echo "⚠️  Found direct supabase.storage calls outside BibleDataAPI:"
  grep -R "supabase\.storage\.from" client/src --exclude-dir=data --exclude="*BibleDataAPI*" | grep -v "supabaseClient.ts"
  echo "Consider moving these to BibleDataAPI for consistency"
fi

# Check for fetch calls that might be problematic
FETCH_CALLS=$(grep -R "fetch(" client/src | grep -v "BibleDataAPI" | grep -v "queryClient" | grep -v "rpc" | grep -v "https://" | wc -l)
if [ "$FETCH_CALLS" -gt 0 ]; then
  echo "📋 Found fetch calls outside approved patterns:"
  grep -R "fetch(" client/src | grep -v "BibleDataAPI" | grep -v "queryClient" | grep -v "rpc" | grep -v "https://" | head -5
fi

echo "✅ Architecture validation complete"