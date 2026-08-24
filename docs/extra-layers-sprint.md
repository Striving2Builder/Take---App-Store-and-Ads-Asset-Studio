# Extra layers, panorama, and Edit set view — plan

**Date:** 2026-08-15  
**Status:** Shipped 2026-08-15 (F53 / F76–F78 RESOLVED). F71 layered ZIP still FAKE.  
**Parent:** F53 (extra copy/visual), F58 (strip clip), Phase 4 template engine, Phase 6 export sizes.

Related: [architecture.md](./architecture.md), [template-engine-mvp-sprint.md](./template-engine-mvp-sprint.md), [template-layout-engine.md](./template-layout-engine.md).

---

## Why this slice exists

Users bring **non-conforming source art** (one landscape hero, a 16:9 still, too few shots, a poster) and still need **legal store PNGs**: catalog `exportPx`, 1–10 (iOS) / 2–10 (Play), one file per slot.

TAKE already does part of that:

| Job | Today |
|-----|--------|
| Fit a screenshot *inside* the device | REAL — cover / contain / safe-area |
| Store pixel size | REAL — catalog `exportPx` + Phase 6 extra social/IAB files |
| Count check | REAL — validation card |
| Continuous campaign across N PNGs | REAL for **recipes** — `paintStripSlice` clips a shared world |
| Extra stickers / extra copy blocks | REAL — ExtraSlot on `#layout-stage` (cap 4/slice) |
| Upload one wide image as the world behind devices | REAL — `BackgroundLayer.kind: image`; strip = n·W; isolated = per PNG |
| Large side-by-side of the whole set | REAL — `#set-stage` readable carousel; `#strip-preview` stays 72px minimap |

This plan is **not** App Store review automation and **not** a second compositor. It is: more honest authoring on the **existing** `#layout-stage` + strip world.

---

## Locked verdicts (approve before build)

| Topic | Decision |
|-------|----------|
| Adobe Flash / Animate | **No.** Dead in browsers, not in this stack, not more “smooth.” |
| Interaction model | HTML5 canvas + pointer we already use on `#layout-stage`. Smooth = requestAnimationFrame drag, not a plugin. |
| Extra layers vs background | **Different layers.** Visuals sit *on* the composition. The world background sits *under* devices. |
| Panorama name | **Strip panorama** — one image across `n · exportPx.w`, clipped per PNG. Do not call it bleed. **Bleed** stays *devices* that cross `i·W` (`bleed-next` / `bleed-prev`). |
| Store conformance | Extra layers do **not** replace cover/contain/safe-area inside the bezel. They add marketing chrome around (or beside) devices. Illegal source pixels in the screen slot stay a fit problem (F26). |
| Painter | One `paintStripSlice` / `paintExportFrame`. Extra slots paint in z-order. No Figma fork. |
| Set view | First-class Edit toggle: **Slice** (today’s focused frame) · **Set** (frames side by side, same paint). Wizard included — not recipe-only. |
| Layered ZIP (F71) | Still deferred. Extra layers in the editor can exist before a PSD/JSON pack. |
| Photoreal shells (F25) | Out of scope. |

```
z (back → front)
  strip panorama / solid / gradient     ← world, under everything
  device shells + in-screen screenshots ← catalog fit, not extra layers
  extra visuals (F53)                   ← stickers, shapes, extra images
  extra copy blocks (F53)               ← not kicker/headline/caption
  type band (existing slots)
```

---

## Q&A (product)

### Extra layers as store-conformance helpers

**Partly.** They help when the user has a *campaign* to stage: badges, a second headline, a small product shot beside the phone.

They do **not** make a 16:9 screenshot into a 6.9" iPhone screen by themselves. That is **fit** (already shipped) plus optional **strip panorama** (this plan). Count and `exportPx` stay validation + catalog.

### Should this be “in Flash”?

No. Smoothness comes from the same canvas path as device drag: pointer on `#layout-stage`, paint once, no iframe, no SWF. Competitors’ “set views” are HTML5 canvases, not Flash.

### Does + Add visual include the background behind devices?

**No.** That is `recipe.background` (and the proposed panorama). + Add visual is an **extra** graphic on top of that stack. Mixing them would make “hide background” also hide stickers, and would break strip continuity.

Layer toggle `bg` today only grades the *phone screen* fill — it is not the strip world. Honesty gap: rename later; do not overload F53.

### Landscape image → 5 store screenshots?

**Yes — as strip panorama, not as a new “bleed.”**

User uploads one wide (or tall) image → it becomes the **world** (`n × W` by `H`) → each exported PNG is `clip(i·W, 0, W, H)` — same math as today’s gradient strip.

- Default split count = current set length (5–10), clamped to store max 10.
- Fit: **cover** the world (may crop top/bottom) or **contain** (letterbox on brand color).
- Devices stay on top (wireframes / geometric shells).
- `bleed-next` still means a **phone** crossing the cut, not the photo.

Today: strip world is real; background **image** kind is not.

### Side-by-side of all devices in Edit?

**Yes.** Competitors lead with a set row. TAKE already has a joined rail for **recipes** (`#strip-preview`, REAL, 72px). Wizard / no-recipe Edit has no equivalent.

Plan: **Set view** — full-height (or large) frames in a row, click to focus Slice view. Same `paintStripSlice` / `paintExportFrame`. Not a second renderer. Isolated sets still show a gapless row of independent PNGs so users see the App Store carousel.

---

## Epics

### Epic A — Extra layer model (F53) (P1)

| ID | Item | Outcome |
|----|------|---------|
| A1 | `ExtraSlot`: `{ id, kind: "copy" \| "visual", x, y, w, h, rotationDeg, z, … }` on the recipe (or set.layout) | Typed, not toast |
| A2 | + Add copy / + Add visual create a slot; Save stores it | Buttons become REAL |
| A3 | Drag/resize on `#layout-stage` like devices (`authored`) | Same interaction language |
| A4 | Copy slot = extra text (not replacing kicker/headline/caption) | Fixed slots stay |
| A5 | Visual slot = image (upload) or simple fill/rect — no SVG editor | Bounded |
| A6 | Cap (e.g. max 4 extras per slice) | Not Figma |
| A7 | `truth.ts` FAKE → REAL for those buttons | Honesty |

### Epic B — Strip panorama (P1)

| ID | Item | Outcome |
|----|------|---------|
| B1 | `BackgroundLayer.kind: "image"` + object-URL / data-URL + `fit: cover \| contain` | World photo |
| B2 | Intake/Edit: “Use as strip panorama” on an upload | One landscape → N clips |
| B3 | `paintBackground` draws the image across `worldW × worldH` | Same clip as gradient |
| B4 | Isolated composition: image still allowed but **per-slice** (no false continuity) | Honesty |
| B5 | Tests: world width = n·W; slice i samples x = i·W | No modulo crop |

### Epic C — Edit Set view (P2)

| ID | Item | Outcome |
|----|------|---------|
| C1 | Slice \| Set toggle in Edit | Competitor-shaped, honest |
| C2 | Set view paints all frames side by side at a readable size (not 72px only) | Rail stays as a minimap or merges |
| C3 | Works **without** a layout recipe (Wizard) via `paintExportFrame` | Not Template-only |
| C4 | Click a frame in Set view → Slice + `activeFrame` | One selection model |

### Epic D — Store-conformance copy (P2)

| ID | Item | Outcome |
|----|------|---------|
| D1 | Validation already notes count + catalog WxH — add one line when panorama is on | “N clips from one world image” |
| D2 | Do not claim “App Store will accept this” | Fit + size + count only |

---

## Deferred (keep parked)

| Item | Why |
|------|-----|
| Adobe Flash / third-party SWF | Dead |
| Freeform unlimited layers / PSD (F71) | Different product |
| Regenerating layout at 300×250 | Phase 6 already scales paint |
| Photoreal OEM shells (F25) | Separate |
| Auto-detect “this JPEG is a 5-up” without user intent | Easy to lie; user picks panorama |
| LLM placing extras | Grammar + drag only |

---

## Implementation on as-built (no second architecture)

Do not add a Flash runtime, a Fabric/Figma engine, or a parallel `#phone-mock` compositor. Every PNG still comes from `paintExportFrame` → `paintStripSlice` when a recipe exists, then Phase 6 `fitCanvas` for extra sizes.

### Domain split (unchanged)

| Domain | Owns | Must not |
|--------|------|----------|
| Device catalog | `exportPx`, insets, in-screen fit | Extra stickers, panorama image |
| Style & palette | `palette[]`, style family | Device shells, ExtraSlot |
| Template engine | `TemplateRecord`: background, devices, **extras** | Fetch, App Scan URLs |
| Editor | Pointer on `#layout-stage`, Slice/Set chrome | A second paint math |
| Export | ZIP + motion from the same paint | Regenerating layout at 300×250 |
| Scan / uploads | Data-URL assets (already refresh-safe) | Device Sync |

### The Wizard gap

Wizard Edit today hides `#layout-stage` and uses `#phone-mock` (`edit-canvas.ts` `syncLayoutStage`). Extra slots and panorama are **world coordinates**. They only exist on a `TemplateRecord`.

**Rule:** first time the user opens **Set view**, attaches a **panorama**, or hits **+ Add copy/visual**, call `ensureIsolatedRecipe(set)` in `packages/template-engine`:

- `composition: "isolated"` (or `"strip"` if panorama)
- one centered `DeviceInstance` per frame, `shotIndex = i`
- `background` from palette until a panorama image is set
- write `set.layout.recipe`

After that, Wizard and Template share `#layout-stage`. No dual editor.

### Data flow

```
Upload / Scan assets (data-URL)
        │
        ├─ shotUrlAt(i)           → in-device screenshot (cover/contain/safe-area)
        └─ “Use as strip panorama” → BackgroundLayer.kind = "image"
                                              │
TemplateRecord (set.layout.recipe)
  background  (solid | gradient | image)      world, z-back
  devices[]   (existing drag)                 catalog shells
  extras[]    ExtraSlot copy | visual         F53
        │
        ▼
paintStripSlice(i)     clip world at i·W
        │
        ├─ #layout-slice-canvas   Slice view
        ├─ #set-stage             Set view (N canvases, same paint)
        ├─ #strip-preview         72px minimap (keep)
        └─ export-zip             Phase 6 folders / fitCanvas
```

### File ownership (≤400 lines)

| Concern | File |
|---------|------|
| `ExtraSlot` + `BackgroundLayer` image | `packages/template-engine/src/template.types.ts` |
| `ensureIsolatedRecipe` | `packages/template-engine/src/ensure-isolated.ts` (new) |
| Hit / move extras | `…/extras/hit-extra.ts` + `transform-extra.ts` (mirror `hit-device`) |
| Draw world image | `paint-strip-slice.ts` `paintBackground` (split `paint-background.ts` if it grows) |
| Draw extras after devices, before type | same paint file or `paint-extras.ts` |
| Pointer: devices then extras (top z wins) | `apps/web/src/editor/layout/layout-drag.ts` |
| Set view row | `apps/web/src/editor/strip/set-view.ts` (new) — do not bloat `strip-preview.ts` |
| Slice \| Set toggle | Edit chrome + `state.editView: "slice" \| "set"` |
| + Add copy / visual | `layers-inspector.ts` / `start-app.ts` — create slot, not toast |
| Panorama from upload | intake or layers: pick an asset, set `background.imageUrl` |
| Persist | already `set.layout.recipe` in project + Save template |

### Epic C — Set view

1. `state.editView = "slice" | "set"`.
2. `set-view.ts`: for `i in frames`, create a canvas, call `paintStripSlice` if recipe else `paintExportFrame` (Wizard before ensure). Click → `activeFrame` + Slice.
3. Readable width (not 72px). Keep `#strip-preview` as minimap or fold it into Set view later.
4. Same paint as export — the row *is* the store carousel.

### Epic B — Strip panorama

1. Extend `BackgroundLayer`: `{ kind: "image", imageUrl: string, fit: "cover" | "contain", colorA: pad }`.
2. `paintBackground`: draw image into `worldW × worldH` (`n·W` × `H`) with existing `fitRect` from `@take/export-presets` (already cover/contain math).
3. Slice clip unchanged (`ctx.drawImage` world at `-i·W`).
4. User action “Use as strip panorama” on an upload: `ensureIsolatedRecipe` with `composition: "strip"`, `n = clamp(frames, 5, 10)`.
5. Isolated + image = **per-slice** draw (honest: no fake continuity). Strip + image = one world.

### Epic A — Extra slots

1. `ExtraSlot = { id, kind: "copy" | "visual", sliceIndex, x, y, w, h, rotationDeg, z, text?, imageUrl? }` in slice-normalized units like `DeviceInstance`.
2. Cap 4 per slice. + Add appends; Save already serializes `recipe`.
3. `layout-drag.ts`: `hitExtra` after `hitDevice` (higher z). Reuse pointer + `authored`.
4. Copy extras are overlay text on the canvas (not `#shot-headline`). Existing kicker/headline/caption stay the store slots.
5. Visual extras: data-URL image or a filled rect. No SVG editor.

### What we do not touch

- `packages/device-catalog` (except reading `exportPx` as today)
- Device Sync / Scan adapters
- Phase 6 `planExportFiles` (folders stay; pixels come from richer paint)
- `render-worker`, F71 layered ZIP, F25 photoreal

### Persistence / honesty

Image URLs are **data-URLs** (same as uploads, F21). No `blob:` that dies on refresh. `truth.ts`: Set view REAL once painted from export path; panorama PARTIAL until image kind ships; add-copy/visual FAKE until ExtraSlot round-trips.

---

## Suggested order

```
C1–C4 Set view (high UX, reuses paint) 
  → B1–B5 strip panorama (the landscape→N PNG job)
  → A1–A7 extra slots (F53)
  → D1–D2 copy
```

Set view first: it makes bleed and panorama *visible*. Extra layers second: they need a surface users can see across the set.

---

## Flags this plan owns

| ID | Sev | Meaning |
|----|-----|---------|
| F53 | P2 | Extra copy/visual buttons — RESOLVED |
| F76 | P1 | ExtraSlot schema + paint z-order — RESOLVED |
| F77 | P1 | `BackgroundLayer` image / strip panorama — RESOLVED |
| F78 | P2 | Edit Set view for all modes — RESOLVED |

---

## Done when

- [x] + Add copy / visual create saved slots (not toasts)
- [x] One landscape upload can fill a strip world and export N catalog-sized PNGs
- [x] Bleed still means devices crossing the cut; panorama means the background image
- [x] Edit Set view shows the full carousel for Wizard and Template
- [x] No Flash; no second compositor
- [x] F71 layered ZIP still FAKE
- [x] `truth.ts` matches
- [x] Tests for panorama clip + extra slot round-trip
