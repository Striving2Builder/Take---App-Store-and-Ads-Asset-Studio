# Device Sync — Phase 5 Sprint Plan

**Date:** 2026-08-14  
**Goal:** Make Device Sync a real **propose → human review → publish** path for `catalogs/devices/` — not a fake “Synced” badge and not App Scan.  
**Out of scope:** photoreal shell downloads, Watch/TV/Vision, unsupervised auto-publish, mixing store-listing URLs into device specs, social/IAB sizes (Phase 6).

Related: [architecture.md](./architecture.md) F27 + F62–F66, [device-catalog-mvp-sprint.md](./device-catalog-mvp-sprint.md) Epic E, `services/device-sync/`, `apps/web` Catalog wizard.

**Approve this plan before implementation.**

---

## Boundary (non-negotiable)

| This phase | Not this phase |
|------------|----------------|
| Device specs, insets, export sizes, shell *paths* | App Scan (store / marketing / competitor URLs) |
| `DeviceProposal` + evidence URLs | Silent catalog mutation from a scraper |
| Human **ReviewGate** before any disk write | “Live synced from the web” UI copy |
| Maintainer CLI publish into `catalogs/devices/` | Browser writing the git tree |

Session apply (`replaceCatalog()`) already exists. Phase 5 does **not** replace it — it feeds it, and adds a disk publish that the wizard cannot do alone.

```
Research job (Node)          Catalog wizard (browser)         Maintainer CLI
─────────────────            ──────────────────────           ──────────────
cited sources  →             import pack / proposals  →       approved pack
DeviceProposal[]             ReviewGate approve/reject        + review artifact
evidence[] required          session replaceCatalog()         → write JSON
                             download pack JSON               → regen load-catalog.ts
```

---

## What exists today (honest)

| Piece | Status |
|-------|--------|
| `DeviceProposal` / `CatalogPack` types | REAL (loose `proposed` blob) |
| `createStubReviewGate` | PARTIAL — in-memory, not wired to UI |
| `createNoopCatalogPublisher` | REAL refusal (will not write disk) |
| `runDeviceSync()` | STUB log line |
| Catalog wizard | REAL paste JSON → validate → approve → **session** apply → download |
| `load-catalog.ts` barrel | HAND-MAINTAINED explicit Vite imports |
| Scheduled runner | Missing |

The wizard is a **pack importer**, not Device Sync. Phase 5 is the missing research + gate + publish spine.

---

## Product verdict (lock before build)

| Topic | Decision |
|-------|----------|
| Trigger | **On-demand first** (`npm run sync:devices`). Cron/schedule is a stretch, not MVP. |
| Fetch | Optional, behind `DEVICE_SYNC_FETCH=1`. Default is **curated/import** packs with citations. Scrapers lie. |
| Evidence | Every proposal **must** have ≥1 `evidence.url`. Reject in gate if missing. |
| IDs | Stable `apple.*` / `google.*` / `samsung.*` — never delete IDs; deprecate with `status`. |
| Depth | Catalog 5y retain / picker Current 3y — unchanged. |
| Browser | Wizard consumes a proposal pack; Apply stays **session-only**. |
| Disk | `npm run catalog:publish -- pack.json` writes `catalogs/devices/{year}/{platform}/{id}.json` **and** regenerates `load-catalog.ts`. Requires an approved review artifact in the pack. |
| Shells | Publisher may set `shellAssetFront` **paths** that already exist. It does not download photoreal art (F25 stays WATCH). |
| Fold | Stubs stay stubs. No hinge editor (F36/F37). |
| Honesty | UI: `Proposed` / `Awaiting review` / `Applied (session)` / `Pack downloaded`. Never `Synced`. |

---

## Epics

### Epic A — Proposal SSOT + ReviewGate (P1)

| ID | Item | Outcome |
|----|------|---------|
| A1 | Tighten `DeviceProposal.proposed` to `Partial<DeviceProfile> & { id: string; name: string }` | Typed proposals, not `Record<string, unknown>` |
| A2 | Persist ReviewGate (maintainer: JSON file under `.take-sync/` gitignored; wizard can import that file) | Queue survives refresh; still not cloud |
| A3 | Wire Catalog wizard to `listPending` / approve / reject — not only a textarea parse | Gate is the UI, paste is one intake |
| A4 | Reject proposals with zero evidence URLs | Trust |

### Epic B — Research job (P1)

| ID | Item | Outcome |
|----|------|---------|
| B1 | `runDeviceSync({ fetch?: boolean })` walks **allowlisted** source adapters and emits proposals (diff vs current catalog: new / size-change / deprecate-candidate) | Job has a real output |
| B2 | Default adapters: **manual pack** + **cited HTML/JSON allowlist** (Apple spec pages, Android device lists you name). No open-web crawl. | Bounded fetch |
| B3 | Reuse DNS/private-IP block patterns (do not import scan-api). Separate allowlist file in `services/device-sync`. | Domain split from App Scan |
| B4 | Confidence `high\|medium\|low` from “field matched cited table” vs “heuristic parse” | Honest ranking |
| B5 | Job writes a proposal pack JSON the wizard can import | No fake live pipe into the SPA |

### Epic C — Disk publisher + barrel (P1)

| ID | Item | Outcome |
|----|------|---------|
| C1 | Replace noop publisher with a Node CLI that **refuses** unless `pack.proposals` all applied ids are `reviewStatus: approved` | No silent publish |
| C2 | Write/merge JSON under `catalogs/devices/{year}/{platform}/` using `releasedAt` year | SSOT on disk |
| C3 | Regenerate `packages/device-catalog/src/load-catalog.ts` explicit imports (Vite constraint) | Catalog loads without a glob |
| C4 | `npm run test:devices` must pass after publish (validateDevice on every row) | Don’t land invalid JSON |
| C5 | Changelog line in `docs/architecture.md` As-built when a pack is committed | Living doc |

### Epic D — Wizard honesty (P2)

| ID | Item | Outcome |
|----|------|---------|
| D1 | Status copy matches the four states above; truth badge stays PARTIAL until disk publish exists | No Synced theater |
| D2 | Diff view: current catalog vs proposal (`exportPx`, inset, status) | Reviewers see the change |
| D3 | Keep download-pack; add “open proposal file” intake | Matches B5 |
| D4 | F27 → RESOLVED for session wizard; disk path tracked on F64 until C1 ships | Flag hygiene |

### Epic E — Tests (P2)

| ID | Item | Outcome |
|----|------|---------|
| E1 | ReviewGate approve/reject unit tests | Gate is real |
| E2 | Publisher refuses unapproved pack | Trust test |
| E3 | Barrel generator snapshot/smoke | C3 doesn’t bitrot |
| E4 | `npm run test:sync` script at repo root | Runnable |

---

## Suggested order

```
A1 types → A4 evidence rule → B1 job shape (no fetch)
    → A2 persist → A3 wizard consumes pack
    → C1–C3 CLI publish + barrel
    → B2–B3 fetch flag
    → D2 diff UI
    → E1–E4
```

Do not start fetch (B2) before the gate + CLI refuse-path is tested. A scraper without a gate is a trust break.

---

## Deferred (keep parked)

| Item | Why |
|------|-----|
| Cron / scheduled runner | On-demand is enough; schedule is ops later |
| Photoreal asset fetch | F25; paths only |
| Watch / TV / Vision | F37 |
| Fold hinge editor | F36 |
| Auto-publish from scrape | Scrapers lie |
| Cloud catalog marketplace | Monetization |
| Mixing Scan URLs into proposals | Different system |

---

## Flags this sprint owns

| ID | Sev | Meaning |
|----|-----|---------|
| F27 | P2 | Session wizard already exists — keep WATCH until D1 copy is exact |
| F62 | P1 | Research job still a stub log |
| F63 | P1 | ReviewGate not persisted / not the wizard’s SSOT |
| F64 | P1 | Publisher does not write `catalogs/devices/` |
| F65 | P2 | `load-catalog.ts` barrel is hand-maintained |
| F66 | P2 | Scheduled runner deferred (on-demand first) |

---

## Done when

- [x] Wizard can import a proposal pack (not only a raw device array)
- [x] Approve/reject is ReviewGate, evidence required
- [x] Session apply unchanged and honest
- [x] CLI publish writes JSON + barrel **only** with approved artifact
- [x] `DEVICE_SYNC_FETCH=1` is optional; default path works offline
- [x] No UI string says Synced / live / auto
- [x] App Scan codepaths untouched
- [x] F62–F65 progress recorded; F66 stays DEFERRED
- [x] `truth.ts` catalog wizard matches
- [x] `npm run test:sync` + `test:devices` + web build green

---

## F80 addendum (2026-08-15)

**Closed as:** Node discovery → normalize → existing ReviewGate. Not an in-app crawl. Not HTML.

| Adapter | Default | Output |
|---------|---------|--------|
| `snapshots` | `npm run sync:devices` | Cited flagship JSON + ASC/Play size class + family inherit (`inferredFrom`) |
| `wikidata` | `DEVICE_SYNC_FETCH=1 --discover wikidata` | SPARQL JSON identity only |
| HTML vendor pages | F100 DEFERRED | — |

Wizard remains pack import (F101 WATCH). Cron F66 and photoreal F25 unchanged. Do not invent SKU chrome; inherited hardware is labeled.

**Published (2026-08-15):** `catalog:approve` + `catalog:publish` wrote iPhone 16 / 16 Plus / 17 / 17 Pro / 17 Pro Max, Pixel 10, Galaxy S25. F32 → 19 devices. F102 WATCH (inherited chrome).
