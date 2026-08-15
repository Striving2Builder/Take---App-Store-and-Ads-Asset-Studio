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
    │   │   ├── review.render.ts
    │   │   └── review.css
    │   ├── edit/
    │   │   ├── edit.html.ts
    │   │   ├── edit.controller.ts
    │   │   └── edit.css
    │   ├── export/
    │   │   ├── export.controller.ts
    │   │   ├── frame-render.ts
    │   │   ├── slideshow-video.ts
    │   │   └── …
    │   └── library/
    │       ├── library.html.ts
    │       ├── library.controller.ts
    │       ├── library.render.ts
    │       └── library.css
    │
    ├── modes/                          # MODE plugins (UI adapters)
    │   ├── register-modes.ts           # register all modes at boot
    │   ├── wizard/
    │   │   └── wizard.adapter.ts
    │   ├── template/
    │   │   └── template.adapter.ts
    │   ├── replicator/
    │   │   └── replicator.adapter.ts
    │   └── slideshow/
    │       └── slideshow.adapter.ts
    │
    ├── editor/                         # EDITOR layer (not “style = device”)
    │   ├── frame-list.ts
    │   ├── canvas/
    │   │   ├── edit-canvas.ts
    │   │   ├── phone-mock.ts
    │   │   └── shot-content.ts         # contenteditable sync
    │   ├── device/
    │   │   └── device-picker.ts        # phone/tablet selector (NEW home)
    │   ├── layers/
    │   │   └── layer-toggles.ts
    │   └── inspectors/
    │       ├── copy-inspector.ts       # store metadata fields
    │       ├── layers-inspector.ts
    │       └── style-inspector.ts      # palette + style family ONLY
    │
    ├── library-ui/                     # personal library actions beyond stage
    │   └── template-save.ts
    │
    └── shared/
        ├── dom.ts                      # $, $$
        ├── escape.ts
        └── download.ts
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
├── template-engine/
│   ├── src/
│   │   ├── index.ts
│   │   ├── template.types.ts
│   │   ├── variant.ts                # refresh structural variant
│   │   └── batch.ts
│   └── package.json
│
├── device-catalog/                   # NOT style/palette
│   ├── src/
│   │   ├── index.ts
│   │   ├── device.types.ts
│   │   ├── catalog.ts                # load/query devices
│   │   ├── resolve-default.ts        # platform → default device
│   │   └── validate-device.ts
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
│   │   ├── preset.types.ts
│   │   ├── ios.presets.ts
│   │   ├── play.presets.ts
│   │   ├── social.presets.ts
│   │   └── iab.presets.ts
│   └── package.json
│
└── storage/
    ├── src/
    │   ├── index.ts
    │   ├── keys.ts
    │   ├── local-json.ts             # get/set JSON helper
    │   ├── templates.repo.ts
    │   ├── history.repo.ts
    │   └── projects.repo.ts          # stub until project resume exists
    └── package.json
```

---

## `catalogs/` — versioned published data

```
catalogs/
├── devices/
│   ├── manifest.json
│   └── 2026.08/
│       ├── apple.iphone-16-pro.json
│       ├── apple.ipad-pro-13.json
│       ├── google.pixel-9.json
│       └── shells/                   # svg/webp (add as assets land)
├── templates/
│   └── system/
│       └── .gitkeep
└── export-specs/
    └── store-rules.json
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
│   │   ├── job.ts
│   │   └── publishers/
│   │       └── catalog-publisher.ts
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
| Contract | `packages/modes-sdk/src/creation-mode.ts` |
| Registry | `packages/modes-sdk/src/registry.ts` |
| Wizard | `apps/web/src/modes/wizard/wizard.adapter.ts` + package pipeline later |
| Template | `…/template/template.adapter.ts` |
| Replicator | `…/replicator/replicator.adapter.ts` |
| Slideshow | `…/slideshow/slideshow.adapter.ts` |

### Device catalog owns (not Style inspector)
| Item | File |
|------|------|
| Types | `packages/device-catalog/src/device.types.ts` |
| Query API | `packages/device-catalog/src/catalog.ts` |
| Picker UI | `apps/web/src/editor/device/device-picker.ts` |
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
