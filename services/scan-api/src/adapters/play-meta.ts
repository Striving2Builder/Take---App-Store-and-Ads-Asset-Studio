/**
 * OWNER: services/scan-api/adapters — Play adapter facade (LIVE via scraper + HTML fallback)
 * Locale: uses language + country (hl/gl equivalents) from ScanAdapterInput.
 */
import {
  emptyCapture,
  extractPlayPackageId,
  normalizeUrl,
} from "@take/scan-client";
import { assertSafeUrl, isPlayHost } from "../security/allowlist";
import type { ScanAdapter, ScanAdapterInput } from "./adapter.types";
import { cacheGet, cacheKey, cacheSet } from "../cache/listing-cache";
import { fetchPlayListing } from "./play/play-fetch";
import { fetchPlayListingHtml } from "./play/play-fetch-html";
import { parsePlayListing } from "./play/play-parse";
import { normalizePlayListing } from "./play/play-normalize";

export async function fetchPlayMeta(input: ScanAdapterInput) {
  const url = normalizeUrl(input.url);
  const parsed = assertSafeUrl(url);

  const baseFail = emptyCapture({
    inputUrl: url,
    detectedKind: "android",
    adapter: "play-meta",
  });
  baseFail.fields.locale = {
    value: input.locale,
    provenance: "captured",
    source: "play-meta",
    confidence: 1,
  };
  const pkg = extractPlayPackageId(url);
  if (pkg) {
    baseFail.fields.bundleId = {
      value: pkg,
      provenance: "captured",
      source: "play-meta",
      confidence: 1,
    };
  }
  if (isPlayHost(parsed.hostname)) {
    baseFail.fields.storeUrl = {
      value: url,
      provenance: "captured",
      source: "play-meta",
      confidence: 1,
    };
  }

  if (!isPlayHost(parsed.hostname)) {
    baseFail.errors.push("Not a Google Play Store URL");
    return baseFail;
  }
  if (!pkg) {
    baseFail.errors.push("Could not extract package id from Play URL (?id=com.example.app).");
    return baseFail;
  }

  const key = cacheKey({ adapter: "play-meta", url: `${pkg}`, locale: input.locale });
  const cached = cacheGet(key);
  if (cached) {
    cached.warnings = [
      ...(cached.warnings || []).filter((w) => !w.includes("listing cache")),
      "Served from listing cache (24h TTL).",
      "Play fetch path: cache",
    ];
    return cached;
  }

  let scraperErr: string | null = null;
  try {
    const raw = await fetchPlayListing({
      appId: pkg,
      language: input.language,
      country: input.country,
    });
    const cleaned = parsePlayListing(raw);
    const capture = normalizePlayListing(cleaned, { ...input, url });
    capture.warnings = [...(capture.warnings || []), "Play fetch path: scraper"];
    if (capture.ok) cacheSet(key, capture);
    return capture;
  } catch (err) {
    scraperErr = err instanceof Error ? err.message : "unknown error";
  }

  try {
    const raw = await fetchPlayListingHtml({ url, appId: pkg });
    const cleaned = parsePlayListing(raw);
    const capture = normalizePlayListing(cleaned, { ...input, url });
    capture.warnings = [
      ...(capture.warnings || []),
      `Play scraper failed (${scraperErr}); used HTML fallback.`,
      "Play fetch path: html-fallback",
    ];
    if (capture.ok) cacheSet(key, capture);
    return capture;
  } catch (htmlErr) {
    baseFail.errors.push(
      `Play fetch failed: scraper=${scraperErr}; html=${htmlErr instanceof Error ? htmlErr.message : "error"}`
    );
    baseFail.warnings.push(
      "Upload screenshots or use a marketing URL if Google blocks automated capture.",
      "Play fetch path: failed"
    );
    return baseFail;
  }
}

export const playAdapter: ScanAdapter = {
  id: "play-meta",
  kinds: ["android"],
  scan: fetchPlayMeta,
};
