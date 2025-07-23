
#!/usr/bin/env python3
# check_offsets.py - Check what keys exist in offsets
import json, pathlib, sys

# Check if we're running from the correct directory
offset_file = pathlib.Path("strongsVersesOffsets.json")

# First try to find the offset file in various locations
possible_paths = [
    pathlib.Path("strongsVersesOffsets.json"),
    pathlib.Path("client/public/strongsVersesOffsets.json"),
    pathlib.Path("../strongsVersesOffsets.json"),
]

found_file = None
for path in possible_paths:
    if path.exists():
        found_file = path
        break

if not found_file:
    print("❌ strongsVersesOffsets.json not found in any expected location")
    sys.exit(1)

print(f"📁 Found offset file: {found_file}")

try:
    off = json.loads(found_file.read_text())
    print(f"📊 Total entries: {len(off):,}")
    
    # Check specific keys we're seeing in logs
    test_keys = ['Gen.1:1', 'Gen.1:2', 'Gen.1:3', 'Gen 1:1', 'Gen 1:2']
    
    print("\n🔍 Testing specific keys:")
    for key in test_keys:
        if key in off:
            print(f"✅ Found: {key} -> {off[key]}")
        else:
            print(f"❌ Missing: {key}")
    
    # Show first few Genesis entries
    print("\n📋 First 10 Genesis entries:")
    gen_keys = [k for k in off.keys() if k.startswith('Gen')][:10]
    for key in gen_keys:
        print(f"  {key} -> {off[key]}")
        
except Exception as e:
    print(f"❌ Error reading offset file: {e}")
