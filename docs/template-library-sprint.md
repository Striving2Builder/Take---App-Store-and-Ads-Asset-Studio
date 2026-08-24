# Template / Library product — sprint plan (F79)

**Date:** 2026-08-15  
**Status:** Plan only — approve before build.  
**Parent:** F79 (Template mode is not a look gallery), F52 (identity cards still SEED), Phase 4 template **engine** (already Done).

Related: [architecture.md](./architecture.md), [template-engine-mvp-sprint.md](./template-engine-mvp-sprint.md), [file-map.md](./file-map.md).

**Queued after this sprint (do not mix in):** Device catalog web crawl (F80) · Slideshow as its own destination · F56 IndexedDB templates · F71 layered ZIP.

---

## Why this slice exists

The **engine** can paint a recipe. The **product** still cannot:

| What the user expects | What happens today |
|-----------------------|-------------------|
| Click **Template** → pick a look | Same Scan → Generate as Wizard. Template is a fake sibling of Scan. |
| **Library** is where templates live | Separate stage (correct). Cards are SEED **titles** with **no `layout`**. Preview is a gradient tile. |
| **Use** on a card | Arms intake, toast “scan then Generate.” Does not apply that look. |

Only `seed-strip-bleed-hook` hydrates a real `TemplateRecord`. Inspector “Apply library recipe” is the sole apply-card path, and empty-layout cards become `devices: []`.

This sprint makes **Library the place templates live** and **Wizard the Scan path**. Landing “Template” is not a second Scan. The engine stays; this is destination wiring.

---

## Two destinations (locked) — matches how you think about it

| Surface | Job | Must not |
|---------|-----|----------|
| **Wizard** | **Scan.** URL/uploads → brief → Generate concept sets → Edit → ZIP. | Be a template gallery. Require a library card. |
| **Library** | **Templates.** Browse real recipes, preview the look, **Use** applies it. Save as template lands here. | Be the Scan intake. Show name-only SEED titles. Invent a new layout on Use. |

**There is no third Scan called Template.** Under the previous plan, Template vs Wizard was only “same intake, different `run()` after Generate.” That is not a product difference you can see. So:

| Landing card | Goes to |
|--------------|---------|
| Wizard | Intake (Scan) |
| Template | **Library** (the gallery) |
| Replicator / Slideshow | Unchanged this sprint (still queued) |

```
Wizard                          Library
─────                           ───────
Scan → generateSets → Edit      Cards with real layout JSON
                                Use, brief exists  → applyTemplate → Edit
                                Use, no brief yet  → Wizard intake, recipe armed
                                                     “Scan to fill this look”
                                                     Generate applies THAT recipe
                                                     (not a new grammar layout)
```

`generateLayout` is **New layout** on a Library card or in Edit — not a mode you pick before Scan.

---

## Locked verdicts (approve before build)

| Topic | Decision |
|-------|----------|
| Scan = Wizard | Intake + Generate concepts. Landing Wizard stays the Scan door. |
| Templates live in Library | Gallery of real recipes. Use applies. Save as template writes here. |
| Landing **Template** | Jumps to **Library**, not intake. Not a sibling Scan mode. |
| Intake **Template** radio | Remove or hide. Armed recipe is a Library Use in progress, not a mode. |
| A card is a recipe or it is hidden | `layout` (or seed id that hydrates devices). No name-only SEED. |
| Use without a scan | Wizard intake, recipe armed, copy: scan fills **this** look. Generate **applies** it. |
| Use with a scan / open project | Apply recipe, open **Edit**. |
| `generateLayout` | Labeled **New layout** (Library or Edit). Not “Template mode Generate.” |
| System recipes | `catalogs/templates/2026.08/recipes/*.json`. Storage SEED titles **go**. |
| Card preview | Real `paintStripSlice`. No gradient theater. |
| Store canvas | Each slice is catalog `exportPx` for the bound device. Dual store = F29 contain, not a second authored file. |
| Frame counts | Sample mix **5 / 8 / 10**. Play cap **8**. No 15-up store template. Editor 12 warns. |
| F80 crawl / Slideshow destination | Out of scope this sprint. |
| Photoreal shells / LLM / Figma | Out. |

---

## What “pre-made templates” means here

A **system recipe** is a finished **store canvas**, not a mood-board name:

- **Canvas** = `frameCount` slices, each **catalog `exportPx`** for the bound `deviceId` (iOS 6.9" class = iPhone 16 Pro Max **1320×2868**; Play phone = Pixel 9 **1080×2424** today). That is the App Store / Play screenshot file. Social/IAB sizes are the same paint scaled (Phase 6) — not a second template.
- **Shots** sit in pre-placed **device slots** (`shotIndex` 0…n−1, ordered 1:1). Too few scans → empty screens (honest). Extra scans stay unused.
- **Story** = the sequence of slices (roles HOOK → …), plus strip continuity when `composition: "strip"`.
- Copy still comes from `applyTemplate` + the scan brief. The template owns **placement**, not the listing text.

### Store counts (locked — do not ship illegal N)

| Store | Legal screenshot slots | TAKE |
|-------|------------------------|------|
| App Store | **1–10** per device size | Templates at 5, 6, 8, or **10**. |
| Google Play (phone) | **2–8** | Play-bound templates at 5, 6, or **8**. Not 10. |
| Editor ceiling | 12 today | Optional extra beats in Edit — **validation must warn**; ZIP store folders still cap. |
| **15 frames** | **Not a store format** | Do not sell a 15-up as App Store/Play. Use Slideshow / social cover (1080×1920) if we need a longer cut later. |

`screenshotCountOk` today allows Android **10** — this sprint should clamp Play to **8** so templates and validation agree.

**Both stores from one look:** author on one `deviceId`. Checking the other store preset **contain-fits** into that store’s default device (F29). Sample set includes one iOS-authored recipe that is meant to travel to Play. We do **not** hand-draw 30×2 canvases.

### Sample five (this sprint — prove the factory)

Hand-authored JSON in `catalogs/templates/2026.08/recipes/`. Each must `validateLayout` and paint on `#layout-stage`.

| # | id | Store bind | N | Composition | What we are proving |
|---|-----|------------|---|-------------|---------------------|
| 1 | `seed-strip-bleed-hook` | iOS Pro Max | **5** | strip | Continuity / bleed already real — keep |
| 2 | `sys-ios-isolated-5` | iOS Pro Max | **5** | isolated | Short story, one device per PNG, type-top |
| 3 | `sys-ios-isolated-10` | iOS Pro Max | **10** | isolated | Full App Store cap, 1:1 shot map |
| 4 | `sys-play-isolated-8` | Pixel 9 | **8** | isolated | Full Play phone cap, bold type |
| 5 | `sys-ios-strip-8` | iOS Pro Max | **8** | strip | Longer strip; dual-store ZIP via Play checkbox (contain) |

No 1-frame “feature plate” as a screenshot template (feature graphic is a **preset**, 1024×1024 / 1024×500). No IG/TikTok/IAB **cards**.

**Done for the sample:** Library shows five real thumbs; Use drops shots into those slots; export PNG WxH matches the bind; Play-8 and iOS-10 validate; a 12- or 15-frame card is not in the catalog.

### Path to 25–30 (after the sample is right)

Competitive depth is **distinct looks**, not illegal frame counts. Grow on these axes (pick, don’t explode every combo):

| Axis | Values | Notes |
|------|--------|--------|
| Count | 5 · 6 · 8 · 10 (iOS) / 5 · 6 · 8 (Play) | Mix of short / full-cap stories |
| Composition | isolated · strip | ~⅓ strip so bleed stays a TAKE differentiator |
| Type band | top · bottom · split | Headline placement |
| Style / palette family | premium · bold · minimal | Background + type scale, not a new engine |
| Bind | iOS Pro Max · Pixel 9 | Plus dual-store travel on iOS-authored looks |
| Optional later | landscape, tablet | Not in the first 30 |

Rough mix for ~28: 10 isolated iOS (5/8/10) + 6 strip iOS + 8 isolated Play (5/8) + 4 strip Play. Author in the editor, **Save as template**, then graduate JSON into `catalogs/templates` (same as devices). Do not generate 30 from `generateLayout` and call them pre-made — combinatorics is “New layout,” not the library.

User saves stay in Library as **Mine** and do not count toward the 25–30 system set.

---

## Epics

### Epic A — System recipes as data (F52) (P1)

| ID | Item | Outcome |
|----|------|---------|
| A1 | `catalogs/templates/2026.08/recipes/*.json` + manifest list | Data as data, not `templates.repo` titles |
| A2 | Load system recipes in storage / template-engine (explicit imports, Vite) | Same pattern as device catalog |
| A3 | Remove name-only `sys-ios-story`, `sys-play-bold`, `sys-ig-organic`, `sys-tiktok-cut`, `sys-iab-mpu`, `sys-feature-ios` unless replaced by a real JSON recipe | Library stops lying |
| A4 | `recipeFromSaved` always returns `devices.length ≥ 1` for listed system ids | No empty apply |
| A5 | Tests: every manifest recipe hydrates; bleed-hook still strip; Play-8 / iOS-10 counts | `test:templates` |
| A6 | Ship the **sample five** in the table above (not 25) | Prove canvas + store WxH + shot slots |
| A7 | `screenshotCountOk`: Android `frameMax = 8` | Play templates and validation agree |

### Epic B — Library is the gallery (P1)

| ID | Item | Outcome |
|----|------|---------|
| B1 | Card preview = export paint (slice 0), not CSS gradient | Looks are visible |
| B2 | **Use** applies `recipeFromSaved` + `projectSetFromRecipe` when a brief exists → **Edit** | Destination matches the name |
| B3 | **Use** with no brief → **Wizard** intake, recipe armed, copy: scan to fill **this** look; Generate applies it | Honest fill, not a Template mode |
| B4 | Filter **System** vs **Mine** stays; hide cards without layout | Gallery integrity |
| B5 | Projects stay a separate row (Open → Edit). Do not mix with recipe Use | Library ≠ project list confusion |

### Epic C — Stop Template-as-Scan (P1)

| ID | Item | Outcome |
|----|------|---------|
| C1 | Landing **Template** → `data-jump="library"` (not intake) | Templates live in Library |
| C2 | Hide/remove intake **Template** radio + `#template-arm` | Scan is Wizard only |
| C3 | If a recipe is armed (Use with no brief), Wizard Generate **applies** that recipe instead of `generateSets` | Fill-this-look, still Wizard door |
| C4 | After apply, clear arm or keep for Save/Update | One apply math |
| C5 | **New layout** = `generateLayout` from Library or Edit — labeled combinatorics | Grammar stays, not a mode |
| C6 | Landing copy: Template = Library gallery | No “second Scan” lie |

### Epic D — Honesty / roadmap (P2)

| ID | Item | Outcome |
|----|------|---------|
| D1 | `truth.ts` Template + Library + arm | REAL once Use applies a look |
| D2 | F79 → RESOLVED when A–C ship; F52 → RESOLVED when SEED titles gone | Flags |
| D3 | F80 / Slideshow product stay OPEN / queued | This sprint does not steal them |

---

## Implementation on as-built (no second engine)

Reuse `recipeFromSaved`, `applyTemplate`, `projectSetFromRecipe`, `paintStripSlice`, `#layout-stage`. Do not add a marketplace, cloud CRUD, or a parallel compositor.

### File ownership (≤400 lines)

| Concern | File |
|---------|------|
| System recipe JSON | `catalogs/templates/2026.08/recipes/*.json` + `manifest.json` |
| Load barrel | `packages/template-engine/src/seeds/load-recipes.ts` (or storage) — explicit imports |
| Retire title SEED | `packages/storage/src/templates.repo.ts` |
| Landing Template → Library | `index.html` `data-mode-pick="template"` |
| Armed recipe on Wizard Generate | `wizard.adapter.ts` or `run-active-mode.ts` |
| Library Use + thumbs | `apps/web/src/stages/library/library.render.ts` (+ `library-thumb.ts` if paint bloats) |
| Tests | `from-saved.test.ts` or `load-recipes.test.ts` + existing `test:modes` |

### Data flow (target)

```
catalogs/templates/…/recipes/*.json
        │
        ▼
listLayoutTemplates() = system recipes ∪ user saves (all have layout)
        │
        └─ Library grid     preview paintStripSlice(0)
              Use, brief ──► applyTemplate → Edit
              Use, none  ──► Wizard intake, recipe armed
                             Generate ──► applyTemplate(armed, brief, shots)
                                      → set.layout.recipe → Edit / ZIP

Landing Template ──► Library
Landing Wizard   ──► Scan intake (generateSets unless a recipe is armed)
```

---

## Deferred (keep parked)

| Item | Why |
|------|-----|
| Device catalog web crawl (F80) | Next queued product after this |
| Slideshow as its own editor | Still Wizard+dwells; separate sprint |
| User templates IndexedDB (F56) | localStorage still OK if recipes serialize |
| Cloud template marketplace | Local-first |
| LLM filling recipe copy | `applyTemplate` stays listing-honest |
| Regenerating layout at 300×250 | Phase 6 already scales paint |

---

## Suggested order

```
A  System JSON + kill title SEED
B  Library thumbs + Use applies
C  Landing Template → Library; Wizard Generate applies armed recipe
D  truth + F79/F52
```

Library first (B after A) so the gallery is true before the landing door moves.

---

## Flags this plan owns

| ID | Sev | Meaning |
|----|-----|---------|
| F79 | P1 | Templates belong in Library; Template-as-Scan is not a product — **RESOLVED** this slice |
| F52 | P2 | Identity cards SEED — **RESOLVED** by JSON recipes |

Does **not** own F80 (crawl), F66 (cron), Slideshow destination.

---

## Done when

- [x] Five sample recipes in Library with real thumbs (5 / 8 / 10 mix, iOS + Play, isolated + strip)
- [x] Use places scan shots 1:1 into pre-placed device slots; export WxH matches the bind
- [x] Play-8 and iOS-10 pass count validation; no 15-frame store card
- [x] Landing Template opens Library, not Scan
- [x] Wizard without an armed recipe is unchanged (`generateSets`)
- [x] Name-only SEED titles are gone
- [x] F80 / Slideshow not quietly “fixed”
- [x] `truth.ts` matches
- [x] `npm run test:templates` + `test:modes` + web build
