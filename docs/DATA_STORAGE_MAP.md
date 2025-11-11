Below is an updated **Data Storage Map** that lists **every object currently stored in your Supabase `anointed/` bucket**, grouped by folder. 
It supersedes the draft I gave earlier.
Save it as `docs/DATA_STORAGE_MAP.md` (or in any location you prefer).

---

# Data Storage Map — Supabase `anointed` Bucket

*Updated 17 July 2025*

| Folder                            | Object(s)                                                                                                                                                                                                                        | Purpose                                          | Client‑side consumer (method or file)                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| **translations/**                 | `AMP.txt`, `BSB.txt`, `CSB.txt`, `ESV.txt`, `KJV.txt`, `NASB.txt`, `NIV.txt`, `NKJV.txt`, `NLT.txt`, `NRSV.txt`, `WEB.txt`, `YLT.txt`                                                                                            | Full translation text (`<ref>#<verse>` per line) | `BibleDataAPI.getTranslation(code)` → `translationWorker.js`               |
| **labels/**`<CODE>/ALL.json`      | same 12 translation codes (AMP…YLT)                                                                                                                                                                                              | Semantic labels (who/what/when…) per verse       | `labelsLoader.ts` (future)                                                 |
| **metadata/**                     | `verseKeys-canonical.json`, `verseKeys-chronological.json` ↠ ordered verse ID arrays<br>`dates-canonical.txt`, `dates-chronological.txt` ↠ timeline metadata<br>`context_groups.json` ↠ parent passages for context highlighting | Core index & timeline data                       | `verseKeysLoader.ts`, `BibleDataAPI.loadTimeline()`                        |
| **references/**                   | `cf1.txt`, `cf2.txt` ↠ cross‑ref lines<br>`cf1_offsets.json`, `cf2_offsets.json` ↠ byte ranges<br>`prophecy_rows.json` ↠ per‑verse P/F/V rows<br>`prophecy-file.txt`, `prophecy_index.txt` ↠ prophecy details & offsets          | Cross references & prophecy system               | `BibleDataAPI.getCrossRefSlice()`, `getCfOffsets()`, `getProphecy()`       |
| **strongs/**                      | `strongsVerses.txt`, `strongsVerseOffsets.json` ↠ per‑verse original‑language tokens<br>`strongsIndex.txt`, `strongsIndexOffsets.json` ↠ lemma → verse map<br>`strongsIndex.json` (*small helper index*)                         | Strong’s concordance look‑ups                    | `BibleDataAPI.getStrongsOffsets()` → workers `VerseWorker` & `LemmaWorker` |
| **user\_data/** (“Storage” in DB) | *tables, not bucket objects*: `userNotes`, `bookmarks`, `highlights`, `userPreferences`, …                                                                                                                                       | User‑generated data with RLS                     | Supabase RPC via `BibleDataAPI.save*()` and offline `queueSync.ts`         |

> **All objects are public** except the **user\_data** tables, which are protected by Row‑Level‑Security.
> The bucket’s public URL prefix is:
> `https://<project-id>.supabase.co/storage/v1/object/public/anointed/…`

### Size / caching guardrails

* Translation files: ≈ 4 MB each. Workbox runtime caching with **CacheFirst (30 days)**.
* Offset JSON files: ≤ 200 kB each; fetched once per session.
* `strongs*.txt`: large (70 MB); fetched in 2‑4 kB byte‑range slices only when user opens interlinear overlay.
* Everything else fits in memory and in the master LRU cache held by `BibleDataAPI`.

---

## Write / Mutate endpoints (Postgres RPC)

| RPC name         | Called from                    | Description                    |
| ---------------- | ------------------------------ | ------------------------------ |
| `save_note`      | `BibleDataAPI.saveNote()`      | UPSERT note text               |
| `save_highlight` | `BibleDataAPI.saveHighlight()` | Colour + verseKey + range      |
| `save_bookmark`  | `BibleDataAPI.saveBookmark()`  | verseKey + colour              |
| `bulk_sync`      | `offline/queueSync.ts`         | Replay pending Dexie mutations |

All RPCs are prefixed `anointed_` in the database but are imported without the prefix in client code.

---

## How to keep this map current

1. **Add a row** whenever a new object is uploaded to Supabase Storage.
2. **Add a row** when you create a new RPC or user‑data table.
3. Remove or mark obsolete objects when they are deleted or replaced.

---

*Maintainers: update this file in the same PR that adds or removes any bucket object or RPC.*
