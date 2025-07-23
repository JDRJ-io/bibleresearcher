
#!/usr/bin/env python3
# rebuild_verses_offsets.py
import json, pathlib, sys

FLAT = pathlib.Path("strongsVerses.flat.txt")        # gzip not needed
OFF  = pathlib.Path("strongsVersesOffsets.json")

if not FLAT.exists():
    sys.exit("flat file not found")

offsets = {}
with FLAT.open("rb") as f:
    while True:
        start = f.tell()
        row   = f.readline()
        if not row:
            break
        end = f.tell() - 1
        key = row.split(b"#",1)[0].decode("ascii")   # 'Gen.1:1'
        offsets[key] = [start, end]

OFF.write_text(json.dumps(offsets), encoding="utf-8")
print(f"✅ rebuilt {OFF}  ({len(offsets):,} refs)")
