# Render — Phase 6 Sprint Plan

**Date:** 2026-08-15  
**Goal:** Make export **presets change the files in the ZIP** — social, IAB, and feature-graphic pixel sizes — without a second compositor and without a fake “exported for Instagram” label on a phone-sized PNG.  
**Out of scope:** photoreal shells, Device Sync scrape/cron, Watch/TV/Vision, extra copy/visual layers (F53), ASO depth, LLM, Figma layered PSD.

Related: [architecture.md](./architecture.md) F29 + F55 + F16, `packages/export-presets`, `apps/web` export stage, `services/render-worker` stub.

**Approve this plan before implementation.**

---

## What exists today (honest)

| Piece | Status |
|-------|--------|
| PNG ZIP | REAL — one size = catalog `exportPx` × orientation |
| Strip / isolated paint | REAL — `paintStripSlice` / `paintExportFrame` |
| Slideshow motion | PARTIAL — MediaRecorder WebM/MP4 at the **same** catalog size (F16) |
| Preset checkboxes | PARTIAL — recorded in `manifest.json`; iOS vs Play **noted** in validation |
| `sizeForSelectedPresets()` | PARTIAL — can *suggest* a default iOS/Android device; **ZIP ignores it** (F29) |
| `@take/export-presets` | PARTIAL — `sizes` is a **display string**; HTML is hardcoded, not from the package |
| ios-feature 1024×1024 / Play 1024×500 | FAKE as output — labels only |
| IG / TikTok / YT / Pin / IAB | FAKE as output — labels only (F55) |
| Layered pack / full bundle | FAKE — checkbox → manifest key only |
| `render-worker` | STUB — throws |

Store screenshots at device `exportPx` stay the SSOT for App Store / Play. Phase 6 adds **extra files**, it does not replace that SSOT.

---

## Product verdict (lock before build)

| Topic | Decision |
|-------|----------|
| Store screens | Still `resolveExportSize(deviceId, orientation)` — catalog owns WxH |
| Extra presets | Emit **additional** PNGs in the same ZIP under destination folders |
| Painter | **One** `paintExportFrame` / `paintStripSlice`. Scale or letterbox into the target. Do not re-run `generateLayout` at 300×250 |
| Fit | Social story/reel: **cover** into 1080×1920. Feed / IAB / feature: **contain + pad** (letterbox) on brand background |
| Preset SSOT | `ExportPreset` gains numeric `targets: { w, h, fit }[]`. `#export-presets` is **rendered from the package** |
| iOS vs Play screens | If both checked and platforms differ, ZIP contains **both** store sizes (not a silent swap of the only PNG) — closes F29 honestly |
| Motion | Keep browser MediaRecorder. Optional second 1080×1920 video only if TikTok/Reels is checked (stretch) |
| Layered / bundle | Stay FAKE (F71) unless a real JSON+PNG layer spec appears — do not pretend |
| render-worker | Stay stub (F72). No ffmpeg server in this sprint |
| Strip at tiny sizes | Paint at catalog size, then scale — bezels/type stay legal in source space |

```
paintExportFrame(i) at catalog WxH
        │
        ├─ screens/{device}/01.png          always (store SSOT)
        ├─ screens/play/01.png              if play-screens and platform mismatch
        ├─ feature/ios-1024.png             if ios-feature
        ├─ social/ig-feed/01.png            if ig
        └─ iab/mpu-300x250.png              if iab (HOOK frame or frame 0)
                 ▲
         scale / letterbox — same pixels, new canvas
```

---

## Epics

### Epic A — Preset schema (P1)

| ID | Item | Outcome |
|----|------|---------|
| A1 | `ExportPreset.targets: { id, w, h, fit: "cover" \| "contain" }[]` | Numeric sizes, not only a label string |
| A2 | Keep `sizes` string for UI chrome | Honesty in the checkbox row |
| A3 | Render `#export-presets` from `allPresets()` | HTML stops drifting from the package |
| A4 | Tests: every social/IAB/feature preset has ≥1 target | No theater sizes |

### Epic B — Multi-size ZIP (P1)

| ID | Item | Outcome |
|----|------|---------|
| B1 | `fitCanvas(src, dest, fit, padColor)` shared helper | One scaler |
| B2 | For each checked preset × each frame (or feature = frame 0), write PNG under `presetId/targetId/` | Checking IG produces 1080×1350 and/or 1080×1920 files |
| B3 | Store screens path unchanged: `screens/` at catalog size | App Store set still valid |
| B4 | F29: Play-only on an iPhone session writes `screens/` (apple) **and** `screens-play/` (Pixel default) when play-screens is checked | Validation note becomes files |
| B5 | Manifest lists each emitted `{ path, w, h, preset, fit }` | Traceable |

### Epic C — Honesty + motion (P2)

| ID | Item | Outcome |
|----|------|---------|
| C1 | `truth.ts`: presets PARTIAL→ closer to REAL; layered/bundle stay FAKE | No fake-as-real |
| C2 | Unchecked presets emit nothing | Checkboxes mean something |
| C3 | Motion still catalog-sized unless stretch C4 | Don’t silently stretch video |
| C4 | Stretch: TikTok checked → extra 1080×1920 WebM | Optional |
| C5 | F16 stays WATCH if MIME is browser-dependent | Honest motion |

### Epic D — Tests (P2)

| ID | Item | Outcome |
|----|------|---------|
| D1 | `fitCanvas` cover/contain unit tests (pixel canvas or mocked ImageData) | Fit math |
| D2 | Preset target table snapshot | A4 |
| D3 | Export file-list pure function: given selected ids + device size → expected paths | No DOM ZIP in CI |
| D4 | `npm run test:export` | Runnable |

---

## Deferred (keep parked)

| Item | Why |
|------|-----|
| `render-worker` ffmpeg / headless Chrome | Browser ZIP + MediaRecorder is the product; worker is ops |
| Layered PSD / JSON+PNG extra layers | F53 / F71 — new canvas model |
| Per-preset layout regeneration | Would invent illegal 300×250 strip recipes |
| Photoreal in export | F25 |
| Device Sync fetch-on | Phase 5 leftover, not Render |
| ASO localization packs beyond locale in manifest | Scan owns locale |

---

## Suggested order

```
A1–A2 typed targets
  → A3 HTML from package
  → B1 fitCanvas
  → B2–B5 multi-size ZIP + F29 dual store
  → C1–C2 truth
  → D1–D4 tests
  → C4 stretch video only if time
```

Do not start render-worker. Do not treat layered/bundle as in-scope.

---

## Flags this sprint owns

| ID | Sev | Meaning |
|----|-----|---------|
| F29 | P2 | Store preset checkboxes don’t change ZIP pixels — fix via B4 |
| F55 | P2 | Social/IAB sizes unused at render — fix via B2 |
| F70 | P1 | `ExportPreset.sizes` is a string; no numeric targets |
| F71 | P2 | Layered + bundle checkboxes are manifest-only — stay FAKE |
| F72 | P2 | render-worker stub — stay stub |

---

## Done when

- [x] Checking Instagram writes 1080×1350 and/or 1080×1920 PNGs in the ZIP
- [x] Checking IAB writes 300×250 (and listed companions) — letterboxed, not a cropped lie
- [x] Store `screens/` still match catalog `exportPx`
- [x] Play-only on iOS device emits a second store size folder (F29)
- [x] `#export-presets` comes from `@take/export-presets`
- [x] Layered / bundle still FAKE in `truth.ts`
- [x] No render-worker theater
- [x] `npm run test:export` + web build green
