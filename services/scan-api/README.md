# Real App Scan API

Local service that fetches App Store / Play / web metadata. Browser calls it via Vite proxy `/api`.

## Run

```bash
npm run dev
# or
npm run dev:scan
# → http://localhost:8787
```

## Routes

- `GET /health` — includes registered adapters
- `POST /scan` `{ "url", "locale?", "language?", "country?" }` → `AppCapture`

## Adapters (registry)

| Kind | Adapter | Status |
|------|---------|--------|
| iOS App Store | `apple-lookup` | **Live** — iTunes Lookup API |
| Google Play | `play-meta` | **Live** — `google-play-scraper` (+ 24h cache); may fail under bot pressure |
| Marketing / web | `og-meta` | **Live** — OG / title / description |

New sources: implement `ScanAdapter`, `registerAdapter()` in `register-adapters.ts`. See `docs/adr/0001-scan-adapter-registry.md`.

## Locale

`locale` (e.g. `en-US`) expands to `language` + `country` for Play (`lang`/`country`) and Apple Lookup (`country=`).

## Security

- http/https only
- Private/localhost hosts blocked (SSRF)
- HTML truncated for OG; no JS execution in OG path
- Play uses a third-party listing library — local-first / rate-limited; do not redistribute raw store dumps

## Compliance note

Store capture is for building your own marketing assets. Respect Apple/Google terms; cache listings; don’t resell scraped HTML.
