# Real App Scan — Product review

Expert review only (no code). Goal: make live store/site capture operational, honest, and product-grade — text, images, and later video.

**Working premise:** Today Scan is FAKE. This review defines what “operational” must mean before we build: capture contract, crawl method, UX truth, competitive bar, and media pipeline — not more theater.

Interactive version (if Canvas opens): `canvases/real-app-scan-product-review.canvas.tsx`  
This markdown is the reliable copy in-repo.

---

## 1. Scope

**Job:** URL → trusted brief the rest of TAKE can consume.

| In scope | Out of scope (for this feature) |
|----------|----------------------------------|
| Resolve App Store / Play / marketing / competitor URLs | Device Sync (phone shells catalog) |
| Extract listing + page metadata, assets, structured fields | Final PNG/MP4 render worker |
| Normalize into a Captured brief | Replicator wireframe tracing |
| Show confidence, gaps, failures honestly | Pretending crawl succeeded when it did not |

**Operational success:** Paste a real store/site URL → see **Captured vs Inferred** clearly → icon/screenshots in an asset bin → Generate never claims “scanned” on empty capture → store metadata can start from captured copy.

---

## 2. Methodology (how to crawl)

**Doctrine:** Prefer official APIs + structured metadata over brittle HTML. Scrape only server-side, allowlisted, cached, with graceful failure.

| Source | Best method | Fallback | Notes |
|--------|-------------|----------|-------|
| iOS App Store | iTunes Search / Lookup API | Store HTML (fragile) | Official JSON: name, desc, screenshots, art, genres, ratings |
| Google Play | Metadata provider or careful headless+parser | Unofficial scrapers | No Apple-like public API — higher risk |
| Marketing site | HTML → OG / Twitter / JSON-LD | H1 + hero image heuristics | Don’t run page JS in client |
| Competitor URL | Same adapters + compare schema | Manual screenshot upload | Structure only — no brand theft |
| Heavy SPAs | Optional Playwright after render | Ask user for key URLs | Costly; gate as hard mode |

**Do:** server-only, one Capture schema, cache by URL+locale, provenance, rate limits.  
**Don’t:** browser scrape, silent overwrite of user edits, “AI read the page” without field mapping, hide failed captures.

**Capability multipliers:** multi-URL pack, locale matrix, screenshot ingest, palette from icon/shots, change detection, optional ASO signals, category graph, privacy/data-safety skim.

---

## 3. Capture model — what we capture / gaps / other sources

### Must-have fields (P0)
Name, subtitle/short pitch, full description, icon, screenshots, category, locale/language.

### P1
Developer, ratings, price/IAP signal, What’s New, privacy/data safety, feature graphic.

### Gaps today
No live fetch · no Captured/Inferred UI · no remote asset bin · no locale storefront control · no failure taxonomy · no re-scan merge policy · competitor URL unused · no ToS/allowlist policy locked.

### Other sources worth including
Feature graphics · privacy labels · version notes · support/marketing domain from listing · social links · licensed ASO intel (paid) · user uploads when stores block · brand kit zip/Figma later.

---

## 4. UX / Design

**Law:** Never show confident “we understood your app” without a visible **capture receipt**. Truth badges stay until live scan ships.

### Target flow
1. Paste URL → auto-detect iOS / Play / Web  
2. Scan → progress by source (API → assets → normalize)  
3. Receipt → captured fields + asset thumbnails + timestamps  
4. Gaps → only ask what’s missing  
5. Optional “Fill gaps” → explicitly **Inferred**  
6. User locks brief → Generate (no silent mutation after)

### Keep from current UI
Primary URL field · advanced collapsed · missing-box · truth badges · platform/qty side controls.

### Change
Scan toast → receipt panel · kill crawl-looking theater · remote screenshots selectable · separate Scan from Generate · competitor as second scan lane.

### Microcopy
Captured: “From App Store · 14:02” · Inferred: “Guessed — edit me” · Failed: “Couldn’t read listing — upload or retry.” Never “Reading signal…” with no fetch.

---

## 5. Competitive review

| Type | Examples (illustrative) | Strong at | Vs TAKE ambition |
|------|-------------------------|-----------|------------------|
| ASO / store intel | AppFollow, Sensor Tower, data.ai | Metadata, keywords, comps | Not creative studios |
| Screenshot / listing makers | StoreMaven, Screenshots.pro, etc. | Templates, frames, export | Often weak live URL→brief |
| Creative automation | Abyssale, Bannerbear, Creatomate | API fill, batch | Not store narrative sequencing |
| Design suites | Figma, Canva | Craft | Manual; no crawl brain |
| AI site readers | LLM browse / crawl tools | Flexible summary | Weak compliance + asset hygiene |

**Parity:** pull name/desc/icon/screens from store URL · preview assets · edit after capture · device frames · store-sized export path.

**TAKE can be better:** linked 5–12 story sequences · Captured vs Inferred honesty · multi-mode studio · local-first · competitor structure without brand theft.

**They’re better today:** live data reliability, ASO depth, template polish, production PNG, Play resilience. Don’t pretend otherwise until Scan + render ship.

---

## 6. Text / Images / Video

| Media | Capture | Use in TAKE | Watch-outs |
|-------|---------|-------------|------------|
| **Text** | Titles, descriptions, site H1/OG, later review themes | Store metadata + frame copy | Limits, locale, over-claim |
| **Images** | Icon, screenshots, feature art, OG image | Shells, palette, sequence content | Double-framing; copyright on comps |
| **Video** | App Preview / promo URLs | Poster frames, pacing for Slideshow | Phase after image pipeline |

**Rule:** Scan captures/organizes media. Modes + render create new media. Downloaded ≠ store-compliant generated asset.

---

## 7. What else to review (expert add-ons)

You asked methodology, UX, competitive, media. I would also put these on the table before calling Scan operational:

| Lens | Core question |
|------|----------------|
| Trust & provenance | Source URL, adapter, time, confidence per field? |
| Legal / ToS / robots | Apple/Google ToS, cache rights, competitor asset policy? |
| Security | SSRF, allowlist, sanitization, max download, image malware? |
| Reliability | Timeouts, region blocks, SPA empties, rate limits — UX each? |
| Data model / versioning | Schema version, re-scan merge, preserve user edits? |
| Caching & cost | TTL, when to pay for headless, LLM only on gaps? |
| Locale / i18n | Storefront + language matrix? |
| Quality eval | Gold set of ~50 URLs; fill-rate + hallucination metrics? |
| Privacy | Store raw HTML? PII? Local-first retention? |
| Observability | Adapter success rate, parse errors, cache hits? |
| Human-in-the-loop | When must user confirm before Generate? |
| Downstream contract | Exact JSON Wizard/Template require from Scan? |

**Eval harness:** 20 iOS + 20 Play + 20 sites (incl. SPAs) + 10 competitors. Gate releases on scorecard, not demos.

---

## 8. Recommended decision order

1. **Capture schema + Captured/Inferred rules**  
2. **iOS Lookup + marketing OG (P0 adapters)**  
3. **Scan receipt UX** (replace theater)  
4. **Remote asset bin** (icon + screenshots)  
5. **Play adapter + failure UX**  
6. **Competitor compare + optional headless**

---

## Bottom line

Real App Scan is the **trust core** of TAKE: multi-adapter capture, honest receipt UX, media asset bin, competitive parity with store-intel + screenshot tools — differentiated by story sequencing and provenance. Modes, render, and device sync should **consume** this contract, not reinvent it.
