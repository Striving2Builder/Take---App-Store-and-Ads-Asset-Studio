# device-sync (Phase 5)

On-demand job that **proposes** device profile updates for `catalogs/devices/`. Humans review. CLI publishes. The browser never writes the git tree.

## Boundary (non-negotiable)

| This service | Not this service |
|--------------|------------------|
| Device specs, shells paths, insets, export sizes | App Scan (store listing / marketing URLs) |
| Research / allowlisted JSON → **DeviceProposal** | Silent “synced” badge in the web UI |
| Human **ReviewGate** before publish | Auto-publish from scrapers (they lie) |

## Paths

1. **Job** — `npm run sync:devices` (default `--discover snapshots`)  
   Cited snapshot JSON → normalize (store-size-class + family inherit) → `.take-sync/proposals.json` + `.take-sync/queue.json` (gitignored). Optional `--input pack.json --evidence https://…`. Optional `--discover wikidata` with `DEVICE_SYNC_FETCH=1` (SPARQL JSON; identity only). Optional `--deprecate-missing`. Optional `DEVICE_SYNC_SOURCES` allowlisted https JSON. DNS private-IP blocked. No HTML scrape.
2. **Review** — Catalog UI **Check for new devices** / Add, or `npm run catalog:approve -- pack.json --out approved.json`. Evidence + materialize required. Not auto-publish. Pack import is Advanced.
3. **CLI publish** — `npm run catalog:publish -- approved-pack.json`  
   Writes `catalogs/devices/{year}/{platform}/{id}.json` and regenerates `load-catalog.ts`. Refuses unapproved or unevidenced packs.

Plan: [docs/device-sync-mvp-sprint.md](../../docs/device-sync-mvp-sprint.md)

## Files

- Browser-safe: `src/*.ts` + `src/adapters/*` (no `fs`)
- Snapshots: `src/sources/snapshots/2025-flagships.json`
- Node CLI: `src/node/*` (`--discover snapshots` default)
