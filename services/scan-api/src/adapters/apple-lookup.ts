/**
 * OWNER: services/scan-api/adapters — Apple iTunes Lookup (live)
 */
import {
  type AppCapture,
  capturedField,
  missingField,
  extractAppleAppId,
  normalizeUrl,
} from "@take/scan-client";
import { assertSafeUrl, isAppleHost } from "../security/allowlist";

type ItunesResult = {
  trackId?: number;
  trackName?: string;
  trackCensoredName?: string;
  description?: string;
  primaryGenreName?: string;
  artistName?: string;
  bundleId?: string;
  artworkUrl512?: string;
  artworkUrl100?: string;
  screenshotUrls?: string[];
  ipadScreenshotUrls?: string[];
  averageUserRating?: number;
  userRatingCount?: number;
  trackViewUrl?: string;
};

export async function lookupAppleApp(inputUrl: string, locale = "en-US"): Promise<AppCapture> {
  const url = normalizeUrl(inputUrl);
  const parsed = assertSafeUrl(url);
  if (!isAppleHost(parsed.hostname)) {
    throw new Error("Not an App Store URL");
  }

  const appId = extractAppleAppId(url);
  const scannedAt = new Date().toISOString();
  const base: AppCapture = {
    schemaVersion: 1,
    scannedAt,
    inputUrl: url,
    detectedKind: "ios",
    adapter: "apple-lookup",
    ok: false,
    fields: {
      name: missingField(),
      subtitle: missingField(),
      description: missingField(),
      category: missingField(),
      developer: missingField(),
      locale: capturedField(locale, "apple-lookup"),
      bundleId: missingField(),
      rating: missingField(),
      ratingCount: missingField(),
      storeUrl: capturedField(url, "apple-lookup"),
    },
    assets: [],
    warnings: [],
    errors: [],
  };

  if (!appId) {
    base.errors.push("Could not extract App Store numeric id from URL (/id123…).");
    return base;
  }

  const country = locale.split("-")[1]?.toLowerCase() || "us";
  const endpoint = `https://itunes.apple.com/lookup?id=${encodeURIComponent(appId)}&country=${country}`;
  const res = await fetch(endpoint, {
    headers: { accept: "application/json", "user-agent": "TAKE-ScanApi/0.1" },
  });
  if (!res.ok) {
    base.errors.push(`Apple Lookup HTTP ${res.status}`);
    return base;
  }

  const data = (await res.json()) as { resultCount: number; results: ItunesResult[] };
  const app = data.results?.[0];
  if (!app) {
    base.errors.push("Apple Lookup returned no results for this id/country.");
    return base;
  }

  // iTunes Lookup does not expose the 30-char subtitle separately in all payloads;
  // first line of description is a weak stand-in — keep subtitle missing rather than invent.
  base.fields.name = capturedField(app.trackCensoredName || app.trackName || null, "apple-lookup");
  base.fields.description = capturedField(app.description || null, "apple-lookup");
  base.fields.category = capturedField(app.primaryGenreName || null, "apple-lookup");
  base.fields.developer = capturedField(app.artistName || null, "apple-lookup");
  base.fields.bundleId = capturedField(app.bundleId || null, "apple-lookup");
  base.fields.rating = capturedField(
    typeof app.averageUserRating === "number" ? app.averageUserRating : null,
    "apple-lookup"
  );
  base.fields.ratingCount = capturedField(
    typeof app.userRatingCount === "number" ? app.userRatingCount : null,
    "apple-lookup"
  );
  if (app.trackViewUrl) {
    base.fields.storeUrl = capturedField(app.trackViewUrl, "apple-lookup");
  }

  const icon = app.artworkUrl512 || app.artworkUrl100;
  if (icon) {
    base.assets.push({ id: "icon-0", kind: "icon", url: icon });
  }
  (app.screenshotUrls || []).forEach((u, i) => {
    base.assets.push({ id: `shot-${i}`, kind: "screenshot", url: u });
  });

  base.ok = Boolean(base.fields.name.value);
  if (!base.fields.subtitle.value) {
    base.warnings.push(
      "App Store subtitle not available via Lookup API — left Missing (not invented)."
    );
  }
  return base;
}
