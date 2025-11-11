
<div align="center">
  <h1>📖 Anointed.io – Open‑Source Bible Study PWA</h1>
  <p>React 18 · Supabase · Workbox · Virtual Scroll</p>
</div>

---

## Quick Start (Local Dev)

```bash
pnpm install
pnpm dev               # Vite on http://localhost:3000
````

* `pnpm build` → production bundle (`dist/`) with service‑worker
* `pnpm preview` → local preview of the PWA build
* `pnpm test` → Jest unit tests
* `pnpm cypress:open` → interactive e2e tests

---

## Project Structure

```
src/        React components, hooks, workers, facade
offline/    Dexie DB + queueSync for offline mutations
docs/       Architecture & behaviour reference (see table below)
scripts/    build guardrails (bundle size, arch lint)
```

| Doc                       | Link                                                             | What it covers                         |
| ------------------------- | ---------------------------------------------------------------- | -------------------------------------- |
| **Architecture overview** | [`docs/ARCHITECTURE_OVERVIEW.md`](docs/ARCHITECTURE_OVERVIEW.md) | Layers, flow diagram, tech stack       |
| **Source connections**    | [`docs/FILE_CONNECTIONS_MAP.md`](docs/FILE_CONNECTIONS_MAP.md)   | Which TS files call which              |
| **Data storage map**      | [`docs/DATA_STORAGE_MAP.md`](docs/DATA_STORAGE_MAP.md)           | Objects in Supabase & their consumers  |
| **UI layout spec**        | [`docs/UI_layout_spec.md`](docs/UI_layout_spec.md)               | Slot‑based grid, sizing, user controls |
| **Behaviour contracts**   | [`docs/BEHAVIOR_CONTRACTS.md`](docs/BEHAVIOR_CONTRACTS.md)       | Runtime guarantees, perf budgets       |
| **PWA implementation**    | [`docs/PWA_IMPLEMENTATION.md`](docs/PWA_IMPLEMENTATION.md)       | Service‑worker, offline, validation    |

---

## Contributing

1. **Fork & branch**: `git checkout -b feature/my‑topic`
2. Keep bundle ≤ 2 MB (gzip) – CI will fail otherwise.
3. If you add a new Supabase object or RPC, update
   `DATA_STORAGE_MAP.md` in the same PR.
4. Run `pnpm test && pnpm run bundle-check && pnpm run lint` before pushing.

---

## License

MIT.  Bible text © their respective publishers (see `translations/` notice).

```

---