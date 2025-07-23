
#!/usr/bin/env python3
"""
Expert's pointer-based offset builder for Strong's files.
Builds offset maps from the exact files we serve to avoid misalignment.
"""
import json
import pathlib
import sys

def build_offsets(flat_file_path, output_json_path):
    """Build offsets using pointer-based method (no byte counting math)"""
    flat_file = pathlib.Path(flat_file_path)
    output_file = pathlib.Path(output_json_path)
    
    if not flat_file.exists():
        print(f"❌ File not found: {flat_file}")
        return False
    
    offsets = {}
    with flat_file.open("rb") as f:
        while True:
            start = f.tell()
            row = f.readline()
            if not row:
                break
            end = f.tell() - 1
            
            # Extract key from line (before first #)
            try:
                key = row.split(b"#", 1)[0].decode("ascii").strip()
                if key:  # Only add non-empty keys
                    offsets[key] = [start, end]
            except (UnicodeDecodeError, IndexError):
                continue  # Skip malformed lines
    
    # Write JSON
    output_file.write_text(json.dumps(offsets, indent=2), encoding="utf-8")
    print(f"✅ Built {output_file} with {len(offsets):,} entries")
    return True

def main():
    """Build both Strong's offset files"""
    print("🔨 Building Strong's offset maps using expert's pointer method...")
    
    # Build strongsVerses offsets
    verses_success = build_offsets(
        "strongsVerses.flat.txt", 
        "strongsVersesOffsets.json"
    )
    
    # Build strongsIndex offsets  
    index_success = build_offsets(
        "strongsIndex.flat.txt",
        "strongsIndexOffsets.json"
    )
    
    if verses_success and index_success:
        print("✅ All offset maps rebuilt successfully!")
        print("📋 Upload these JSON files to Supabase: strongsVersesOffsets.json, strongsIndexOffsets.json")
    else:
        print("❌ Some offset builds failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
