# TAKE

App Store / Play marketing asset studio.

- [docs/architecture.md](docs/architecture.md) — pillars & layers
- [docs/file-map.md](docs/file-map.md) — granular file ownership (≤300–400 lines)
- [docs/real-app-scan-product-review.md](docs/real-app-scan-product-review.md) — Scan product review

## Run (new structure)

```bash
npm install
npm run dev
```

Starts:
- Web UI — http://localhost:8765
- Scan API — http://localhost:8787 (proxied as `/api`)

### Try Real App Scan
1. Open studio → set **Locale** if needed
2. Paste App Store **or** Play URL (e.g. `https://play.google.com/store/apps/details?id=com.whatsapp`)
3. Click **Scan** → review **Scan receipt** (Captured vs Inferred + assets)
4. Click **Generate asset sets**

iOS Lookup, Google Play listing, and marketing OG are live via adapter registry. Multi-URL pack (`POST /scan/pack`) and palette extraction (`POST /palette`) are wired in the intake receipt + style inspector. Post-review: competitor compare-only, pack soft-fail per source, palette on `extensions`, project accent isolated from shell `--signal`.

**B+C path (2026-08):** scan session persists across refresh; uploads feed assets; canvas shows store shots; **Download PNG ZIP** exports real frames; Template/Replicator/Slideshow have distinct runs; projects save/open from Library. Remaining: MP4, NLP, IndexedDB backend swap (`SCAN_API_PUBLIC=1` for DNS+CORS harden).

## Layout

- `apps/web` — UI
- `packages/*` — domain libraries
- `catalogs/devices` — device specs (picker source)
- `services/*` — scan-api / device-sync / render stubs
- `_legacy` — previous 3-file shell (reference only)
