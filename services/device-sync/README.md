# device-sync (Phase 5)

On-demand job that **proposes** device profile updates for `catalogs/devices/`. Humans review. CLI publishes. The browser never writes the git tree.

## Boundary (non-negotiable)

| This service | Not this service |
|--------------|------------------|
| Device specs, shells paths, insets, export sizes | App Scan (store listing / marketing URLs) |
| Research / allowlisted JSON → **DeviceProposal** | Silent “synced” badge in the web UI |
| Human **ReviewGate** before publish | Auto-publish from scrapers (they lie) |

## Paths

1. **Job** — `npm run sync:devices -- --input candidates.json --evidence https://…`  
   Writes `.take-sync/proposals.json` (wizard pack) and ingests `.take-sync/queue.json` (file ReviewGate). Both gitignored. Optional `--deprecate-missing` (same-prefix catalog ids not in the pack). Optional `DEVICE_SYNC_FETCH=1` + `DEVICE_SYNC_SOURCES` (https JSON on the allowlist; DNS private-IP blocked — no HTML scrape).
2. **Wizard** — Catalog sync stage: import pack → ReviewGate (evidence required) → **Apply session** (`replaceCatalog`) → download approved pack.
3. **CLI publish** — `npm run catalog:publish -- approved-pack.json`  
   Writes `catalogs/devices/{year}/{platform}/{id}.json` and regenerates `load-catalog.ts`. Refuses unapproved or unevidenced packs.

Plan: [docs/device-sync-mvp-sprint.md](../../docs/device-sync-mvp-sprint.md)

## Files

- Browser-safe: `src/*.ts` (no `fs`)
- Node CLI: `src/node/*`
