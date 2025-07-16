# Gap Analysis — Completion Log

## 1. Previously identified gaps

| Gap (2025‑06) | Status | Resolution |
|---------------|--------|------------|
| Duplicate verse caches (6) | **Closed** | Collapsed into single LRU cache inside BibleDataAPI. |
| Workers hitting `/api/references` | **Closed** | Workers now receive data via `postMessage`; API route deleted. |
| Legacy DOM table (`bible.ts`) | **Closed** | File archived; VirtualBibleTable is sole viewer. |
| Email/password modal duplication | **Closed** | AuthModal removed; magic‑link only. |
| Scroll sentinels jitter | **Closed** | Switched to pure anchor‑index tracking. |
| Dexie storing verse blobs | **Closed** | Dexie limited to user data only. |
| Bundle > 2 MB risk | **Closed** | Bundle 1.12 MB after purge. |
| Prophecy offsets not wired | **Closed** | Offsets JSON + getProphecy() helper now live. |
| Strong’s concordance empty | **Open** | Offsets helper done; overlay UI to build (next sprint). |
| Error logging / telemetry | **Open** | Sentry integration pending. |
| Keyboard a11y for DnD headers | **Open** | Announce helper TBD. |

## 2. Outstanding items (carry‑over)

1. **Strong’s overlay UI & tests**  
2. **Error telemetry (Sentry)**  
3. **A11y: drag‑and‑drop keyboard announcements**  
4. **Prefetch next slice for zero skeletons**

All other gaps are closed with the 2025‑07 refactor branch.