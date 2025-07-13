#!/usr/bin/env python3
"""
Build offsets for cross-references and prophecy data.
This script creates JSON offset files for efficient byte-range access.
"""

import json
import os

def build_crossref_offsets():
    """Build offset mapping for cross-references."""
    cf1_path = 'public/references/cf1.txt'
    if not os.path.exists(cf1_path):
        print(f"Warning: {cf1_path} not found")
        return
    
    offsets = {}
    with open(cf1_path, 'r') as f:
        current_pos = 0
        for line in f:
            verse_id = line.split('\t')[0]
            line_length = len(line.encode('utf-8'))
            offsets[verse_id] = [current_pos, current_pos + line_length]
            current_pos += line_length
    
    with open('public/references/cf1_offsets.json', 'w') as f:
        json.dump(offsets, f)
    
    print(f"Built {len(offsets)} cross-reference offsets")

def build_prophecy_offsets():
    """Build offset mapping for prophecy data."""
    prophecy_path = 'public/references/prophecy_rows.txt'
    if not os.path.exists(prophecy_path):
        print(f"Warning: {prophecy_path} not found")
        return
    
    offsets = {}
    with open(prophecy_path, 'r') as f:
        current_pos = 0
        for line in f:
            verse_id = line.split('$')[0]
            line_length = len(line.encode('utf-8'))
            offsets[verse_id] = [current_pos, current_pos + line_length]
            current_pos += line_length
    
    with open('public/references/prophecy_offsets.json', 'w') as f:
        json.dump(offsets, f)
    
    print(f"Built {len(offsets)} prophecy offsets")

if __name__ == '__main__':
    build_crossref_offsets()
    build_prophecy_offsets()
    print("Offset generation complete!")