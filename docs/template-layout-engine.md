# Layout generator — methodology + file architecture

**Date:** 2026-08-14  
**Status:** Generator LIVE (`generateLayout`, grammar `2026.08`). Strip paint LIVE. Not LLM.  
**Parent:** [template-engine-mvp-sprint.md](./template-engine-mvp-sprint.md) · flags F59–F61

**Build order (locked):** schema → apply isolated → **strip paint (F58)** → **then** generator (F59–F61). Do not generate bleeds until `paintStripSlice` is real.

Honesty: combinatorics + jitter inside tokens + reject-resample. **Not** LLM art. Truth badge PARTIAL.

---

## Why random x/y will fail

A phone that “bleeds” only works if:

- Enough of the shell remains in **each** slice (readable bezel + UI, not a 12px sliver)
- The cut is exactly at `i × exportPx.w` (store PNGs are independent files)
- Type sits in a **band** that does not cover the screen inset
- Screenshot pixels stay inside catalog `screenInset`
- The **set** still feels like one campaign (shared bg, 0–2 bleeds, not 8 unrelated accidents)

So: **sample from a grammar, then enforce constraints.** If a candidate fails, resample. If all fail, fall back to `isolated` + centered device (always legal). Never ship an illegal layout.

---

## Methodology (how a run works)

```
inputs: brief, selectedShots[], deviceId, orientation, qty, optional seed
        grammarVersion (from catalogs/templates/grammar)

1. SET PLAN (once)
   n            ← clamp(shots.length, 5, 10)   // store cap 10; editor max 12
   composition  ← weighted isolated | strip
   typeFamily   ← top | bottom | split
   scale        ← s | m | l
   bleedBudget  ← strip ? {0,1,2} : 0          // never bleed every frame
   bgToken      ← palette-driven gradient / solid
   rng          ← splitmix(seed || random)

2. PLACE (world or per-slice)
   For each device instance:
     token      ← grammar placement (center, left, bleed-next, …)
     jitter     ← rng inside that token’s AABB + rotation range
     shotIndex  ← ordered map (F57)

3. CONSTRAINTS (all must pass) → packages/template-engine constraints/
   • visibleFrac(device ∩ slice) ≥ 0.28 for every slice it touches
   • bleed only if shell AABB crosses x = i·W  (integer boundary)
   • type band ∩ screenInset = ∅  (or type-family flips)
   • max 3 device instances per slice (fan); empty slice legal iff extras ≥ 1
   • z: background < bleeder < local device < type
   • catalog screenInset fully inside shell quad (rotation accounted)

4. SCORE + PICK  (K = 12 candidates)
   + rhythm (not all-center)  + one strong bleed if budget≥1
   + type contrast vs bg      − overlap / tiny-sliver penalties
   pick max score; if none legal → isolated-center fallback (labeled)

5. PROVENANCE (saved on the recipe)
   { seed, grammarVersion, composition, scores, fallback?: true }
   Same seed + grammar + inputs = same layout  → tests + “buy unique, keep unique”
```

### Tokens, not freeform drag (MVP)

Uniqueness = **jitter inside a token**, not a Figma.

| Token | World meaning (strip) | Rotation range (example) |
|-------|----------------------|---------------------------|
| `center` | Device AABB inside one slice | −4° … +4° |
| `left` / `right` | Anchored to slice edge, fully inside | −8° … +8° |
| `bleed-next` | Center near `i·W`, crosses into i+1 | −18° … −6° or +6° … +18° |
| `bleed-prev` | Mirror | same |

Grammar JSON owns the numbers so we can ship **grammar v2** without rewriting the solver (moat evolves).

### Set coherence (the story rail)

- One background across the strip
- One type family / scale for the set; per-role override only (HOOK type-heavy, PROOF shot-forward)
- At most **two** bleed events in a 5–10 frame set
- Isolated kind: no world bleed; still unique via type family + scale + shot-forward mix

### Reproducibility = the “buy from us” keep

Saving a generated template stores the **seed + grammarVersion**. Re-open / export / share the same recipe. Generate again with a new seed → new legal layout. Catalog seeds remain the floor.

---

## Domain split (do not mix)

| Package / layer | Owns | Must not |
|-----------------|------|----------|
| **template-engine** | Grammar, RNG, constraints, score, `generateLayout`, `applyTemplate`, world AABBs | Device SVG, Scan fetch, Style tokens as chrome |
| **device-catalog** | `exportPx`, `screenInset`, shell aspect | Layout recipes |
| **apps/web export** | `paintStripSlice` — rasterize world rects to canvas | Inventing coordinates |
| **apps/web modes/template** | Generate / save / inspector UI | Solver math |
| **storage** | Persist recipe JSON + provenance | Grammar |
| **catalogs/templates** | Seed recipes + **grammar JSON** | UI |

`template-engine` depends on `@take/core` + `@take/device-catalog` (consume sizes/insets only).

Paint stays in the web app: engine returns **numbers**; web draws. Unit tests never need DOM.

---

## File architecture (planned)

Ceiling **≤400 lines / file**. Split by ownership, not by “utils.ts”.

### `packages/template-engine/src/`

```
index.ts                      # public API only
types/
  recipe.ts                   # TemplateRecord (composition, spine, family, layers)
  layers.ts                   # BackgroundLayer, DeviceInstance, TypeSlot
  generator.ts                # GenerateInput, LayoutProvenance
grammar/
  load-grammar.ts             # read catalogs/templates/{ver}/grammar
  tokens.ts                   # TS types for tokens
  productions.ts              # set-plan weights
rng/
  seed.ts                     # splitmix32 from string | number
constraints/
  aabb.ts                     # rect, rotate, slice clip
  bleed.ts                    # visibleFrac, boundary cross
  type-band.ts                # type vs inset
  validate-layout.ts          # AND of all rules
score/
  score-layout.ts
generate/
  set-plan.ts                 # step 1
  place-isolated.ts
  place-strip.ts
  generate-layout.ts          # K-resample orchestrator
apply/
  apply-template.ts
  fill-variables.ts
  map-shots.ts                # ordered 1:1 (F57)
variant.ts                    # refresh copy only (not geometry)
batch.ts                      # later: N × generateLayout
*.test.ts                     # seed determinism, bleed legality, fallback
```

### `catalogs/templates/` (data)

```
manifest.json                 # grammarVersion, seed ids
2026.08/
  grammar/
    tokens.json               # AABB + rotation ranges + weights
    productions.json          # set-plan probabilities
  seeds/
    isolated-story.json
    strip-bleed-hook.json
```

### `apps/web/src/` (thin)

```
modes/template/               # existing adapter/plugin/arm + generate call
editor/strip/
  strip-preview.ts            # joined rail (no gap)
  strip-world.ts              # map engine rects → CSS/canvas
stages/export/
  paint-strip-slice.ts        # clip world → PNG (shared with preview)
```

Do **not** put solver code in `start-app.ts` or `edit-canvas.ts`. Do **not** put shell SVG paths in the engine.

---

## Public API (engine)

```ts
generateLayout(input: GenerateInput): TemplateRecord
applyTemplate(recipe, brief, shots): ProjectSet
validateLayout(recipe, device): { ok: boolean; errors: string[] }
scoreLayout(recipe, device): number
refreshCopy(recipe, brief): TemplateRecord   // geometry unchanged
```

`GenerateInput` includes `seed?: string`. If omitted, engine creates one and writes it onto provenance.

---

## Tests that lock “it has to work”

| Test | Assert |
|------|--------|
| Fixed seed | Two `generateLayout` calls identical |
| `bleed-next` | Device ∩ slice i and i+1 both ≥ 0.28 visibleFrac |
| Illegal jitter | `validateLayout` fails; orchestrator does not return it |
| All-K fail | Fallback `isolated` + `center`, `provenance.fallback === true` |
| Shot map | Frame i uses shot i (no `%`) |
| Grammar bump | v2 tokens load; v1 recipes still validate |

Script: `npm run test:templates`

---

## What this is not

| Claim | Truth |
|-------|-------|
| Infinite unique art | Finite tokens × jitter × seed; huge space, not infinite illustration |
| Creative AI | No LLM in this phase |
| Drag-drop editor | Presets + solver; F46 stays parked |
| Uncopyable forever | Moat is grammar version + solver + scan-bound shots; keep evolving tokens |
