# Real App Scan — Phase 2 implementation plan

**Status:** WP0–WP4 implemented and post-review patched (competitor compare-only, pack soft-fail, palette on `extensions`, seed ≥1, warning dedupe, `fetchSafe` redirects).  
**Inputs:** `docs/architecture.md`, `docs/file-map.md`, `docs/scan-phase-2-review.md`, current Scan code  
**Goal:** Map Play → Multi-URL → Locale → Palette onto the existing layered architecture with explicit growth room for Phase 3+

---

## 1. Principles (fit what we have)

| Principle | How Phase 2 respects it |
|-----------|-------------------------|
| Layer separation | Scan stays in `scan-api` + `scan-client`; UX in `apps/web/stages/intake`; palette creative use in `editor/inspectors` — **not** device catalog |
| One concern per file ≤300–400 lines | New adapters/helpers get **new files**; do not grow `play-meta.ts` / `scan.route.ts` / `scan-receipt.ts` past ceiling — split |
| Captured vs Inferred forever | Every new field/asset/palette swatch carries provenance |
| Local-first | Cache on server optional; session state in client; no cloud sync required |
| Thin backend only when blocked | Play + palette-from-remote-images + SSRF stay server-side |
| Plugin growth | Adapters register into an **adapter registry** (new), so future sources (ASO, Figma, APK) don’t rewrite the orchestrator |
| Truth badges stay honest | Update `shared/truth.ts` only when a path is gold-set green |

---

## 2. Where we are (as-built)

```
packages/scan-client/          # schema, client, url-detect, fallback, from-capture
services/scan-api/
  adapters/apple-lookup.ts     # LIVE
  adapters/og-meta.ts          # LIVE
  adapters/play-meta.ts        # HONEST STUB (package id only)
  routes/scan.route.ts         # single-URL orchestrator
  security/allowlist.ts        # SSRF guards
  server.ts                    # POST /scan
apps/web/
  stages/intake/scan-receipt.ts
  stages/intake/intake.form.ts
  app/app-state.ts             # lastScan, scanLocked
  shared/truth.ts
```

**Does not exist yet (planned growth):** adapter registry, scan pack types, locale presets, cache layer, palette module, multi-source receipt UI, Playwright runner.

---

## 3. Target architecture (Phase 2 + growth room)

Keep the same top-level layers. Expand **inside** Scan and Intake only.

```
packages/scan-client/
  capture.schema.ts            # KEEP — extend carefully (see §5)
  scan-pack.schema.ts          # NEW — multi-URL session types
  locale.presets.ts            # NEW — storefront/language presets
  palette.types.ts             # NEW — CapturedPalette type
  merge-pack.ts                # NEW — primary-wins merge rules
  url-detect.ts                # EXTEND — preserve; don’t bloat
  client.ts                    # EXTEND — scanPack(), locale param
  from-capture.ts              # EXTEND — pack → brief
  …

services/scan-api/
  src/
    server.ts                  # EXTEND routes: /scan, /scan/pack, /palette
    routes/
      scan.route.ts            # KEEP thin — delegate to registry
      scan-pack.route.ts       # NEW
      palette.route.ts         # NEW
    adapters/
      adapter.types.ts         # NEW — ScanAdapter interface
      registry.ts              # NEW — register apple|play|og|…
      apple-lookup.ts          # KEEP
      og-meta.ts               # KEEP
      play-meta.ts             # REPLACE stub → live facade
      play/
        play-fetch.ts          # NEW — HTTP/headless fetch
        play-parse.ts          # NEW — DOM/JSON extract
        play-normalize.ts      # NEW — → AppCapture (+ hl/gl)
    locale/
      apply-locale.ts          # NEW — rewrite URL / headers / Lookup country
    cache/
      listing-cache.ts         # NEW — TTL cache by url+locale+adapter
    palette/
      extract-palette.ts       # NEW — quantize from image buffers
    security/
      allowlist.ts             # KEEP / harden
    fixtures/                  # NEW — gold-set fixtures (Play/iOS/web)
      play/
      ios/
      web/

apps/web/src/
  stages/intake/
    intake.form.ts             # EXTEND — locale + pack sources
    scan-sources.ts            # NEW — multi-URL UI state
    scan-locale.ts             # NEW — locale switcher bind/render
    scan-receipt.ts            # SPLIT if needed →
    scan-receipt.render.ts     # NEW — fields/assets/palette sections
    scan-receipt.pack.ts       # NEW — tabbed multi-source receipt
    intake.missing.ts          # EXTEND — pack gaps
  editor/inspectors/
    style-inspector.ts         # EXTEND — “From scan” palette lane
  shared/
    truth.ts                   # UPDATE badges when features go live
  app/
    app-state.ts               # EXTEND — scanPack, locale, palette
```

### Growth room (Phase 3+ hooks — stub interfaces now, implement later)

| Future capability | Hook to leave now |
|-------------------|-------------------|
| Screenshots → phone mock / export | `CapturedAsset` already; add `AssetBin` consumer interface in editor (don’t implement compositing yet) |
| ASO keywords / rankings | New adapter `aso-*.ts` behind same `ScanAdapter` |
| Review themes | Optional `capture.extensions.reviews` bag (open record) — don’t block schema v1 |
| SPA headless for marketing | Shared `browser-pool.ts` used by Play first, reusable by OG-hard mode |
| Competitor Replicator | Pack source `role: "competitor"` already in pack schema; Replicator reads reference lane later |
| Batch multi-locale | Cache key `url+locale`; pack can later hold `locales[]` without schema break |
| Licensed ASO vendor | Alternate Play adapter implementation swapped in registry |

**Schema growth rule:** `AppCapture.schemaVersion` stays `1` for additive optional fields; breaking changes → `schemaVersion: 2` + migrator in `scan-client`.

---

## 4. Work packages (implementation order)

### WP0 — Architecture scaffolding (½–1 day)
**Purpose:** Leave room before features land.

| Deliverable | Files |
|-------------|--------|
| `ScanAdapter` interface + registry | `adapters/adapter.types.ts`, `adapters/registry.ts` |
| Refactor `scan.route.ts` to `registry.resolve(kind).scan(input)` | `routes/scan.route.ts` |
| Register apple + og + play-stub | `registry.ts` |
| ADR note | `docs/adr/0001-scan-adapter-registry.md` |

**Exit:** Single-URL Scan behavior unchanged; adapters swappable.

---

### WP1 — Play adapter (core parity)
**Purpose:** Live Google Play capture.

| Deliverable | Files |
|-------------|--------|
| Fetch strategy (Playwright or chosen lib) | `adapters/play/play-fetch.ts` |
| Parse title, short/full desc, developer, category, rating, icon, screenshots | `adapters/play/play-parse.ts` |
| Normalize → `AppCapture` with provenance; honor `hl`/`gl` | `adapters/play/play-normalize.ts` |
| Facade replaces stub | `adapters/play-meta.ts` (thin) |
| Listing cache | `cache/listing-cache.ts` |
| Gold fixtures (15–20 apps) | `fixtures/play/*.json` (expected shapes) |
| README ToS/rate-limit notes | `services/scan-api/README.md` |

**Locale contract (build in now even if UI is WP3):**  
`ScanRequest { url, locale?, language?, country? }` → Play uses `hl`/`gl`; Apple already uses `country`.

**Exit:** Play URL → LIVE/PARTIAL receipt with assets; failures honest; truth badge → PARTIAL/REAL after gold-set pass.

**Non-goals:** Data safety NLP, ASO keywords, review scrape.

---

### WP2 — Locale switcher (Scan UX + API wiring)
**Purpose:** User-controlled storefront/language.

| Deliverable | Files |
|-------------|--------|
| Preset list (10–15) | `packages/scan-client/src/locale.presets.ts` |
| Apply locale to requests | `services/scan-api/src/locale/apply-locale.ts` |
| Switcher UI beside Scan | `apps/web/.../scan-locale.ts` + intake markup |
| Persist last locale | `app-state` / localStorage |
| URL hint vs switcher conflict microcopy | intake hint / receipt meta |
| Client passes locale on `/scan` | `scan-client/client.ts`, `intake.form.ts` |

**Exit:** Changing locale changes Captured listing language/screenshots where the store supports it; receipt shows locale.

---

### WP3 — Multi-URL pack
**Purpose:** Primary + optional sources in one session.

| Deliverable | Files |
|-------------|--------|
| `ScanPack` / `ScanSource` types + merge rules | `scan-pack.schema.ts`, `merge-pack.ts` |
| `POST /scan/pack` | `routes/scan-pack.route.ts` |
| Parallel adapter runs + per-source errors | registry reuse |
| UI: add source rows (site / competitor) | `scan-sources.ts` |
| Tabbed/stacked receipt | `scan-receipt.pack.ts` (+ split render) |
| State: `lastPack` | `app-state.ts` |
| Generate consumes **merged primary-wins brief** | `from-capture` / start-app |

**Merge rules (locked in code comments + tests):**
1. Primary Captured > secondary Captured  
2. Secondary fills Missing only  
3. Competitor → `role: "competitor"` reference lane; not brand asset bin by default  
4. User provenance never clobbered  

**Exit:** Scan all → one session; Generate uses merged brief; competitor clearly labeled.

**Growth:** Pack `sources[].role` allows future `brand-kit` / `figma` without UI rewrite.

---

### WP4 — Palette extraction
**Purpose:** Captured colors from icon (+ optional screens).

| Deliverable | Files |
|-------------|--------|
| `CapturedPalette` type | `palette.types.ts` |
| Server extract from image URLs/buffers | `palette/extract-palette.ts`, `routes/palette.route.ts` |
| Attach palette onto capture/pack result | normalize / client |
| Receipt PALETTE section | `scan-receipt.render.ts` |
| Style inspector “From scan” | `style-inspector.ts` |
| Lock swatch → user provenance; **do not** recolor global TAKE chrome | fix existing `--signal` bleed |

**Exit:** After Scan, 5–6 swatches appear; locking affects project accent inside canvas/style, not whole app shell.

**Growth:** Later roles (`primary|accent|neutral`), contrast checks, per-frame mood — extend `CapturedPalette` roles array.

---

## 5. Schema evolution (leave room)

### Keep stable (`AppCapture` v1)
Existing fields + assets + provenance.

### Additive (optional, still v1)
```ts
// Conceptual — implement when WP lands
extensions?: {
  palette?: CapturedPalette;      // WP4
  packId?: string;                // WP3
  sourceRole?: "primary" | "marketing" | "competitor" | string; // open enum
  storefront?: string;            // WP2
  language?: string;              // WP2
  rawRefs?: { adapter: string; cacheKey: string }; // debugging, not shown in UI
};
```

Prefer `extensions` bag for experimental/future fields so core stays clean.

### New top-level type (WP3)
```ts
ScanPack {
  schemaVersion: 1
  primary: AppCapture
  sources: AppCapture[]  // each with extensions.sourceRole
  merged: AppCapture     // after merge-pack rules
  locale: string
  warnings: string[]
}
```

---

## 6. API surface (current → Phase 2)

| Method | Path | Now | Phase 2 |
|--------|------|-----|---------|
| GET | `/health` | Live | Keep |
| POST | `/scan` | `{ url, locale }` → `AppCapture` | Add optional `country`/`language`; Play live |
| POST | `/scan/pack` | — | `{ primaryUrl, sources[], locale }` → `ScanPack` |
| POST | `/palette` | — | `{ imageUrls[] }` → `CapturedPalette` (or embed in scan response) |

Vite proxy `/api` unchanged.

---

## 7. UX map (Intake only)

```
[ Locale ▾ en-US ]     ← WP2
Primary URL [..........] [Scan]
(+ Add marketing URL)  ← WP3
(+ Add competitor URL) ← WP3
[Scan all]             ← WP3 (or same Scan button if pack non-empty)

Scan receipt
  tabs: Primary | Site | Competitor   ← WP3
  fields + CAPTURED/INFERRED
  ASSET BIN
  PALETTE                             ← WP4
```

Generate / Editor / Device catalog **unchanged in ownership**; they only consume `lastScan` / `lastPack.merged` + optional palette.

---

## 8. Testing & quality gates

| Gate | Requirement |
|------|-------------|
| Play gold set | ≥15 package IDs; name+icon+≥1 screenshot on happy path |
| Locale spot check | en-US vs es-MX (or ja-JP) differs when store differs |
| Pack merge unit tests | Primary wins; secondary fills missing; competitor isolated |
| Palette | Icon yields ≥3 hexes; re-scan doesn’t wipe user lock |
| Regression | Apple Lookup + OG still green |
| Line budget | Any file >300 → split before merge |

---

## 9. Explicitly out of Phase 2 (parked with hooks)

| Item | Hook left behind |
|------|------------------|
| Screenshots into phone mock / PNG export | Assets in bin; editor `AssetBin` consumer later |
| ASO keywords / rankings / reviews | New adapter via registry |
| Marketing SPA hard mode | Shared browser pool from Play |
| Replicator from competitor | `sourceRole: competitor` |
| Multi-locale batch generate | Cache key includes locale |
| Team cloud sync | Still local-first |

---

## 10. Timeline sketch (engineering)

| WP | Focus | Rough size |
|----|-------|------------|
| WP0 | Registry scaffold | Small |
| WP1 | Play live adapter + cache + fixtures | Medium–Large |
| WP2 | Locale switcher | Small–Medium |
| WP3 | Multi-URL pack | Medium |
| WP4 | Palette extract + inspector | Small–Medium |

**Critical path:** WP0 → WP1 → WP2 → WP3 → WP4  
(WP2 can start API-side in parallel with WP1 UI polish once `ScanRequest` locale fields exist.)

---

## 11. Definition of Phase 2 done

1. Play URL produces LIVE/PARTIAL receipt comparable to iOS for P0 fields + assets  
2. Locale switcher changes storefront capture for Apple + Play + Accept-Language for web  
3. Multi-URL pack merges with locked rules; competitor is reference-only  
4. Palette from icon appears as Captured; lock doesn’t nuke app chrome  
5. Adapter registry in place; file-map/ADR updated; truth badges match reality  
6. No file left bloated past the line budget without a split  

---

## 12. Doc updates when implementing

| Doc | Update |
|-----|--------|
| `docs/file-map.md` | Mark new files LIVE/STUB |
| `docs/architecture.md` | Point to adapter registry + ScanPack |
| `docs/scan-phase-2-review.md` | Link to this plan |
| `docs/adr/0001-scan-adapter-registry.md` | Create in WP0 |
| `README.md` | Play + locale + pack usage |

---

## Bottom line

Phase 2 **extends the Scan vertical** we already have — it does not create a parallel system. We add an **adapter registry** and **ScanPack / locale / palette** modules so Play ships cleanly and Phase 3 (canvas assets, ASO, Replicator) plugs in without another overhaul.

**Next step when you approve:** execute **WP0 → WP1** first.
