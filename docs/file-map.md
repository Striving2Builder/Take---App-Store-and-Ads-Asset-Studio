# TAKE — Granular file map

**Rule:** Prefer **≤300 lines** per file; hard ceiling **~400**. If a file grows past that, split by ownership — do not “just add another function.”

**Rule:** One concern per file. A layer (e.g. UX Shell) is a *folder*; each owned item is its *own file*.

---

## Legend

| Tag | Meaning |
|-----|---------|
| `LIVE` | Populated from current shell / wired |
| `STUB` | Foundation file ready to fill |
| `DATA` | Versioned catalog data |

---

## `apps/web` — UI application

```
apps/web/
├── index.html                          # document shell only (mount point)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.ts                         # boot only — import + startApp()
    ├── styles/
    │   ├── main.css                    # @imports only — no rules
    │   ├── tokens.css                  # CSS variables
    │   ├── fonts.css                   # bundled Take Script (Caveat) for ExtraSlot.face
    │   ├── base.css                    # reset, typography defaults
    │   ├── atmosphere.css              # noise / scanline overlays
    │   ├── buttons.css
    │   ├── forms.css
    │   ├── crop-marks.css
    │   └── responsive.css              # breakpoints only
    │
    ├── app/                            # application runtime
    │   ├── start-app.ts                # wire modules, first paint
    │   ├── app-state.ts                # in-memory state object
    │   ├── stage-machine.ts            # show/hide stages
    │   └── event-bus.ts                # lightweight pub/sub (optional)
    │
    ├── shell/                          # UX SHELL layer
    │   ├── topbar.ts                   # brand + sticky header chrome
    │   ├── nav.ts                      # top nav jump links
    │   ├── progress-pips.ts            # Scan → Generate → Edit → Export
    │   ├── toast.ts
    │   ├── modal.ts                    # template save dialog helpers
    │   └── shell.css                   # topbar / nav / pips styles
    │
    ├── stages/                         # one folder per stage
    │   ├── landing/
    │   │   ├── landing.html.ts         # markup template
    │   │   ├── landing.controller.ts   # bind CTAs
    │   │   └── landing.css
    │   ├── modes-overview/
    │   │   ├── modes-overview.html.ts
    │   │   ├── modes-overview.controller.ts
    │   │   └── modes-overview.css
    │   ├── intake/
    │   │   ├── intake.form.ts          # collectIntake / field reads
    │   │   ├── intake.uploads.ts       # data-URL uploads
    │   │   ├── intake.actions.ts       # Scan + Generate wiring
    │   │   ├── intake.missing.ts
    │   │   ├── scan-pipeline.ts        # hydrate / finalize / pack scan
    │   │   ├── persist-scan-session.ts
    │   │   ├── upload-merge.ts
    │   │   ├── user-provenance.ts
    │   │   ├── palette-client.ts
    │   │   ├── scan-locale.ts
    │   │   ├── scan-sources.ts
    │   │   ├── scan-receipt.ts
    │   │   ├── scan-receipt.pack.ts
    │   │   └── intake.css
    │   ├── generate/
    │   │   ├── generate.html.ts
    │   │   ├── generate.controller.ts  # scan theater runner
    │   │   └── generate.css
    │   ├── review/
    │   │   ├── review.html.ts
    │   │   ├── review.controller.ts
    │   │   ├── review.render.ts        # layout thumbs via paintStripSlice
    │   │   └── review.css
    │   ├── edit/
    │   │   ├── edit.html.ts
    │   │   ├── edit.controller.ts
    │   │   └── edit.css
    │   ├── export/
    │   │   ├── export.controller.ts
    │   │   ├── export-zip.ts            # plan + paint + extra sizes
    │   │   ├── mount-presets.ts         # #export-presets from package
    │   │   ├── persist-presets.ts       # localStorage + session ids
    │   │   ├── fit-canvas.ts            # cover / contain draw
    │   │   ├── frame-render.ts
    │   │   ├── paint-strip-slice.ts     # world clip → PNG (shared with preview)
    │   │   ├── paint-devices.ts         # 2D shells + C1 projected yaw/pitch
    │   │   ├── paint-shell-chrome.ts    # island / punch / buttons from catalog hardware
    │   │   ├── shell-chrome-map.ts      # shellPx → local map
    │   │   ├── paint-background.ts      # solid / gradient / image
    │   │   ├── paint-extras.ts          # ExtraSlot after devices
    │   │   ├── canvas-round-rect.ts     # shared rounded-rect path
    │   │   ├── paint-copy-marks.ts      # **pill** / ++underline++ + script face
    │   │   ├── paint-widgets.ts         # rating / review / pills
    │   │   ├── paint-shapes.ts          # blob/wave/star/dots/scribble
    │   │   ├── selected-shots.ts        # ordered 1:1, no modulo
    │   │   ├── canvas-text.ts
    │   │   ├── slideshow-video.ts
    │   │   └── …
    │   ├── library/
    │   │   ├── library.html.ts
    │   │   ├── library.controller.ts
    │   │   ├── library.render.ts
    │   │   ├── library-filter.ts        # Mobile pack under iOS + Android filters
    │   │   ├── library-thumb.ts         # paintStripSlice(0) card preview
    │   │   ├── library-preview.ts       # click thumb → all slices
    │   │   ├── library-use.ts           # Use apply / Wizard-arm; New layout
    │   │   └── library.css
    │   └── catalog/
    │       ├── catalog-wizard.ts       # Check / Add; disk publish is Advanced
    │       └── catalog-copy.ts         # customer-facing catalog strings
    │
    ├── modes/                          # MODE plugins (UI adapters)
    │   ├── register-modes.ts
    │   ├── run-active-mode.ts          # shared Generate / regen path
    │   ├── mode-plugins.ts             # Review / Edit plugin host
    │   ├── apply-export-hints.ts
    │   ├── wizard/
    │   │   ├── wizard.adapter.ts
    │   │   └── wizard.plugin.ts
    │   ├── template/
    │   │   ├── template.adapter.ts
    │   │   ├── template-bind.ts
    │   │   ├── template-arm.ts
    │   │   ├── template-pick.ts
    │   │   ├── template-set.ts
    │   │   └── template.plugin.ts
    │   ├── replicator/
    │   │   ├── replicator.adapter.ts
    │   │   ├── replicator-builder.ts
    │   │   ├── competitor-beats.ts
    │   │   ├── replicator-ready.ts
    │   │   └── replicator.plugin.ts
    │   └── slideshow/
    │       ├── slideshow.adapter.ts
    │       ├── slideshow-builder.ts
    │       └── slideshow.plugin.ts
    │
    ├── editor/                         # EDITOR layer (not “style = device”)
    │   ├── frame-list.ts
    │   ├── canvas/
    │   │   ├── edit-canvas.ts          # #layout-stage = export slice when recipe has devices
    │   │   └── shot-content.ts         # contenteditable sync
    │   ├── layout/
    │   │   ├── attach-recipe.ts        # ensureIsolatedRecipe onto ProjectSet
    │   │   ├── layout-drag.ts          # device + extra move / resize / rotate
    │   │   └── layout-live-paint.ts    # debounce slice + strip preview
    │   ├── strip/
    │   │   ├── strip-preview.ts        # 72px minimap; shares paintStripSlice
    │   │   └── set-view.ts             # readable Set carousel
    │   ├── device/
    │   │   ├── device-picker.ts        # phone/tablet selector (optgroups)
    │   │   ├── store-target-control.ts # Edit iOS|Android shell bind
    │   │   ├── fit-control.ts          # cover / contain / safe-area
    │   │   ├── apply-device-frame.ts   # aspect + inset CSS vars
    │   │   └── shell-composite.ts      # shared fit plan for export
    │   ├── layers/
    │   │   └── layer-toggles.ts
    │   └── inspectors/
    │       ├── copy-inspector.ts       # store metadata fields
    │       ├── copy-marks.ts           # ExtraSlot **pill** / ++underline++ / face
    │       ├── widget-fields.ts        # selected proof widget score/quote/pills
    │       ├── tilt-sliders.ts         # C1 yaw/pitch on selected device
    │       ├── layers-inspector.ts
    │       ├── slice-rules.ts          # add/remove/fan/orient/mini on this PNG
    │       ├── position-presets.ts     # Center / tilt / bleed-next stamps
    │       └── style-inspector.ts      # palette + style family ONLY
    │
    ├── library-ui/                     # personal library actions beyond stage
    │   └── template-save.ts            # Save as new / Update armed user recipe + lockBrand
    │
    └── shared/
        ├── dom.ts                      # $, $$
        ├── escape.ts
        ├── download.ts
        └── typing-target.ts            # skip layout nudges in INPUT/TEXTAREA/SELECT
```

---

## `packages/` — shared domain (no UI chrome)

```
packages/
├── core/
│   ├── src/
│   │   ├── index.ts
│   │   ├── types/
│   │   │   ├── platform.ts
│   │   │   ├── intake.ts
│   │   │   ├── inference.ts
│   │   │   ├── project-set.ts
│   │   │   ├── frame.ts
│   │   │   └── store-copy.ts
│   │   ├── constants/
│   │   │   ├── meta-limits.ts
│   │   │   └── frame-roles.ts
│   │   └── validation/
│   │       ├── char-counts.ts
│   │       └── screenshot-count.ts
│   └── package.json
│
├── modes-sdk/
│   ├── src/
│   │   ├── index.ts
│   │   ├── creation-mode.ts          # interface
│   │   ├── registry.ts
│   │   └── context.ts                # ModeContext type
│   └── package.json
│
├── template-engine/                  # layout recipes + generateLayout
│   ├── src/
│   │   ├── index.ts
│   │   ├── template.types.ts
│   │   ├── ensure-isolated.ts        # Wizard → recipe; panorama helper
│   │   ├── extras/                   # ExtraSlot add / hit / transform / shapes / widget defaults / copy marks / widget-copy
│   │   ├── apply/                    # applyTemplate, map-shots, from-saved
│   │   ├── constraints/              # aabb, world, bleed, type-band, validate, hit-device, transform-device
│   │   ├── project/perspective.ts    # 2.5D box project + screen-warp strips
│   │   ├── seeds/load-recipes.ts     # explicit JSON imports (store + mobile pack)
│   │   ├── seeds/layout-android-port.ts # bindRecipeShell ios↔android (no twin cards)
│   │   ├── seeds/sample-five.ts      # authoring helpers → catalogs JSON
│   │   ├── seeds/layout-ref-helpers.ts
│   │   ├── seeds/layout-refs.ts      # core geometry cards (tag: mobile)
│   │   ├── seeds/layout-refs-pack.ts # Epic E pack (tilt, proof, yaw-stack, …)
│   │   ├── seeds/emit-layout-refs.ts # writes mobile layout JSON to catalogs
│   │   ├── seeds/strip-bleed-hook.ts # re-export from load-recipes
│   │   ├── presets/apply-placement.ts # Center / crop / yaw / pitch / bleed-next stamps
│   │   ├── presets/slice-devices.ts  # add/remove/fan-3/orientation
│   │   ├── grammar/                  # load 2026.08 JSON
│   │   ├── rng/seed.ts
│   │   ├── score/score-layout.ts
│   │   ├── generate/                 # set-plan, place, fallback, orchestrate
│   │   ├── variant.ts                # refreshCopy (geometry unchanged)
│   │   └── batch.ts                  # STUB
│   └── package.json
│
├── device-catalog/                   # NOT style/palette
│   ├── src/
│   │   ├── index.ts
│   │   ├── device.types.ts
│   │   ├── catalog.ts                # load/query devices
│   │   ├── load-catalog.ts           # explicit JSON imports (Vite)
│   │   ├── resolve-default.ts        # platform → default device
│   │   ├── resolve-export-size.ts    # single WxH source of truth
│   │   ├── fit-screenshot.ts         # pure cover/contain/safe-area
│   │   ├── filter-age.ts             # 3y / 5y helpers
│   │   ├── validate-device.ts
│   │   ├── fit-screenshot.test.ts
│   │   └── catalog-smoke.test.ts
│   └── package.json
│
├── scan-client/
│   ├── src/
│   │   ├── index.ts
│   │   ├── scan.types.ts             # Captured vs Inferred
│   │   ├── capture.schema.ts
│   │   ├── scan-pack.schema.ts       # multi-URL pack
│   │   ├── merge-pack.ts             # primary-wins merge
│   │   ├── palette.types.ts
│   │   ├── locale.presets.ts
│   │   ├── client.ts                 # scanApp / scanPack / fetchPalette
│   │   ├── from-capture.ts
│   │   ├── narrative-from-description.ts  # F11 honest heuristics
│   │   ├── url-detect.ts
│   │   └── fallback-infer.ts
│   └── package.json
│
├── export-presets/
│   ├── src/
│   │   ├── index.ts
│   │   ├── preset.types.ts          # targets[] + kind
│   │   ├── ios.presets.ts
│   │   ├── play.presets.ts
│   │   ├── social.presets.ts
│   │   ├── iab.presets.ts
│   │   ├── fit-rect.ts              # cover / contain math
│   │   ├── plan-export.ts           # ZIP file list (no paint)
│   │   └── resolve-ids.ts           # session vs stored vs defaultOn
│   └── package.json
│
└── storage/
    ├── src/
    │   ├── index.ts
    │   ├── keys.ts
    │   ├── local-json.ts             # get/set JSON helper
    │   ├── templates.repo.ts             # system cards from listSystemRecipes + user saves
    │   ├── history.repo.ts
    │   └── projects.repo.ts          # stub until project resume exists
    └── package.json
```

---

## `catalogs/` — versioned published data

```
catalogs/
├── devices/
│   ├── manifest.json                 # cutoff years + device ids
│   ├── 2024/ios/ · 2024/android/
│   ├── 2023/ios/
│   └── 2022/ios/ · 2022/android/     # curated size-class JSON
├── templates/
│   ├── manifest.json                 # grammarVersion + recipe ids
│   └── 2026.08/
│       ├── grammar/
│       │   ├── tokens.json
│       │   └── productions.json
│       └── recipes/                  # sample-five store canvases (JSON SSOT)
└── export-specs/
    └── store-rules.json              # optional / future
```

---

## `services/` — thin backends (stubs now)

```
services/
├── scan-api/
│   ├── package.json
│   ├── src/
│   │   ├── server.ts                 # /health /scan /scan/pack /palette
│   │   ├── routes/
│   │   │   ├── scan.route.ts
│   │   │   ├── scan-pack.route.ts
│   │   │   └── palette.route.ts
│   │   ├── palette/
│   │   │   └── extract-palette.ts
│   │   ├── adapters/
│   │   │   ├── adapter.types.ts
│   │   │   ├── registry.ts
│   │   │   ├── register-adapters.ts
│   │   │   ├── apple-lookup.ts
│   │   │   ├── play-meta.ts
│   │   │   ├── play/
│   │   │   │   ├── play-fetch.ts       # scraper + retry
│   │   │   │   ├── play-fetch-html.ts  # HTML fallback
│   │   │   │   ├── play-parse.ts
│   │   │   │   └── play-normalize.ts
│   │   │   └── og-meta.ts
│   │   └── security/
│   │       └── allowlist.ts
│   └── README.md
├── device-sync/
│   ├── package.json
    │   ├── src/
    │   │   ├── index.ts                  # browser-safe API
    │   │   ├── types.ts                  # DeviceProposal / CatalogPack
    │   │   ├── discover.types.ts         # RawDiscovery / NormalizedCandidate
    │   │   ├── store-size-classes.ts     # cited ASC / Play exportPx table
    │   │   ├── normalize-discovery.ts    # inherit + size class; no invented chrome
    │   │   ├── run-discover.ts           # batch normalize
    │   │   ├── bundled-snapshots.ts      # browser-safe fixture propose
    │   │   ├── adapters/snapshots.ts     # parse cited snapshot JSON
    │   │   ├── adapters/wikidata-parse.ts
    │   │   ├── sources/snapshots/2025-flagships.json
    │   │   ├── evidence.ts               # https evidence required
    │   │   ├── parse-pack.ts
    │   │   ├── review-gate.ts            # memory gate; approve needs evidence
    │   │   ├── materialize.ts
    │   │   ├── approve-pack.ts           # evidenced + valid → approved
    │   │   ├── diff-catalog.ts           # + proposalsFromNormalized
    │   │   ├── allowlist.ts              # Device Sync hosts (not App Scan)
    │   │   ├── job.ts                    # runDeviceSync — no fetch
    │   │   ├── publish-check.ts          # refuse unapproved packs
    │   │   ├── write-barrel.ts           # generate load-catalog.ts source
    │   │   ├── publishers/catalog-publisher.ts  # browser noop
    │   │   └── node/                     # CLI only (fs)
    │   │       ├── cli-sync.ts           # --discover snapshots (default)
    │   │       ├── cli-approve.ts        # evidence + materialize only
    │   │       ├── cli-publish.ts
    │   │       ├── disk-write.ts
    │   │       ├── load-snapshots.ts
    │   │       ├── fetch-json.ts         # DEVICE_SYNC_FETCH=1 JSON only
    │   │       ├── file-gate.ts          # .take-sync/queue.json persist
    │   │       └── resolve-host.ts       # DNS private-IP block
    │   └── README.md
└── render-worker/
    ├── package.json
    ├── src/
    │   └── worker.ts                 # STUB — PNG/MP4 later
    └── README.md
```

---

## Ownership cheat sheet (your example, expanded)

### UX Shell owns → separate files
| Owned item | File |
|------------|------|
| Stages (switching) | `app/stage-machine.ts` |
| Top bar chrome | `shell/topbar.ts` + `shell/shell.css` |
| Nav links | `shell/nav.ts` |
| Progress pips | `shell/progress-pips.ts` |
| Responsive layout | `styles/responsive.css` |
| Toasts | `shell/toast.ts` |
| Modals | `shell/modal.ts` |

### Modes layer owns → separate files per mode
| Mode | File |
|------|------|
| Contract | `packages/modes-sdk/src/creation-mode.ts` + `context.ts` + `plugins.ts` |
| Registry | `packages/modes-sdk/src/registry.ts` |
| Run path | `apps/web/src/modes/run-active-mode.ts` |
| Plugin host | `apps/web/src/modes/mode-plugins.ts` |
| Wizard | `…/wizard/wizard.adapter.ts` + `wizard.plugin.ts` |
| Template | `…/template/template.adapter.ts` + bind/arm/plugin |
| Replicator | `…/replicator/replicator.adapter.ts` + builder/beats/plugin |
| Slideshow | `…/slideshow/slideshow.adapter.ts` + builder/plugin |

### Device catalog owns (not Style inspector)
| Item | File |
|------|------|
| Types | `packages/device-catalog/src/device.types.ts` |
| Query API | `packages/device-catalog/src/catalog.ts` |
| Export size | `packages/device-catalog/src/resolve-export-size.ts` |
| Fit math | `packages/device-catalog/src/fit-screenshot.ts` |
| Picker UI | `apps/web/src/editor/device/device-picker.ts` |
| Fit control | `apps/web/src/editor/device/fit-control.ts` |
| Frame CSS | `apps/web/src/editor/device/apply-device-frame.ts` |
| Export composite | `apps/web/src/editor/device/shell-composite.ts` |
| Extra ZIP sizes | `packages/export-presets/src/plan-export.ts` + `apps/web/src/stages/export/export-zip.ts` |
| Device JSON | `catalogs/devices/...` |

### Style inspector owns (creative only)
| Item | File |
|------|------|
| Palette UI | `editor/inspectors/style-inspector.ts` |
| Style family | same file or `style-family.ts` if it grows |

---

## Split triggers (enforce in review)

1. File **>300 lines** → plan a split before merging more features  
2. File **>400 lines** → must split  
3. Two domains in one file (e.g. device + palette) → split immediately  
4. New creation mode → new folder under `modes/`, never bolt onto wizard  

---

## Migration note

Legacy root `index.html` / `css/take.css` / `js/take.js` are superseded by `apps/web`. Keep them only until the Vite preview is verified, then remove or move to `_legacy/`.
