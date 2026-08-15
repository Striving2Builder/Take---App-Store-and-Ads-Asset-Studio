# TAKE — Architecture foundations

Redesign the current 3-file shell into a modular web-first system without forcing a rewrite of the UX you already have.

---

## Direct answer: device shells are NOT under Style & palette

| Domain | Meaning |
|--------|---------|
| **Style & palette** | Creative direction — colors, type mood, visual family (premium / bold / minimal) |
| **Device / shell** | Hardware templates — iPhone, Pixel, iPad specs, bezels, export sizes |

Those must stay separate. Today there is **no real phone selector** — only one CSS phone mock. Library cards like “iPhone 16 Pro Shell” are labels only.

### Where device templates should live

**Canonical home: Device Catalog** → `packages/device-catalog` (or `/catalogs/devices`)

- Versioned JSON specs + shell assets (iPhone, iPad, Pixel, Galaxy, tablets, etc.)
- Updated by a scheduled **Device Sync** job (separate from App Scan)

### Where you select the phone

1. **Intake** — Platform (iOS / Android / Both) sets default device family  
2. **Editor toolbar** — Device picker (this control is missing today)  
3. **Template mode** — Template binds to a `deviceId`  
4. **Export** — Sizes come from catalog + export presets  

---

## Two different “scan” systems

| System | Input | Output | Owner |
|--------|-------|--------|-------|
| **App Scan** | Store / marketing / competitor URL + uploads | App brief, copy, assets, positioning | `scan-api` |
| **Device Sync** | Vendor specs / device databases / maintainers | Updated shells, dimensions, safe areas | `device-catalog` + sync job |

Do not mix these.

### Recommended UX placement

| Control | Where | Why |
|---------|-------|-----|
| Platform (iOS / Android / Both) | Intake sidebar (exists) | Store rules + default device family |
| Device / shell | Editor top toolbar + Template bindings | Frame aspect, bezel, export size |
| Style family | Intake + Style panel | Creative look, not hardware |
| Palette / brand lock | Style panel | Color system |
| Template family | Template mode / Library | Layout recipe referencing a `deviceId` |

---

## Target repository shape

> **Implemented:** See [file-map.md](./file-map.md) for the granular per-item file ownership
> (≤300–400 lines). The monorepo scaffold under `apps/`, `packages/`, `catalogs/`, and
> `services/` is live. Run from repo root: `npm install && npm run dev`.
>
> **Scan Phase 2 plan:** [scan-phase-2-implementation-plan.md](./scan-phase-2-implementation-plan.md)
> (Play → Locale → Multi-URL pack → Palette) — maps onto adapter registry + existing
> `scan-client` / `scan-api` / intake receipt without a parallel architecture.

Principle: HTML5 web-first + local-first for projects. Thin backend only where the browser cannot go (CORS scan, device sync, optional AI). No heavy monolith.

```
take/
├── apps/
│   └── web/                      # UI shell (Vite + TS)
│       ├── index.html
│       ├── src/
│       │   ├── app/              # router, stage machine, providers
│       │   ├── stages/           # landing, intake, generate, review, edit, export, library
│       │   ├── modes/            # wizard | template | replicator | slideshow | (plugins)
│       │   ├── editor/           # canvas, layers, device stage, inspectors
│       │   ├── library/          # personal templates UI
│       │   ├── shared/           # ui kit, tokens, motion
│       │   └── main.ts
│       └── public/
├── packages/
│   ├── core/                     # domain types, validation, pure logic
│   ├── modes-sdk/                # CreationMode interface + registry
│   ├── template-engine/          # template schema, variants, batch
│   ├── device-catalog/           # device JSON + shell refs + validators
│   ├── scan-client/              # typed client for app scan API
│   ├── export-presets/           # App Store / Play / social / IAB specs
│   └── storage/                  # local-first project/template repos (IndexedDB)
├── services/
│   ├── scan-api/                 # URL fetch, Apple Lookup, OG parse, Play adapter
│   ├── device-sync/              # scheduled catalog updater
│   └── render-worker/            # optional: PNG/MP4 render (later)
├── catalogs/                     # versioned published data
│   ├── devices/
│   │   ├── manifest.json         # versions, checksums
│   │   └── 2026.08/
│   │       ├── iphone-16-pro.json
│   │       ├── pixel-9.json
│   │       └── shells/           # svg/webp bezels
│   ├── templates/                # system template families
│   └── export-specs/             # store dimension rules
└── docs/
    ├── architecture.md           # this file
    └── adr/                      # architecture decision records
```

### Mode plugin contract

Every creation mode implements the same interface so future modes plug in without rewriting the shell:

| Hook | Responsibility |
|------|----------------|
| `id` / label / capabilities | Registry + UI discovery |
| `validateIntake(input)` | Missing-field guidance per mode |
| `run(input, ctx)` | Produce ProjectDraft (sets, frames, copy) |
| `getEditorPlugins()` | Optional inspectors / tools |
| `getExportHints()` | Preset defaults for that mode |

### Device profile schema (minimal)

| Field | Purpose |
|-------|---------|
| `id` | e.g. `apple.iphone-16-pro` |
| `platform` | `ios` \| `android` \| `other` |
| `formFactor` | `phone` \| `tablet` |
| `viewportPx` / `exportPx` | Logical + store export sizes |
| `safeArea` / notch | Layout constraints |
| `shellAsset` | Bezel SVG/WebP path |
| `storeTargets[]` | Which export presets this device feeds |
| `source` / `updatedAt` / `version` | Sync provenance |

### Browser vs server

| Browser (fast, cheap, private) | Server (only when required) |
|--------------------------------|-----------------------------|
| Stages, editor, modes UI | App Scan proxy |
| Local projects/templates (IndexedDB) | Device Sync publisher |
| Validation, preview canvas | Optional LLM |
| Manifest packaging, device catalog cache | Optional heavy render |

---

## Design pillars

| Pillar | Foundation choice |
|--------|-------------------|
| Performance / speed | Code-split by stage + mode; catalog CDN + local cache; no giant single JS file |
| Security | Scan API allowlists hosts; `fetchSafe` re-validates redirect targets; strip HTML; never execute remote JS; CSP; secrets only on server |
| Cost efficiency | Cache Apple Lookup / page fetches; device sync is batch not per-user; AI gated; render on-demand |
| Stability / reliability | Pure domain package + tests; mode registry; feature flags; Captured vs Inferred fallback; pack per-source soft-fail |
| Maintainability | ADRs; one mode SDK; device data as data not hardcoded CSS; typed contracts |
| Functionality growth | Modes as plugins; templates reference `deviceId` + export presets; ScanPack roles for future brand-kit/Figma |
| Web-first + mobile access | Responsive stages; touch-friendly editor; PWA optional later |
| Local-first | Session scan state in memory; templates/history localStorage; IndexedDB later; cloud sync explicit opt-in |
| Observability | Client errors + scan metrics; catalog version visible in UI; scan receipt warnings |

### Layering (do not mix)

| Layer | Contains | Must not contain |
|-------|----------|------------------|
| UX shell | Stages, navigation, layout | Store scrape logic |
| Modes | Creation strategies | Device SVG assets |
| Device catalog | Hardware specs + shells | Brand palette / copy tone |
| Template engine | Layout recipes + variables | Network fetching |
| Scan | App/competitor intelligence | Editor chrome |
| Export | Preset specs + render jobs | Mode UI |

---

## As-built: Real App Scan (Phase 1 + Phase 2 WP0–WP4)

**Status (2026-08):** Live local stack — `apps/web` (:8765) + `services/scan-api` (:8787, proxied `/api`).

### Data flow

```
Intake URL(s) + locale
        │
        ▼
  scan-client ──POST──► scan-api
        │                 │
        │                 ├─ adapter registry (apple | play | og)
        │                 ├─ POST /scan          single URL
        │                 ├─ POST /scan/pack     primary + ≤2 secondaries
        │                 └─ POST /palette       JPEG/PNG quantize
        ▼
  AppCapture / ScanPack (Captured vs Inferred)
        │
        ├─ lastScan / lastPack / scanPalette   (session memory)
        ├─ extensions.palette                  (on capture after extract)
        ├─ Scan receipt (tabs + asset bin + palette)
        └─ Generate → brief → sets (set0 seeds scan colors)
              └─ Style lock → --project-accent on #phone-mock only
```

### Pack merge rules (locked)

1. Primary Captured wins over secondary Captured  
2. Secondary fills **Missing** brand fields only (marketing)  
3. **Competitor** = compare lane — **no** field or asset merge into brand  
4. Soft-fail per source — one bad secondary does not abort primary  

### Palette vs chrome

| Token | Owns | Must not |
|-------|------|----------|
| `--signal` | TAKE chrome (buttons, truth FAKE, nav) | Concept brand colors |
| `--project-accent` | Phone mock / set brand lock | Global shell chrome |

### Persistence (honest)

| Data | Where |
|------|--------|
| Templates / history actions | `localStorage` via `@take/storage` |
| `lastScan` / `lastPack` / `scanPalette` / Extra Sources / `selectedShotIds` | `localStorage` scan session snapshot (`scan-session.repo.ts`) — survives refresh |
| Uploads | Data URLs in memory + merged into capture (persist with session); legacy `blob:` stripped on hydrate |
| Projects (sets + scan payload) | IndexedDB `take-db` / `projects` (migrates legacy localStorage) |
| Postgres / RLS / cloud CRUD | **Not in architecture** — local-first by design |

### Still deferred

ASO depth · full device catalog export sizes · Device Sync shells · drag-drop template editor · LLM narrative NLP

---

## Phased roadmap (no big-bang rewrite)

Do not throw away the shell. Extract in place.

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **0 — Split** | Vite+TS; stages/modes/editor; domain types | **Done** |
| **1 — Real App Scan** | Apple + OG + receipt Captured/Inferred | **Done** |
| **1b — Scan Phase 2** | Adapter registry, Play, locale, pack, palette | **Done** |
| **2 — Device Catalog** | Device JSON + picker; export sizes from catalog | Partial (picker seed) |
| **3 — Mode SDK** | Wizard + distinct Template/Replicator/Slideshow | **Partial** (adapters wired on Generate; not full editors) |
| **4 — Template engine** | Editable templates bound to `deviceId` | Partial (library framing) |
| **5 — Device Sync** | Scheduled catalog publisher | Deferred |
| **6 — Render** | PNG ZIP + MediaRecorder motion (WebM/MP4) | **Partial** (sizes still fixed 1290×2796) |

See also: [scan-phase-2-implementation-plan.md](./scan-phase-2-implementation-plan.md), [file-map.md](./file-map.md), ADR [0001-scan-adapter-registry](./adr/0001-scan-adapter-registry.md).

---

## Living flags (raise as we build)

> **Process:** After each meaningful build slice, update this table. Do not bury known gaps.
> Status legend: `OPEN` · `WATCH` · `DEFERRED` · `RESOLVED`  
> Severity: `P0` blocks trust/correctness · `P1` wrong UX/data · `P2` polish/hardening

| ID | Raised | Sev | Status | Flag | Owner / next |
|----|--------|-----|--------|------|----------------|
| F01 | 2026-08-14 | P1 | RESOLVED | Scan session survives refresh via localStorage snapshot | `scan-session.repo.ts` |
| F02 | 2026-08-14 | P1 | RESOLVED | `#f-competitors` syncs into Extra Sources | blur + scan sync |
| F03 | 2026-08-14 | P1 | RESOLVED | Uploads merge into asset bin + palette + canvas | `upload-merge.ts` |
| F04 | 2026-08-14 | P0 | RESOLVED | Export downloads PNG ZIP (+ manifest) | canvas render + zip |
| F05 | 2026-08-14 | P1 | RESOLVED | Phone mock shows scan screenshots/icon when present | `edit-canvas.ts` |
| F06 | 2026-08-14 | P1 | RESOLVED | Template / Replicator / Slideshow run via `mode.run` after Scan (`priorBrief`) | mode adapters |
| F07 | 2026-08-14 | P2 | RESOLVED | Play retry + HTML fallback when scraper fails; path logged in warnings | `play-fetch.ts` / `play-fetch-html.ts` |
| F08 | 2026-08-14 | P2 | RESOLVED | WebP/uploads converted client-side to PNG data URLs for palette | `palette-client.ts` |
| F09 | 2026-08-14 | P2 | RESOLVED | Public mode DNS resolve + private IP block (`SCAN_API_PUBLIC=1`) | `allowlist.ts` |
| F10 | 2026-08-14 | P2 | RESOLVED | CORS origin configurable via `SCAN_API_CORS_ORIGIN` | `server.ts` |
| F11 | 2026-08-14 | P1 | RESOLVED | Honest narrative: listing/Advanced or Missing — no invented lifestyle copy | `narrative-from-description.ts` |
| F12 | 2026-08-14 | P2 | RESOLVED | merge-pack unit test + `scripts/scan-smoke.ts` | run with scan-api up |
| F13 | 2026-08-14 | P1 | RESOLVED | Competitor fields polluted brand merge | Fixed: compare-only merge |
| F14 | 2026-08-14 | P1 | RESOLVED | One bad pack URL aborted entire pack | Fixed: per-source soft-fail |
| F15 | 2026-08-14 | P2 | RESOLVED | Concept palette overwrote global `--signal` | Fixed: `--project-accent` on canvas |
| F16 | 2026-08-14 | P2 | RESOLVED | Slideshow motion via MediaRecorder (WebM/MP4 when supported) | `slideshow-video.ts` |
| F17 | 2026-08-14 | P2 | RESOLVED | Projects persist in IndexedDB (`take-db`); migrates localStorage | `projects.repo.ts` |
| F18 | 2026-08-14 | P2 | RESOLVED | Screenshot asset selection on receipt feeds canvas/export | `selectedShotIds` |
| F19 | 2026-08-14 | P2 | RESOLVED | Intake edits stamp capture provenance `user` | `user-provenance.ts` |
| F20 | 2026-08-14 | P1 | RESOLVED | `mergeCapture` on re-scan preserves user provenance | `finalizeScan` |
| F21 | 2026-08-14 | P1 | RESOLVED | Uploads stored as data URLs (refresh-safe); strip dead `blob:` | `intake.uploads.ts` |
| F22 | 2026-08-14 | P2 | RESOLVED | `selectedShotIds` in session + project payload; receipt a11y | persist + hydrate |
| F23 | 2026-08-14 | P2 | RESOLVED | Advanced UX/tone/refs/donot/where/when → brief/frames/copy + session | Advanced panel |
| F24 | 2026-08-14 | P2 | WATCH | Google may still block both Play scraper and HTML fallback | Upload/marketing CTA |
### How to raise a flag

1. Add a row with next `F##`, today’s date, severity, `OPEN`/`WATCH`/`DEFERRED`.  
2. One-line impact + owner/next — no essays.  
3. When fixed: set `RESOLVED` and keep the row (history).  
4. Mirror honesty in `apps/web/src/shared/truth.ts` when UI claims change.  
5. Touch **As-built** / roadmap Status above if the architecture shape changed.

### As-built changelog (short)

| Date | Slice | Architecture note |
|------|-------|-------------------|
| 2026-08-14 | Scan Phase 2 WP0–WP4 + post-review patch | Pack, palette, adapter registry, locale; accent isolation; flags table started |
| 2026-08-14 | Scan→Product B+C path | Session persist; uploads; canvas assets; PNG ZIP; distinct modes; projects; public CORS/DNS flags |
| 2026-08-14 | C3 IndexedDB + gold-set | Projects → IndexedDB; asset select; user provenance; `docs/scan-gold-set.md` |
| 2026-08-14 | Post-impl fixes + F16 | Mode `priorBrief`; mergeCapture; data-URL uploads; selection persist; MediaRecorder motion |
| 2026-08-14 | Gold-set pass | API rows 1–5 PASS; client logic 6–8; `npm run test:gold` |
| 2026-08-14 | Scan close-out F11/F07/Advanced | Honest narrative; Play retry+HTML; Advanced wired; Scan truth REAL |
