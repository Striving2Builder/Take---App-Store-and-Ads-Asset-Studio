# Competitor screenshot parity — sprint plan

**Date:** 2026-08-15  
**Status:** Epic A shipped 2026-08-15 (F84–F86). Epic B shipped 2026-08-15 (F83/F87/F88). Epic C1 shipped 2026-08-15 (F82 projected shell). Epic D shipped 2026-08-15 (F89 type marks). Epic E shipped 2026-08-15 (F90 geometry pack). C2 WebGL not started.  
**Parent:** 20-set traffic light · F82 (3D) · F83 (proof-only slice) · Library recipes.

Related: [architecture.md](./architecture.md), [extra-layers-sprint.md](./extra-layers-sprint.md), [template-library-sprint.md](./template-library-sprint.md), [template-layout-engine.md](./template-layout-engine.md).

**Queued / do not mix in:** Device catalog web crawl (F80) · Slideshow destination · F25 photoreal OEM photos · F71 layered ZIP · F72 render-worker · competitor screenshots, logos, or lifestyle photos in the repo.

---

## Why this slice exists

The 20 competitor sets are **layout recipes we cannot yet author**, not ads to copy. Scoring today: **3 green / 9 yellow / 8 red**. Five geometry-only Library cards already exist (stagger, low crop, two-up, overlap pair, bleed+shape). They do not cover 3D phones, proof-only PNGs, widgets, or per-frame type.

**Library clones of all 20 wait until paint can actually produce those layouts.** Shipping empty titles that look like Streamio/Headway would be theater.

---

## Locked verdicts (approve before build)

| Topic | Decision |
|-------|----------|
| What we replicate | **Geometry + TAKE chrome.** Scan shots fill screens. No competitor UI, logos, people, or 3D merch in catalogs. |
| 3D vs photoreal OEM (F25) | **Separate.** F25 is photographed shells. This sprint is **parametric perspective** on the shell we already paint. |
| 3D stack (C1) | **Same 2D canvas.** `rotateXDeg` / `rotateYDeg` + box thickness, perspective-divide corners, screen mapped onto the front quad (strip of affine slices). **No Three.js / WebGL in C1.** |
| 3D stack (C2) | Offscreen WebGL device mesh **only if** C1 looks cheap past ~±25° on Streamio / Nordic / Cobalt. Do not start C2 in parallel. |
| Hands / lifestyle photos | **User ExtraSlot image**, z above the device. TAKE does not ship stock people or hands. |
| Proof-only PNG | Legal when that slice has **≥1 extra** (reviews, pills, rating). Still illegal if the slice is empty. |
| Devices per PNG | Raise solver cap **2 → 3** (fan). A 7-phone collage is **mini extras** (screenshot thumbs), not 7 `DeviceInstance`s. |
| Per-device orientation | Allowed: one landscape phone inside a **portrait store PNG**. Set `exportPx` stays portrait. |
| Type | Keep system kicker/headline/caption. Add **marks** on ExtraSlot copy (word-in-pill, underline) + one alternate face. Not a type foundry. |
| Extra cap | Proof walls need **6 / slice** (was 4). |
| Library pack | **Epic E only**, after A–D paint is real. Generic names (`Layout · bleed pair 5`), not brand names. |
| Painter | One `paintStripSlice`. 3D devices still clip at `i·W`. Export is still PNG ZIP. |

```
z (back → front)  — unchanged order
  world bg (solid / gradient / strip panorama)
  device shells + in-screen shots   ← C1 may project these
  extra visuals (shapes, user photos, mini-thumbs)
  extra copy + proof widgets
  type band
```

---

## Sequence (do not skip E to “look busy”)

| Epic | Job | Unlocks |
|------|-----|---------|
| **A — Chrome** | Shapes, per-frame type, proof widgets | Most yellow sets look like ads without 3D |
| **B — Rules** | 0-device slice, 3-phone fan, landscape-in-portrait, extra cap 6 | Reddit fan, Shadow Form, Streamio landscape, review walls |
| **C — 3D** | Perspective phones (the large epic) | Streamio, Nordic, Cobalt, Tidal, zeeb, Cosmic Drift |
| **D — Type marks** | Pill-on-word, underline, second face | Headway / Reddit / ThinkUp emphasis |
| **E — Library pack** | Geometry recipes for all 20 | Gallery parity — **last** |

---

## Epic A — Chrome (yellow)

**Flags:** F84 shapes · F85 per-frame type · F86 proof widgets.

### A1. Shape pack

Procedural extras, not uploaded competitor blobs: `blob`, `wave`, `star`, `dots`, `scribble`. `ExtraSlot` gains `shape?: string`. Paint in `paint-extras.ts`. One ExtraSlot with world `x` on an integer still spans two PNGs.

### A2. Per-frame type band

`TemplateRecord.typeBand?: TypeFamily[]` length `frameCount`. Missing → `typeFamily` for every slice. `type-band.ts` + `validateLayout` use the slice’s band. Inspector: Top / Bottom / Split / None per frame.

### A3. Proof widgets

Structured extras, not freeform text hoping to look like a wreath:

| Widget | Fields |
|--------|--------|
| `rating` | score, store label, optional wreath (TAKE SVG) |
| `review` | quote, name, stars |
| `pills` | string[] |

`ExtraSlot.kind` stays `copy` \| `visual`; add `widget?: "rating" | "review" | "pills"`. Cap **6 / slice**.

---

## Epic B — Layout rules (selected red)

**Flags:** F83 proof-only · F87 fan/cap · F88 per-instance orientation.

### B1. Proof-only slice (F83)

`validateLayout`: slice may have 0 devices **iff** extras for that slice ≥ 1. `generateLayout` still places ≥1 device unless the recipe is `authored` with extras. Empty PNG stays illegal.

### B2. Three-phone fan (F87)

`perSlice` max **3**. Grammar token `fan-3` optional. Calm-style **7 floating screens** = ExtraSlot visuals with `shotIndex` + rounded-rect, **not** DeviceInstances (no bezels-at-export-size × 7).

### B3. Landscape phone in portrait PNG (F88)

`DeviceInstance.orientation?: "portrait" | "landscape"`. Default = recipe `defaultOrientation`. Swap `w`/`h` aspect for that instance. Store file stays catalog portrait `exportPx`. Mixed **set** orientation is still one export size.

---

## Epic C — 3D perspective (large)

**Flag:** F82 — **C1 RESOLVED** (projected box + screen warp). Split **hands** out (user extra). This is not F25. C2 stays parked.

Today `rotationDeg` is **Z only**. Competitors show **thickness** (Y/X). CSS fake buttons and photographed OEM shells are the wrong tools (already parked in Device Catalog MVP).

### C1 — Projected shell (build this)

`DeviceInstance`:

| Field | Meaning |
|-------|---------|
| `rotationDeg` | Z, picture plane (already shipped) |
| `rotateXDeg` | Lean toward / away |
| `rotateYDeg` | See the left or right edge |
| `depth` | Thickness in slice-widths (default ~0.045) |

Paint:

1. Treat the shell as a box. Perspective-divide 8 corners (camera on +Z, focal length constant).
2. Fill side faces (bezel color, slightly darker).
3. Map the screenshot onto the **front** face: N vertical (or horizontal) strips with affine `drawImage` — cheap perspective warp, same `#layout-stage`.
4. Clip the projected AABB at `i·W` so bleed-next still works.

Hit / validate / drag: use the **projected front quad** AABB, not the unprojected rect. Alt-rotate stays Z; inspector has X/Y sliders (yaw ±35°, pitch ±20°) + presets **Yaw L/R**, **Pitch**.

Presets do **not** imply WebGL. Export uses the same painter (no F72).

### C2 — WebGL mesh (only if C1 fails)

Offscreen GL, composite into 2D. Same recipe fields. Do not add `three` / a second compositor “for smoothness.”

### Done when

A Library card with `rotateYDeg: 28` exports a PNG where the **side of the phone is visible**, the scan shot is on the face, and Set view + ZIP match Slice view. Streamio 1–2 bleed + yaw is the gold check.

---

## Epic D — Type marks

**Flag:** F89 — **RESOLVED**. ExtraSlot copy may include `**word**` → pill highlight, `++word++` → underline. Optional `face: "display" | "script"` on that slot only (bundled Caveat as Take Script, not a foundry). Headline system font unchanged. Gold card: `layout-type-marks-5`.

---

## Epic E — Library pack (last)

**Flag:** F90 — **RESOLVED**. 21 geometry-only `layout-*.json` cards (5 store canvases stay separate). Names are layout, not brand. Photo / illustration / panorama slots are **empty plates** — not stock people. Thumbs = `paintStripSlice(0)`.

| Ref (layout, not brand) | Needs | Recipe after E |
|-------------------------|-------|----------------|
| Studio White / Charcoal stagger | (shipped) | `layout-stagger-crop-5` |
| Studio White low crop | (shipped) | `layout-low-crop-5` |
| Stargazing two-up | (shipped) | `layout-two-up-mid-5` |
| Reddit / Trackio 2-up | (shipped) | `layout-overlap-pair-5` |
| Streamio bleed + shape | A1 + C1 | `layout-blob-across-5` upgraded, plus `layout-yaw-bleed-5` |
| Prism Glow | (shipped stagger + strip) | keep / alias |
| Parchment / Botanica | (shipped) | keep |
| Headway tilt + crop + objects | A1 + user extras | `layout-tilt-crop-5` |
| AI search + tag cloud PNG | A3 + B1 | `layout-proof-pills-5` |
| Pulse person-span | user panorama extra | `layout-photo-span-5` (empty extra slot) |
| Trackio objects on bezel | A1 + C1 | `layout-yaw-extra-5` |
| Insighto hand / person | user extra | `layout-overlay-photo-5` |
| feasto chef across cut | A1 + B1 | `layout-chef-span-5` (shape + proof wall) |
| Reddit 3-fan + dotted line | A1 + B2 + D | `layout-fan-3-5` |
| Cosmic Drift 3D span | C1 | `layout-yaw-bleed-5` |
| Stargazing blobs + badges | A1 + A3 | extend two-up |
| Talkivo phone + illustration bleed | C1 + user extra | `layout-bleed-illust-5` |
| Nordic / Cobalt 3D bleed | C1 | `layout-yaw-bleed-5` / `layout-yaw-stack-5` |
| Velvet / Tidal panorama + device | C1 + strip image | `layout-pano-yaw-5` |
| ThinkUp 3-cluster + bubble | B2 + A1 | `layout-fan-3-5` |
| zeeb 3-stack across 1–2 | B2 + C1 | `layout-yaw-stack-5` |
| Calm topo + 3 overlap + collage | A1 + B2 + mini extras | `layout-fan-3-5` + `layout-mini-scatter-5` |
| Shadow Form floating UI | B1 + A3 | `layout-proof-float-5` |

If a row still needs a **user photo**, the card ships with an empty visual extra and honest Library copy — not a stock person.

---

## Out of scope (still red after this sprint)

- Photoreal OEM device photography (F25)
- TAKE-owned hand / model / food photography
- Licensed script typefaces beyond one bundled face
- Phone spanning **three** PNGs as one object (solver stays two cuts / bleed)
- WebGL, Figma, Flash, render-worker (F72)

---

## Files (owned)

| Path | Role |
|------|------|
| `packages/template-engine/src/template.types.ts` | rotateX/Y, depth, orientation, typeBand, widget, shape |
| `packages/template-engine/src/project/perspective.ts` | **new** — box project + screen warp helpers (≤400 lines) |
| `apps/web/src/editor/paint-devices.ts` (or current shell paint) | C1 draw path |
| `packages/template-engine/src/constraints/validate-layout.ts` | 0-device + max 3 |
| `packages/template-engine/src/constraints/aabb.ts` | projected AABB |
| `apps/web/src/editor/paint-extras.ts` | shapes + widgets |
| `apps/web/src/editor/inspectors/` | X/Y rotate, type band, widgets |
| `catalogs/templates/2026.08/recipes/` | Epic E JSON only after A–D |
| `packages/template-engine/src/seeds/load-recipes.ts` | explicit imports |

---

## Tests / honesty

- `npm run test:templates` — validateLayout gold: empty illegal; extra-only OK; 3 devices OK; 4 devices fail; yaw AABB; typeBand[i]
- `npm run build`
- `truth.ts`: Library cards are geometry; 3D is projected shell not OEM photo; proof-only needs extras
- Living flags F82–F90; changelog one line per epic when it ships

C1 gold: `layout-yaw-bleed-5`. D gold: `layout-type-marks-5`. E: 21 geometry cards; photo plates stay empty. C2 only if C1 looks cheap past ~±25°.
