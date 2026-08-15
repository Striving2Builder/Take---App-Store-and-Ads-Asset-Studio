# Real App Scan — Phase 2 review

**Scope:** Google Play first, then (1) Play adapter, (2) Multi-URL pack, (3) Locale switcher, (4) Palette extraction.  
**Mode:** Product + technical review only (no implementation in this pass).

---

## Phase intent

Move from **iOS + thin web parity** to **cross-store operational Scan**, then layer session power (multi-URL, locale) and creative fuel (palette).

| Order | Item | Role |
|-------|------|------|
| 0 / 1 | Google Play + Play adapter | Close the biggest parity hole |
| 2 | Multi-URL pack | Store + site + competitor in one scan session |
| 3 | Locale switcher | Correct storefront/language capture |
| 4 | Palette extraction | Brand direction from real assets |

**Dependency note:** (4) gets much better after Play (and iOS) actually fill the asset bin. (2) and (3) can parallelize after Play lands, but locale should be designed into the Play adapter API from day one so you don’t retrofit country/`hl` later.

---

## 0–1. Google Play + Play adapter

### What “done” means
Paste a Play URL (`play.google.com/store/apps/details?id=…`) → **Scan receipt** with Captured name, short/full description (as available), developer, category, icon, screenshots, package id, locale — same provenance rules as Apple. Failures stay honest.

### Methodology options (best → riskier)

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **A. Maintained metadata API / library** (e.g. community Play scraper service you host, or licensed ASO feed) | Faster, structured | Dependency, ToS/gray area, breakage | Good for MVP if self-hosted and cached |
| **B. Server headless (Playwright) → parse DOM** | Works when Google serves JS | Costly, brittle selectors, bot detection | Acceptable fallback |
| **C. Raw HTTP + HTML regex** | Cheap | Breaks often; Google heavily dynamic | Too weak as primary |
| **D. Licensed ASO (Sensor Tower, etc.)** | Deep, stable-ish | Cost, contracts, overkill for Scan-only | Later / enterprise |

**Recommended:** **B as primary for v1** (controlled headless on server), with **strict cache TTL**, screenshot/icon URL extraction, and a **fixture regression set**. Keep package id from URL as Captured even when the rest fails (you already do this).

### Capture field map (Play ↔ schema)

| Our field | Play source (typical) | Notes |
|-----------|------------------------|-------|
| name | App title | P0 |
| subtitle | Short description | P0 — Play has this; Apple often doesn’t |
| description | Full description | P0 |
| category | Genre / category | P0 |
| developer | Developer name | P1 |
| bundleId | `id=` package | P0 (already) |
| rating / ratingCount | Rating cluster | P1 |
| icon | Itemprop / img | P0 |
| screenshots | Gallery images | P0 |
| storeUrl | Canonical listing | P0 |

### UX
- Auto-detect `android` chip on paste (you already route by host).
- Receipt status: `LIVE` / `PARTIAL` / `FAILED` same as iOS.
- If Google blocks: clear CTA — “Play blocked — upload screenshots or paste marketing URL.”
- Truth badge: move Play from FAKE → PARTIAL/REAL only when live path is green on the gold set.

### Risks
- ToS / scraping policy — document “personal/local-first capture,” rate-limit, cache, no resale of raw Play HTML.
- Bot detection / region variance.
- Screenshot URLs may be size-variant; normalize to largest reasonable.
- Don’t invent short description if missing — leave Missing (same rule as Apple subtitle).

### Enhancements while building Play
- Accept `hl` + `gl` query params (ties to locale switcher).
- Pull feature graphic if present (optional asset kind you already have: `feature`).
- Data safety section → later trust copy (optional P2).

---

## 2. Multi-URL pack

### What “done” means
One Scan session accepts **primary + optional secondary URLs** (e.g. App Store, marketing site, competitor). One merged **session capture** with per-source receipts, not three disconnected pastes.

### UX sketch
```
Primary URL     [ App Store / Play / Site ]
+ Add source    [ Marketing site ]
+ Add source    [ Competitor ]  (structure/compare only)
[ Scan all ]
```
Receipt becomes tabbed or stacked: **Primary · Site · Competitor**, each with own adapter + provenance. Generate uses **primary** for name/description/assets; site fills gaps (OG) without overwriting Captured primary; competitor never writes into brand fields — only a “compare” panel.

### Merge rules (lock these)
1. Primary Captured wins over secondary Captured for the same field.  
2. Secondary may fill **Missing** only.  
3. Never promote competitor assets into the export asset bin by default (reference lane).  
4. Re-scan per source independently.  
5. User edits still never clobbered (`provenance === user`).

### Methodology
- Parallel `Promise.all` per URL through existing orchestrator.  
- Cap sources (e.g. max 3) for cost/latency.  
- Shared SSRF allowlist.  
- Session object: `ScanPack { primary, sources[], mergedBrief, warnings[] }`.

### Opportunities
- “Use site OG subtitle when store subtitle Missing” (huge for Apple).  
- Competitor screenshot count / category for positioning hints (Inferred only).  
- Later: side-by-side storyboard vs competitor (Replicator input).

### Risks
- UX overload — keep advanced collapsed; default remains single URL.  
- Latency — show per-source progress.  
- Legal — competitor lane labeled “reference only.”

---

## 3. Locale switcher on Scan

### What “done” means
Before/during Scan, user picks **storefront/language** (e.g. `US / en`, `MX / es`, `JP / ja`). Capture and asset URLs reflect that locale. Receipt shows `locale` as Captured from the switcher + adapter echo.

### UX
- Compact control beside Scan: `Locale [en-US ▾]` (country + language, or preset list).  
- Persist last choice in localStorage.  
- Auto-suggest from URL path when present (`/us/`, `/jp/`, `?hl=es&gl=US`).  
- Mismatch warning: “URL says `/jp/` but switcher is `en-US` — which wins?” → **Switcher wins** (explicit user intent), rewrite fetch params.

### Methodology
| Source | How locale applies |
|--------|--------------------|
| Apple Lookup | `country=` from region; language is mostly storefront-driven |
| Play | `hl` + `gl` on listing URL |
| Web OG | `Accept-Language` header; optional `hreflang` discovery later |

### Schema
- Keep `fields.locale` Captured from switcher.  
- Add optional `storefront` / `language` if you need to split later.  
- Cache key: `url + locale + adapterVersion`.

### Opportunities
- Multi-locale batch later (“scan en-US + es-MX”) — out of scope for this phase, but design cache keys so batch doesn’t rewrite the model.  
- Locale-specific screenshot sets (Apple/Play often differ).

### Risks
- Users confuse device language with storefront. Microcopy: “Store country / language for listing text & screenshots.”  
- Incomplete translations → PARTIAL receipt, not silent English fallback without a warning.

---

## 4. Palette extraction from icon / screens

### What “done” means
After a successful Scan with assets, extract **5–6 dominant colors** from icon (+ optional first 1–3 screenshots). Show in receipt / Style panel as **Captured palette** (not preset). User can lock a brand color. Generator/editor chrome for the *project* uses locked brand; do **not** globally recolor the whole TAKE app chrome (fix the yellow bleed).

### Methodology
| Approach | Pros | Cons |
|----------|------|------|
| Client-side canvas quantize (e.g. simple median cut / vibrant-style) | Local-first, free, private | Need CORS-friendly image access |
| Server sharp / node palette | Consistent | Extra dependency; must fetch images server-side |
| Sample icon only first | Fast, usually enough for brand | Misses UI accent from screens |

**Recommended v1:**  
1. Prefer **icon**.  
2. Optionally blend top screenshot colors with lower weight.  
3. Return `{ hex, role?: primary|accent|neutral, source: assetId }[]` with provenance **captured**.  
4. If images are CORS-blocked in browser, extract on **scan-api** when fetching/caching assets (more reliable).

### UX
- Receipt section: **PALETTE** swatches under asset bin.  
- Style inspector: “From scan” vs “Presets.”  
- Lock = user provenance.  
- Truth: PARTIAL until wired into frame backgrounds; REAL for extraction itself once stable.

### Opportunities
- Contrast check for headline on extracted background.  
- Dark/light mode suggestion from luminance.  
- Per-frame palette variants later (story sequence mood).

### Risks
- Store screenshots already include device chrome / marketing gradients — bias toward icon.  
- Hot-pink outlier from a single UI pixel — trim extremes / require min population.  
- Don’t overwrite user-locked brand on re-scan.

---

## Suggested build sequence (within this phase)

```
1. Play adapter (+ hl/gl hooks for locale)
2. Locale switcher UI (wires Apple country + Play hl/gl + Accept-Language)
3. Multi-URL pack (merge rules + parallel scan)
4. Palette extraction (icon-first, server-assisted if CORS)
```

**Why this order:** Play is the parity gate. Locale must be in the Play fetch contract early. Multi-URL benefits from stable single-URL adapters. Palette needs reliable assets from iOS *and* Play.

---

## What we are still not covering in this phase (intentionally)

- Wiring captured screenshots into the phone mock / export (creative pipeline)  
- ASO keywords / rankings / reviews  
- Headless for arbitrary SPAs beyond Play  
- Competitor brand-safe Replicator  
- Production PNG render  

Call those **Phase 3** unless you want screenshots-into-canvas pulled forward (high product value; can sandwich after Play).

---

## Review checklist before coding

- [ ] Play gold set: 15–20 package IDs across categories/regions  
- [ ] Legal note in README: local-first capture, rate limits, no redistribution of raw store HTML  
- [ ] Cache TTL decision (e.g. 24h listings, 7d icons)  
- [ ] Merge rules for multi-URL written into `capture.schema` comments  
- [ ] Locale list v1 (10–15 presets, not every country)  
- [ ] Palette: icon-only MVP acceptance criteria  

---

## Bottom line

Your proposed order is right, with one refinement: **treat locale as a design constraint on the Play adapter**, even if the switcher UI ships immediately after Play. Multi-URL and palette are the enhancement layer that turns Scan from “parity capture” into “session intelligence + brand fuel.”

When you say **proceed**, implement in the sequence above unless you want **screenshots-into-editor** inserted after Play.

---

## Implementation plan

Full file/architecture mapping, work packages (WP0–WP4), schema growth rules, and Phase 3 hooks:

→ **[scan-phase-2-implementation-plan.md](./scan-phase-2-implementation-plan.md)**
