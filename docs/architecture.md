# TAKE — Architecture foundations

Redesign the current 3-file shell into a modular web-first system without forcing a rewrite of the UX you already have.

---

## Direct answer: device shells are NOT under Style & palette

| Domain | Meaning |
|--------|---------|
| **Style & palette** | Creative direction — colors, type mood, visual family (premium / bold / minimal) |
| **Device / shell** | Hardware templates — iPhone, Pixel, iPad specs, bezels, export sizes |

Those must stay separate. **Device Catalog (Phase 2)** owns hardware specs, geometric shells, insets, and export sizes. Style & palette never lists phones.

### Where device templates live

**Canonical home: Device Catalog** → `packages/device-catalog` + `catalogs/devices/`

- Versioned JSON specs (size-class reps, 5-year catalog / 3-year picker “Current”)
- Geometric PARTIAL frames until photoreal `shellAsset` files exist (F25)
- Updated later by **Device Sync** (Phase 5 — snapshot discover + ReviewGate + CLI publish; fetch off by default; no HTML scrape; no cron)

### Where you select the phone

1. **Intake** — Platform (iOS / Android / Both) sets default device family  
2. **Editor toolbar** — Device picker + Cover/Contain/Safe-area fit  
3. **Library recipe** — TemplateRecord binds to a `deviceId`  
4. **Export** — Sizes from `resolveExportSize(deviceId)` (not hardcoded 1290×2796)  

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
| Template family | Library recipes | Layout recipe referencing a `deviceId` |

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
│   ├── device-sync/              # on-demand catalog proposer (ReviewGate)
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
| `id` | e.g. `apple.iphone-16-pro-max` |
| `platform` | `ios` \| `android` \| `other` |
| `formFactor` | `phone` \| `tablet` |
| `viewportPx` / `exportPx` | Logical + store export sizes |
| `shellPx` / `screenInset` | Shell coords + screen rect (inset in shellPx) |
| `safeArea` | Fit bias for safe-area mode |
| `status` / `releasedAt` | `current` \| `supported` \| `deprecated` + ISO date |
| `shellKind` / `shellAsset` | `frame` (geometric) or `asset` path |
| `storeSizeClass` | e.g. `iphone-6.9`, `play-phone` |
| `storeTargets[]` | Which export presets this device feeds |
| `source` / `updatedAt` / `version` | Sync provenance |

**Depth policy:** Catalog retains ≤5 years; picker “Current” = ≤3 years; older IDs never deleted (projects may reference them).

**Composition:** Store PNG fills `exportPx` with geometric device shells. Catalog `hardware` hotspots (Dynamic Island, punch-hole, side buttons, home indicator) paint on the shared `paintDevice` path. Photoreal OEM photos stay F25. Catalog SVG assets remain `#phone-mock` preview when no layout recipe.

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
| Export preset checkboxes | `localStorage` `take.export-presets.v1` + project payload `exportPresetIds` |
| Postgres / RLS / cloud CRUD | **Not in architecture** — local-first by design |

### Still deferred

ASO depth · photoreal device shells · Device Sync HTML scrape (F100) / auto-publish / cron (F66) · LLM narrative NLP · layered/bundle ZIP (F71) · render-worker ffmpeg (F72)

---

## Phased roadmap (no big-bang rewrite)

Do not throw away the shell. Extract in place.

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **0 — Split** | Vite+TS; stages/modes/editor; domain types | **Done** |
| **1 — Real App Scan** | Apple + OG + receipt Captured/Inferred | **Done** |
| **1b — Scan Phase 2** | Adapter registry, Play, locale, pack, palette | **Done** |
| **2 — Device Catalog** | Device JSON + picker; export sizes from catalog; fit pipeline | **Partial** (geometric shells; photoreal F25) |
| **3 — Mode SDK** | Wizard + distinct Template/Replicator/Slideshow | **Partial** (Template door opens Library; Slideshow is Wizard+dwells) |
| **4 — Template engine** | Layout recipes + strip clip + grammar + slot drag + extras/panorama/Set | **Done** |
| **5 — Device Sync** | On-demand job + human review + CLI publish | **Partial** (snapshot discover + wizard + CLI; fetch off; no HTML F100; no cron F66) |
| **6 — Render** | Multi-size ZIP from export presets (store + social/IAB) | **Partial** (extra PNG sizes real; TikTok stretch video; layered/bundle FAKE; worker stub) |
| **Next — Template / Library** | Wizard = Scan; templates live in Library (Use applies) | **Done** ([template-library-sprint.md](./template-library-sprint.md) · F79/F52) |
| **Next — Competitor parity** | A–E shipped (geometry Library pack). C2 WebGL still parked. Post-impl honesty + C1 sliders | **Done** ([competitor-parity-sprint.md](./competitor-parity-sprint.md) · F82/F89–F93) |

See also: [template-layout-engine.md](./template-layout-engine.md), [template-engine-mvp-sprint.md](./template-engine-mvp-sprint.md), [template-library-sprint.md](./template-library-sprint.md), [competitor-parity-sprint.md](./competitor-parity-sprint.md), [mode-sdk-mvp-sprint.md](./mode-sdk-mvp-sprint.md), [device-catalog-mvp-sprint.md](./device-catalog-mvp-sprint.md), [device-sync-mvp-sprint.md](./device-sync-mvp-sprint.md), [render-mvp-sprint.md](./render-mvp-sprint.md), [extra-layers-sprint.md](./extra-layers-sprint.md), [scan-phase-2-implementation-plan.md](./scan-phase-2-implementation-plan.md), [file-map.md](./file-map.md), ADR [0001-scan-adapter-registry](./adr/0001-scan-adapter-registry.md).

---

## As-built: Device Catalog (Phase 2)

**Status (2026-08-15):** Catalog JSON is SSOT with front/back SVG families (19 devices). 2025 flagships + iPhone 16/16 Plus landed via Device Sync ReviewGate (inherited chrome, labeled). Preview Devices skips Generate. Orientation + Catalog sync wizard (session apply) are wired. Foldables are size stubs only.

### Data flow

```
catalogs/devices/{year}/{platform}/*.json
        │
        ▼
  load-catalog (explicit imports) → catalog cache
        │
        ├─ listDevices / resolvePickerGroup (3y Current / 3–5y Older)
        ├─ resolveDefaultDevice (iOS → Pro Max 1320×2868; Android → Pixel 9)
        ├─ resolveExportSize(deviceId) → WxH
        └─ fitScreenshot(cover|contain|safe-area)
                │
                ├─ apply-device-frame → #phone-mock aspect + inset CSS
                ├─ edit-canvas → .scan-shot-fill object-fit
                └─ shell-composite → frame-render / slideshow (store PNG = exportPx, no bezel)
```

### Honesty

| Claim | Truth |
|-------|-------|
| Device picker | REAL list from catalog; PARTIAL shells |
| Export size | REAL from selected device |
| Cross-OS shot reuse | PARTIAL geometric fit only |
| Device Sync | PARTIAL — snapshot discover + wizard + CLI; fetch off; never auto |

Verify: `npm run test:devices` · Scan still `npm run test:gold`

---

## As-built: Device Sync (Phase 5)

**Status (2026-08-15):** On-demand job + snapshot discovery + ReviewGate + session wizard + CLI approve/publish. First pack published: iPhone 16/16 Plus/17 family, Pixel 10, S25 (inherited chrome, F102). `npm run sync:devices` defaults to cited snapshots (not HTML). Optional Wikidata SPARQL JSON behind `DEVICE_SYNC_FETCH=1`. DNS private-IP blocked. File-gate queue at `.take-sync/queue.json`. Opt-in `--deprecate-missing`. No HTML scrape (F100). No cron (F66). Never “synced.” Catalog UI is Check for new devices / Add (F101); pack import is Advanced.

### Data flow

```
snapshots (default) / optional Wikidata JSON / manual pack / allowlisted JSON
        │
        ▼
normalize (store-size-class table + family inherit, labeled inferredFrom)
        │
        ▼
runDeviceSync (diff vs catalog) → CatalogPack.proposals
        │
        ▼
Catalog wizard ReviewGate (evidence URL required)
        ├─ Apply → replaceCatalog() session only
        └─ Download pack JSON
                │
                ▼
npm run catalog:publish — approved pack
        ├─ catalogs/devices/{year}/{platform}/{id}.json
        └─ regen packages/device-catalog/src/load-catalog.ts
```

### Honesty

| Claim | Truth |
|-------|-------|
| Propose / review | REAL — gate + evidence |
| Session apply | REAL — `replaceCatalog()` |
| Disk publish | REAL CLI — refuses unapproved / unevidenced |
| Discover missing devices | REAL — cited snapshots (offline) + optional Wikidata identity JSON. Not HTML. Shell chrome is inherited and labeled — not SKU-measured. |
| Live scrape / in-app crawl | FAKE — Check for new devices uses a bundled research list (not HTML). Add is session-only. HTML vendor pages are F100. |

Verify: `npm run test:sync` · `npm run test:devices`

---

## As-built: Render (Phase 6)

**Status (2026-08-15):** Locked scope + P2 leftovers done. Multi-size ZIP from `@take/export-presets`. One `paintExportFrame` at catalog `exportPx`, then cover / contain+pad into extra targets. TikTok + motion records an extra 1080×1920 video (cover). Layered / bundle stay FAKE (F71). `render-worker` stays stub (F72). Preset `emit` / `folder` on the package. Checkbox selection persists (localStorage + project).

### Impact

Default download is no longer “N catalog-sized PNGs regardless of checkboxes.” `defaultOn` is iOS screens + iOS feature + Play screens, so an iPhone session emits `screens/` (catalog) + `screens-play/` (Pixel contain) + `feature/ios-1024`. Checking Instagram / IAB / TikTok / Pin / YT / Play feature adds those WxH files. Unchecked presets emit nothing. Layered / bundle still produce no files (`skippedFake`). Slideshow video is catalog-sized; TikTok + motion also records a 1080×1920 cover stretch. Preset checks survive refresh and project open.

Store screenshots remain catalog `exportPx`. Extra sizes are the same paint, scaled. Do not treat a 300×250 IAB PNG as a newly composed layout.

### Data flow

```
paintExportFrame / paintStripSlice at catalog WxH
        │
        ├─ screens/                 store SSOT (exportPx)
        ├─ screens-play/            Play checked on a non-Android device (F29)
        ├─ screens-ios/             iOS checked on a non-iOS device
        ├─ feature/                 1024×1024 / 1024×500 contain+pad
        ├─ social/{target}/         cover or contain per target
        └─ iab/{slot}/              contain + letterbox (frame 0)
                 ▲
         fitCanvas(src, dest, cover|contain)
```

Do not re-run `generateLayout` at banner size. `#export-presets` is mounted from `allPresets()`.

### Honesty

| Claim | Truth |
|-------|-------|
| Store PNG | REAL — catalog `exportPx` |
| Social / IAB / feature PNG | REAL — `targets[]` WxH via cover or contain+pad |
| Dual store (F29) | REAL — extra folder, contain into platform default device |
| Layered / bundle | FAKE — checkbox → `skippedFake` only |
| Slideshow video | PARTIAL — catalog MediaRecorder; extra 1080×1920 when TikTok + motion |
| render-worker | STUB |

Verify: `npm run test:export` · web build

---

## As-built: Mode SDK (Phase 3)

**Status (2026-08):** Four `CreationMode` adapters still `run` after Scan. Review/Edit keep **one device canvas** (layout recipes swap in `#layout-stage`). Distinct feel comes from `getEditorPlugins()` / `getExportHints()` mounted in `#mode-review-slot` and `#mode-inspector-slot`. Regen goes through `runActiveMode` (no Wizard back door). Template Generate = `generateLayout` × qty; library Apply keeps the card. Replicator maps competitor pack structure (no art merge). Slideshow dwells feed existing MediaRecorder. Wizard Set view / extras / panorama call `ensureIsolatedRecipe` so they share `#layout-stage`.

### Data flow

```
Intake mode radio + Library Use (templateId)
        │
        ▼
  runActiveMode → getMode(id).run(input, ctx)
        │              ctx: priorBrief, seedPalette, lastPack,
        │                   templateId, deviceId, orientation
        ├─ Wizard     → generateSets (qty concepts) OR applyTemplate if templateId armed
        ├─ Template   → landing door → Library (radio hidden)
        ├─ Replicator → competitor beats / upload refs
        └─ Slideshow  → 6 beats + dwellMs
                │
                ▼
  applyModeRunResult → review rail + mode plugin slot
                │
                ├─ Edit: shared #phone-mock + Mode inspector plugin
                └─ Export: getExportHints (Slideshow motion on)
```

### Honesty

| Claim | Truth |
|-------|-------|
| Modes feel different | PARTIAL — same Scan→Review→Edit→Export stages; plugins + generate strategy |
| Template **mode** | Landing Template opens **Library**. Intake Template radio is hidden. Grammar `generateLayout` is Library **New layout**. |
| Template **engine** | REAL — sample-five JSON recipes + strip clip, drag, ExtraSlot, Set view |
| Library Use | REAL — apply when a brief exists; otherwise Wizard intake with the look armed |
| Replicator | PARTIAL — competitor structure map; not CV trace |
| Slideshow | PARTIAL — Wizard `generateSets` + 6 dwells + MediaRecorder; same destination as Wizard |

Verify: `npm run test:modes`

---

## As-built: Template engine (Phase 4)

**Status (2026-08-15):** Locked scope **Done**, including device-slot drag, ExtraSlot, strip panorama, and Edit Set view. **New layout** (Library) calls `generateLayout` (K-resample, grammar `2026.08`). Illegal draws fall back to isolated-center (`provenance.fallback`). Save stores seed + grammarVersion. Strip/isolated with devices paint via `paintStripSlice` (Review thumbs, `#layout-stage`, `#set-stage`, export, Library thumbs). Devices with `rotateXDeg`/`rotateYDeg` use a projected box + affine screen warp (`paint-devices.ts`); Z `rotationDeg` stays 2D. Drag/resize/rotate mutates recipe `x/y/w/h` (`authored`). First Set view / panorama / + Add extra on Wizard writes `ensureIsolatedRecipe`.

### Data flow

```
Generate (Template, qty N)
        │
        ▼
generateLayout × N  (seed, grammar, constraints, score)
        │
        ├─ legal candidate (max score)
        └─ else isolated-center fallback
        │
        ▼
applyTemplate(brief) → ProjectSet.layout.recipe
        │
        ├─ devices.length → paintStripSlice (strip = world bg; isolated = per-slice bg)
        ├─ Review thumbs / #layout-stage / export share the same clip
        └─ Apply library recipe → recipeFromSaved (seed or saved snapshot)
```

### Honesty

| Claim | Truth |
|-------|-------|
| Strip bleed | REAL — one world canvas, integer slice clip |
| Device in PNG | REAL geometric chrome from `hardware` (island / punch / buttons / home bar); not photoreal OEM (F25); per-device landscape-in-portrait |
| Layout generator | PARTIAL — combinatorics + jitter inside tokens; not LLM |
| Shot map | REAL — frame i uses shot i; extras stay empty |
| Unique forever | Finite grammar × seed; Save keeps that seed |
| lockBrand | REAL — locked recipe palette on Generate; unlocked uses scan seed |
| Save | REAL — Save as new or Update armed user recipe |
| Library Refresh | REAL on user cards (`refreshCopy`); system cards ask to duplicate first |
| Editor surface | REAL — `#layout-stage` is the export slice; overlay copy, `skipType` |
| Device drag | REAL — move / corner resize / Alt-rotate on recipe devices; Save stores `authored` x/y/w/h |
| Position presets | REAL — Layers grid stamps x/y/w/h; Bleed next/prev is one phone across two PNGs (`composition: strip`) |
| Extra layers | REAL — ExtraSlot copy/visual/shape/widget on `#layout-stage` (cap 6/slice); copy marks `**pill**` / `++underline++`; `face: script` is one bundled face, not the headline |
| Strip panorama | REAL — `BackgroundLayer.kind: image` across `n·W`; isolated paints per PNG |
| Set view | REAL — `#set-stage` carousel shares `paintStripSlice`; 72px rail stays minimap |

Verify: `npm run test:templates`

---

## As-built: Template / Library product (F79)

**Status (2026-08-15):** Shipped — [template-library-sprint.md](./template-library-sprint.md). **Wizard = Scan.** Templates live in Library. Landing Template opens the gallery. Five store-count canvases (5 / 8 / 10, iOS + Play, isolated + strip) plus **21 mobile geometry cards** (dual-store: one look each; Edit **iOS | Android** store-target swaps shell + aspect). Empty visual plates where a user photo is required. No competitor screenshots, logos, or stock people. **15 is not a store slot.** Device Sync discovery is CLI snapshots (F80); HTML scrape stays F100. Slideshow stays Wizard+dwells.

Base recipes are JSON in `catalogs/templates/2026.08/recipes/` loaded by `load-recipes.ts` (explicit Vite imports). Geometry pack is tagged `mobile` (not twin iOS/Play cards); Library iOS/Android filters also show mobile cards. Armed Wizard Generate / Use / Apply bind shell from intake brief. Library thumbs paint `paintStripSlice(0)`. Click the thumb to browse every slice. Use applies `projectSetFromRecipe` when a brief exists, otherwise arms Wizard. Armed Wizard Generate calls `applyTemplate`, not `generateSets`. **New layout** on a Library card is `generateLayout` (combinatorics).

| Claim | Truth |
|-------|-------|
| Landing Template | REAL — `showStage("library")` |
| Sample five | REAL — bleed-hook 5, iOS isolated 5/10, Play isolated 8, iOS strip 8 |
| Use | REAL — apply or Wizard-arm |
| Click thumb | REAL — all slices in a preview dialog |
| Title SEED cards | gone (`sys-ios-story` etc.) |
| Play count | `screenshotCountOk` Android max **8** |

Verify: `npm run test:templates` · `npm run test:modes`

---

## As-built: Extra layers, panorama, Set view

**Status (2026-08-15):** Shipped — [extra-layers-sprint.md](./extra-layers-sprint.md). No Adobe Flash. Bleed stays device-across-cut. Visual extras are not the world background.

Wizard first Set view / panorama / + Add copy or visual calls `ensureIsolatedRecipe` so everything shares `paintStripSlice` + `#layout-stage`. Paint order: background → devices → extras → type.

| Claim | Truth |
|-------|-------|
| Set view | REAL — `#set-stage` N canvases, same paint as export |
| Panorama | REAL — one image across strip world, clip at `i·W` |
| Isolated + image | REAL — per-slice draw (no fake continuity) |
| Extra copy/visual | REAL — ExtraSlot + drag; max 6 per slice; shapes + proof widgets; `**pill**` / `++underline++`; `face: script` |
| Per-PNG type | REAL — `typeBand[]`; `none` hides kicker/headline on that file |
| Layered ZIP | FAKE — F71 still deferred |

Verify: `npm run test:templates`

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
| F25 | 2026-08-14 | P1 | WATCH | TAKE SVG shells finished for families (not photoreal photos) | public/devices/shells |
| F26 | 2026-08-14 | P1 | WATCH | Cross-OS fit is geometry, not OS UI conversion | fit-control + hint |
| F27 | 2026-08-14 | P2 | RESOLVED | Catalog wizard: Propose→Review→Apply session; evidence required; honesty copy | `catalog-wizard.ts` |
| F28 | 2026-08-14 | P1 | RESOLVED | `apple.iphone-16-pro` was wrongly 1290×2796; now 1206×2622; default iOS = Pro Max 1320×2868 | JSON SSOT |
| F29 | 2026-08-14 | P2 | RESOLVED | Play/iOS store presets emit a second store folder when the device platform differs | export-zip + plan-export |
| F30 | 2026-08-14 | P1 | RESOLVED | Front shell identity cues (island/punch/buttons) via SVG families | Epic A |
| F31 | 2026-08-14 | P2 | RESOLVED | Back shells + landscape fronts/backs for phone/tablet families | shells pass |
| F32 | 2026-08-14 | P2 | RESOLVED | Catalog enriched to 19 devices (incl. fold/flip + 2025 snapshot publish). Inherited chrome tracked on F102 | catalogs/devices |
| F33 | 2026-08-14 | P2 | RESOLVED | Device preview ungate — Preview devices skips Generate | `preview-devices.ts` |
| F34 | 2026-08-14 | P2 | WATCH | Shell asset licensing / provenance must stay cited in JSON `source` | catalog policy |
| F35 | 2026-08-14 | P2 | WATCH | Orientation toggle wired (editor + export size) | orientation-control |
| F36 | 2026-08-14 | P2 | WATCH | Fold/Flip cover shells shipped; inner Fold / hinge editor still out | fold/flip SVG |
| F37 | 2026-08-14 | P2 | DEFERRED | Watch / TV / Vision device classes + composition | post-MVP |
| F38 | 2026-08-14 | P1 | RESOLVED | Review/Edit plugin slots + mode chrome; shared canvas kept by design | `mode-plugins.ts` |
| F39 | 2026-08-14 | P1 | RESOLVED | Template binds `deviceId` / `defaultOrientation`; Library Use arms `templateId` | template adapter + library |
| F40 | 2026-08-14 | P1 | RESOLVED | Replicator maps `lastPack` competitor sources; uploads optional | replicator adapter |
| F41 | 2026-08-14 | P2 | RESOLVED | Slideshow per-frame `dwellMs` + storyboard; MediaRecorder consumes dwells | slideshow + `slideshow-video.ts` |
| F42 | 2026-08-14 | P1 | RESOLVED | Regen-all / refresh-variant go through `runActiveMode` | `run-active-mode.ts` |
| F43 | 2026-08-14 | P2 | RESOLVED | `getEditorPlugins` / `getExportHints` on `CreationMode` | `packages/modes-sdk` |
| F44 | 2026-08-14 | P2 | RESOLVED | `SavedTemplate` persists `deviceId` + `defaultOrientation` | storage + template-save |
| F45 | 2026-08-14 | P2 | RESOLVED | Modes overview copy is consume/structure — not drag-drop / CV trace | `index.html` + `truth.ts` |
| F46 | 2026-08-14 | P2 | RESOLVED | Device-slot drag/resize/rotate on `#layout-stage` (not extra layers) | `layout-drag.ts` |
| F47 | 2026-08-14 | P2 | RESOLVED | Device-shell library seeds removed; `isLayoutRecipe` filter | templates.repo seed |
| F48 | 2026-08-14 | P1 | RESOLVED | `TemplateRecord` holds composition, devices, background; storage hydrates by id | template-engine schema |
| F49 | 2026-08-14 | P1 | RESOLVED | Template mode calls `applyTemplate` (copy still rule-based) | `applyTemplate` + adapter |
| F50 | 2026-08-14 | P2 | RESOLVED | `lockBrand` stamps Generate palette (adapter + recipe + projectSetFromRecipe) | template.adapter + generateLayout |
| F51 | 2026-08-14 | P2 | RESOLVED | Library Refresh = `refreshCopy` on user cards; system cards ask to duplicate | library.render.ts |
| F52 | 2026-08-14 | P2 | RESOLVED | Grammar JSON + sample-five recipes in `catalogs/templates/2026.08`; title SEED gone | catalogs + `load-recipes.ts` |
| F53 | 2026-08-14 | P2 | RESOLVED | ExtraSlot copy/visual + paint on `#layout-stage`; + Add buttons real | extra-layers sprint |
| F54 | 2026-08-14 | P2 | RESOLVED | Per-device x/y/w/h authored via drag/resize (`DeviceInstance.authored`) | transform-device + layout-drag |
| F55 | 2026-08-14 | P2 | RESOLVED | Social/IAB/feature checkboxes emit listed WxH PNGs (cover / contain+pad) | plan-export + fit-canvas |
| F56 | 2026-08-14 | P2 | DEFERRED | User templates still localStorage (not IndexedDB) | after recipe SSOT |
| F57 | 2026-08-14 | P1 | RESOLVED | Ordered 1:1 shot map (`mapShotsToFrames` + `shotUrlAt`) — no `i % n` | apply + export + editor |
| F58 | 2026-08-14 | P1 | RESOLVED | Strip compositor clips world at `i·W`; bleed-next seed + joined preview | `paintStripSlice` |
| F59 | 2026-08-14 | P1 | RESOLVED | `generateLayout()` on Template Generate (qty = N layouts); not LLM | `generate-layout.ts` |
| F60 | 2026-08-14 | P1 | RESOLVED | Grammar JSON + visibleFrac / type-band / max-2 solver; illegal draws rejected | catalogs/templates + validate-layout |
| F61 | 2026-08-14 | P2 | RESOLVED | Provenance seed + grammarVersion; isolated-center fallback labeled | generate-layout orchestrator |
| F62 | 2026-08-14 | P1 | RESOLVED | `runDeviceSync` diffs candidates vs catalog; writes proposal pack; no fetch by default | `job.ts` + `cli-sync.ts` |
| F63 | 2026-08-14 | P1 | RESOLVED | ReviewGate is wizard SSOT (localStorage); approve requires evidence URL | review-gate + catalog-wizard |
| F64 | 2026-08-14 | P1 | RESOLVED | `npm run catalog:publish` writes JSON + barrel only for approved+evidenced packs | `publish-pack.ts` |
| F65 | 2026-08-14 | P2 | RESOLVED | `generateBarrelSource` + CLI regen of `load-catalog.ts` explicit imports | write-barrel.ts |
| F66 | 2026-08-14 | P2 | DEFERRED | Scheduled Device Sync runner | after on-demand job |
| F67 | 2026-08-15 | P2 | RESOLVED | Diff + `--deprecate-missing` emits same-prefix deprecate-candidates; empty set never wipes catalog | `diff-catalog.ts` |
| F68 | 2026-08-15 | P2 | RESOLVED | Fetch DNS-resolves hosts and blocks private A/AAAA; literals include CGNAT/ULA | `node/resolve-host.ts` |
| F69 | 2026-08-15 | P2 | RESOLVED | CLI ingests file ReviewGate `.take-sync/queue.json`; wizard stays localStorage | `file-gate.ts` + `cli-sync.ts` |
| F70 | 2026-08-15 | P1 | RESOLVED | `ExportPreset.targets[]` numeric WxH + fit; `#export-presets` mounted from package | `packages/export-presets` |
| F71 | 2026-08-15 | P2 | DEFERRED | Layered pack + full bundle checkboxes are manifest-only — stay FAKE | export presets |
| F72 | 2026-08-15 | P2 | DEFERRED | `render-worker` throws “not implemented” — stay stub this sprint | `services/render-worker` |
| F73 | 2026-08-15 | P2 | RESOLVED | TikTok + motion records extra 1080×1920 video (cover from catalog paint) | `slideshow-video.ts` |
| F74 | 2026-08-15 | P2 | RESOLVED | `ExportPreset.emit` per-frame \| hero; `folder` for ZIP path | `preset.types.ts` |
| F75 | 2026-08-15 | P2 | RESOLVED | Preset checks in `take.export-presets.v1` + project `exportPresetIds` | persist-presets.ts |
| F76 | 2026-08-15 | P1 | RESOLVED | ExtraSlot copy/visual schema + z-order paint on `#layout-stage` | extras/ + paint-extras.ts |
| F77 | 2026-08-15 | P1 | RESOLVED | `BackgroundLayer.kind: image` — strip panorama clipped at `i·W` | paint-background.ts |
| F78 | 2026-08-15 | P2 | RESOLVED | Edit Set view (side-by-side carousel) for Wizard + Template | set-view.ts |
| F79 | 2026-08-15 | P1 | RESOLVED | Templates live in Library; Landing Template opens gallery; armed Wizard Generate applies the look | [template-library-sprint.md](./template-library-sprint.md) |
| F80 | 2026-08-15 | P1 | RESOLVED | Node discovery → normalize → ReviewGate. Cited snapshots (default) + optional Wikidata JSON. Not HTML. Not auto-publish. Wizard stays pack import (F101) | `run-discover.ts` + snapshots + `normalize-discovery.ts` |
| F81 | 2026-08-15 | P2 | RESOLVED | Position presets stamp selected device; bleed-next/prev parks on the integer cut | `apply-placement.ts` + Layers grid |
| F82 | 2026-08-15 | P1 | RESOLVED | C1 projected shell (`rotateXDeg`/`rotateYDeg` + depth, affine screen warp); not F25 OEM photos; not hands; C2 WebGL still deferred | `project/perspective.ts` + `paint-devices.ts` |
| F83 | 2026-08-15 | P2 | RESOLVED | Proof-only slice: 0 devices legal iff extras ≥ 1 on that slice | validateLayout |
| F84 | 2026-08-15 | P2 | RESOLVED | Procedural ExtraSlot shapes (blob / wave / star / dots / scribble) | paint-shapes.ts |
| F85 | 2026-08-15 | P2 | RESOLVED | Per-frame type band (`typeBand[]`); recipe typeFamily is the default | type-band.ts |
| F86 | 2026-08-15 | P2 | RESOLVED | Proof widgets: rating wreath, review card, pill row; extra cap 6/slice | ExtraSlot.widget |
| F87 | 2026-08-15 | P2 | RESOLVED | Solver max devices/slice 2 → 3; 7-phone collage = mini extras | validateLayout + ExtraSlot.shotIndex |
| F88 | 2026-08-15 | P2 | RESOLVED | Per-device orientation (landscape phone inside portrait store PNG) | DeviceInstance.orientation |
| F89 | 2026-08-15 | P2 | RESOLVED | ExtraSlot type marks (`**pill**` / `++underline++`) + one bundled script face; headline stays system-ui | copy-marks.ts + paint-copy-marks.ts |
| F90 | 2026-08-15 | P2 | RESOLVED | Library geometry pack for the 20 refs — layout names, empty photo plates, no competitor art | catalogs/templates recipes |
| F91 | 2026-08-15 | P1 | RESOLVED | Proof widgets are sample chrome until the user types score/quote; inspector fields; no 4.8/Alex/App Store in seeds | widget-copy.ts + widget-fields.ts |
| F92 | 2026-08-15 | P2 | RESOLVED | C1 yaw/pitch sliders on selected device; bleed cap 3; landscape cutStamp aspect; back-face cull | tilt-sliders.ts + apply-placement.ts + perspective.ts |
| F93 | 2026-08-15 | P2 | DEFERRED | generateLayout stays Z-only devices — does not invent yaw, marks, or proof extras | generate-layout.ts |
| F94 | 2026-08-15 | P1 | RESOLVED | Layout/ZIP bake island vs punch + side buttons from catalog `hardware`; SKU-tuned mute / Action / Camera Control; picker syncs recipe.deviceId | paint-shell-chrome.ts |
| F95 | 2026-08-15 | P1 | RESOLVED | Library Android filter starved — interim Play twin cards; superseded by F96 mobile + store-target | layout-android-port.ts |
| F96 | 2026-08-15 | P1 | RESOLVED | Dual-store layouts: one mobile geometry pack; Edit iOS\|Android store-target remaps shell/aspect; Play >8 frames warns | store-target-control.ts |
| F97 | 2026-08-15 | P1 | RESOLVED | Armed Wizard Generate binds mobile recipes via bindRecipeShell + brief/device shell | wizard.adapter.ts |
| F98 | 2026-08-15 | P1 | RESOLVED | Brief/intake owns platform on Use; New layout uses defaultDeviceIdForShell; intake radio sets state.platform | library-use.ts · store-target-control.ts |
| F99 | 2026-08-15 | P2 | RESOLVED | Mobile geometry appears under Mobile + iOS + Android Library filters | library-filter.ts |
| F100 | 2026-08-15 | P2 | DEFERRED | HTML scrape of Apple/Play/Samsung spec pages — isolate later; Phase 5 lock stands | after snapshot/Wikidata |
| F101 | 2026-08-15 | P2 | RESOLVED | Catalog UI: Check for new devices + Add (bundled list). Customer copy. Still not a live vendor crawl | catalog-wizard.ts |
| F102 | 2026-08-15 | P2 | WATCH | Published iPhone 16/17, Pixel 10, S25 use sibling family chrome — not SKU-measured bezels | snapshot inherit |

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
| 2026-08-14 | Phase 2 Device Catalog | JSON SSOT; resolveExportSize; fit cover/contain/safe-area; geometric frames; Sync stubs; F25–F29 |
| 2026-08-14 | Device Catalog gap raise | Front/back shells, catalog enrich, Edit ungate, export matrix → F30–F34 + todos |
| 2026-08-14 | Device Catalog MVP sprint | Plan `docs/device-catalog-mvp-sprint.md`; F27 wizard OPEN; F35 orientation; F31 back shells in MVP |
| 2026-08-14 | MVP deferred triage | Pull landscape art, fold stubs, template orientation field; park Watch/TV/3D/IAB/scrape — F36/F37 |
| 2026-08-14 | Device Catalog MVP build | Front/back SVG; preview ungate; orientation; catalog wizard; enrich+fold stubs; F33 RESOLVED |
| 2026-08-14 | Shells finish pass | Upgraded SVG families; landscape complete; fold/flip covers; calibrated insets; F30/F31 RESOLVED |
| 2026-08-14 | Phase 3 Mode SDK sprint | Plan `docs/mode-sdk-mvp-sprint.md`; F38–F47 raised; implement after approve |
| 2026-08-14 | Phase 3 Mode SDK build | Plugins + runActiveMode; Template bind; Replicator pack; Slideshow dwells; F38–F45/F47 RESOLVED |
| 2026-08-14 | Phase 4 Template engine sprint | Plan `docs/template-engine-mvp-sprint.md`; F48–F56 raised; F46 = drag-drop parked |
| 2026-08-14 | Phase 4 sequence vs span | Template = linked 5–12 PNG rail; span/diptych parked; F57 shot map |
| 2026-08-14 | Phase 4 strip compositor | Lower-row example: `composition: strip` + bleed-next in MVP; F58; F46 still no freeform drag |
| 2026-08-14 | Phase 4 layout generator | Differentiator: `generateLayout()` + save; F59; not LLM |
| 2026-08-14 | Layout grammar plan | `docs/template-layout-engine.md` — tokens, constraints, file split; F60/F61 |
| 2026-08-14 | Phase 4 strip paint | `applyTemplate` + ordered shots + `paintStripSlice` + bleed seed; generator queued after F58 |
| 2026-08-14 | Phase 4 layout generator | `generateLayout` + grammar 2026.08 + fallback; Template qty = N layouts; F59–F61 RESOLVED |
| 2026-08-14 | Phase 4 P2 polish | lockBrand Generate; save update vs new; catalog inset; review thumbs; #layout-stage; copy 1:1; library refreshCopy; F50/F51 RESOLVED |
| 2026-08-14 | Phase 4b device drag | `#layout-stage` move/resize/rotate mutates recipe; `authored` relaxes solver; F46/F54 RESOLVED; F53 extra layers still FAKE |
| 2026-08-14 | Phase 5 Device Sync plan | `docs/device-sync-mvp-sprint.md`; F62–F65 OPEN; F66 scheduled runner deferred |
| 2026-08-15 | Phase 5 Device Sync build | ReviewGate + evidence; job pack; wizard SSOT; CLI publish + barrel; F27/F62–F65 RESOLVED; F66 deferred |
| 2026-08-15 | Phase 5 post-impl review | Locked scope done; 0 P0/P1; leftovers F67–F69 WATCH |
| 2026-08-15 | Phase 5 P2 close-out | Deprecate-missing opt-in; DNS private block; file-gate queue; https evidence; F67–F69 RESOLVED |
| 2026-08-15 | Phase 6 Render plan | `docs/render-mvp-sprint.md`; F29/F55/F70 OPEN; F71/F72 deferred |
| 2026-08-15 | Phase 6 Render build | Multi-size ZIP + fitCanvas; presets from package; F29/F55/F70 RESOLVED; F71/F72 stay deferred |
| 2026-08-15 | Phase 6 post-impl review | Locked scope done; 0 P0/P1; leftovers F73–F75; impact: checkboxes change ZIP pixels |
| 2026-08-15 | Phase 6 P2 close-out | TikTok stretch video; emit/folder on presets; persist checkboxes; F73–F75 RESOLVED |
| 2026-08-15 | Extra layers / panorama / Set view plan | `docs/extra-layers-sprint.md`; F53 OPEN; F76–F78 OPEN; no Flash |
| 2026-08-15 | Extra layers as-built mapping | ensureIsolatedRecipe; one paintStripSlice; set-view.ts; image BackgroundLayer |
| 2026-08-15 | Extra layers / panorama / Set view | Set carousel; strip image bg; ExtraSlot drag; F53/F76–F78 RESOLVED; F71 still FAKE |
| 2026-08-15 | Honesty: modes vs product | Template mode ≠ Library gallery (F79); Catalog UI ≠ web crawl (F80); Slideshow = Wizard path + dwells |
| 2026-08-15 | Next: Template / Library plan | `docs/template-library-sprint.md`; F79 next; F80 + Slideshow queued |
| 2026-08-15 | Template / Library product | Sample-five JSON; Library Use applies; Landing Template → Library; F52/F79 RESOLVED; F80 stays OPEN |
| 2026-08-15 | Library look-inside | Click thumb opens all slices (same paint as export); Use still applies |
| 2026-08-15 | Position presets | Layers grid stamps Center/tilt/crop; Bleed next/prev = one device clipped at i·W; F81 RESOLVED |
| 2026-08-15 | Competitor parity | Traffic-light vs 20 refs; 5 layout-only Library cards; F82/F83 deferred (3D, empty-device slice) |
| 2026-08-15 | Parity sprint plan | Chrome → rules → 3D C1 → type marks → Library pack last; F82–F90 OPEN; no clones until paint exists |
| 2026-08-15 | Parity Epic A | Shapes, per-PNG type band, proof widgets; extra cap 6; F84–F86 RESOLVED |
| 2026-08-15 | Parity Epic B | Proof-only PNG, max 3 phones, landscape-in-portrait, mini-screen extra; F83/F87/F88 RESOLVED |
| 2026-08-15 | Parity Epic C1 | Yaw/pitch projected box + screen warp; `layout-yaw-bleed-5`; F82 RESOLVED; C2 WebGL not started |
| 2026-08-15 | Parity Epic D | ExtraSlot `**pill**` / `++underline++` + bundled Caveat as Take Script; `layout-type-marks-5`; F89 RESOLVED |
| 2026-08-15 | Parity Epic E | 21 geometry Library cards for the 20 refs; empty photo plates; F90 RESOLVED |
| 2026-08-15 | Parity post-impl | Arrow-key caret; sample widgets + inspector; yaw/pitch sliders; landscape bleed; bleed cap 3; F91/F92 RESOLVED; F93 deferred |
| 2026-08-15 | Shell chrome bake-in | Geometric island/punch/buttons on paintDevice; SKU hardware cues; F94 RESOLVED |
| 2026-08-15 | Android Library ports | Interim 21 Play twins (F95); replaced by mobile + store-target |
| 2026-08-15 | Mobile store-target | Collapse twins → mobile pack; Edit iOS\|Android toggle; F96 RESOLVED |
| 2026-08-15 | Store-target post-impl | Armed Generate / New layout / filter gaps → F97–F99 OPEN |
| 2026-08-15 | Store-target close-out | Armed bind + brief precedence + filter mobile under iOS/Android; F97–F99 RESOLVED |
| 2026-08-15 | Device Sync F80 discover | Snapshot adapter + size-class map + family inherit; optional Wikidata JSON; F80 RESOLVED; F100 HTML deferred; F101 wizard import WATCH |
| 2026-08-15 | Device Sync F80 publish | ReviewGate CLI approve + 7 devices into catalogs/devices/ + barrel; F32 RESOLVED; F102 inherited chrome WATCH |
| 2026-08-15 | Catalog wizard snapshots | Propose cited snapshots in UI (bundled, no scrape); F101 RESOLVED |
| 2026-08-15 | Catalog customer copy | Check / You’re up to date / Add cards — no CLI jargon in the primary UI |
