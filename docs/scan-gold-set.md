# Scan gold-set (smoke)

Run automated suite with `scan-api` up:

```bash
npm run test:gold
```

(`test:merge` + `test:gold-client` + `test:smoke`)

| # | URL / action | Expect | Status (2026-08-14) |
|---|--------------|--------|---------------------|
| 1 | `https://apps.apple.com/us/app/whatsapp-messenger/id310633997` | LIVE name + icon + screens | **PASS** — WhatsApp Messenger, 6 assets |
| 2 | WhatsApp + `http://127.0.0.1/evil` pack secondary | Primary OK; secondary soft-fail | **PASS** — src0ok=false |
| 3 | WhatsApp icon → `/palette` | ≥1 swatch | **PASS** — 4 swatches |
| 4 | Play: `https://play.google.com/store/apps/details?id=com.whatsapp` | LIVE or PARTIAL + upload CTA if blocked | **PASS** — LIVE WhatsApp Messenger (F07 still WATCH) |
| 5 | Marketing: `https://www.whatsapp.com/` | OG title/desc | **PASS** — og-meta title present |
| 6 | Uploads only (no URL) | Receipt assets from uploads; Generate works | **PASS (logic)** — data-URL upload asset shape in `gold-client.test.ts`; **UI still confirm in browser** |
| 7 | Refresh after Scan | Session restored from localStorage | **PASS (logic)** — `selectedShotIds` hydrate filter; **UI still confirm in browser** |
| 8 | Edit `#f-name` then re-scan | Field stamped `user`, survives merge | **PASS (logic)** — `mergeCapture` in `gold-client.test.ts`; **UI still confirm in browser** |

## Browser checklist (rows 6–8 UI)

With `npm run dev` open `http://localhost:8765`:

1. **#6** — Clear URL, upload 1–2 screenshots → Scan → receipt shows upload assets → Generate → frames appear.
2. **#7** — After a live Apple scan, refresh → receipt + Extra Sources restore; shot selection preserved if toggled.
3. **#8** — After scan, change Name in Advanced → blur → Scan again → receipt Name badge **USER** (not store overwrite).

## Notes

- Play success can still flake if Google blocks scraper **and** HTML (F24 WATCH); gold-set accepts LIVE or PARTIAL for row 4. Warnings include `Play fetch path: scraper|html-fallback|cache|failed`.
- Narrative (F11): no invented commute/bedtime copy — listing heuristics + Advanced, else Missing.
- Advanced UX/tone/refs/donot/where/when feed frames + store copy.
- Motion (F16): Slideshow mode/preset → Export → ZIP + WebM/MP4 (manual).
