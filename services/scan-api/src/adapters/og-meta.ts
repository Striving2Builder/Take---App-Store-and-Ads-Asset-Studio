/**
 * OWNER: services/scan-api/adapters — Open Graph / basic HTML meta (live)
 */
import {
  type AppCapture,
  capturedField,
  missingField,
  normalizeUrl,
} from "@take/scan-client";
import { assertSafeUrl, fetchSafe } from "../security/allowlist";

function metaContent(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i"
  );
  return html.match(re)?.[1] || html.match(re2)?.[1] || null;
}

function titleTag(html: string): string | null {
  return html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || null;
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function fetchOgMeta(inputUrl: string, locale = "en-US"): Promise<AppCapture> {
  const url = normalizeUrl(inputUrl);
  assertSafeUrl(url);
  const scannedAt = new Date().toISOString();

  const base: AppCapture = {
    schemaVersion: 1,
    scannedAt,
    inputUrl: url,
    detectedKind: "web",
    adapter: "og-meta",
    ok: false,
    fields: {
      name: missingField(),
      subtitle: missingField(),
      description: missingField(),
      category: missingField(),
      developer: missingField(),
      locale: capturedField(locale, "og-meta"),
      bundleId: missingField(),
      rating: missingField(),
      ratingCount: missingField(),
      storeUrl: capturedField(url, "og-meta"),
    },
    assets: [],
    warnings: [],
    errors: [],
  };

  const res = await fetchSafe(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "TAKE-ScanApi/0.3 (+local-dev; App marketing capture)",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    base.errors.push(`Page fetch HTTP ${res.status}`);
    return base;
  }

  const ctype = res.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml/i.test(ctype) && !ctype.includes("text/")) {
    base.warnings.push(`Unexpected content-type: ${ctype}`);
  }

  const html = (await res.text()).slice(0, 500_000);
  const ogTitle = metaContent(html, "og:title") || titleTag(html);
  const ogDesc =
    metaContent(html, "og:description") || metaContent(html, "description");
  const ogImage = metaContent(html, "og:image");
  const siteName = metaContent(html, "og:site_name");

  base.fields.name = capturedField(ogTitle ? decodeEntities(ogTitle) : null, "og-meta");
  base.fields.subtitle = capturedField(
    ogDesc ? decodeEntities(ogDesc).slice(0, 180) : null,
    "og-meta"
  );
  base.fields.description = capturedField(
    ogDesc ? decodeEntities(ogDesc) : null,
    "og-meta"
  );
  base.fields.developer = capturedField(
    siteName ? decodeEntities(siteName) : null,
    "og-meta"
  );

  if (ogImage) {
    const abs = (() => {
      try {
        return new URL(ogImage, url).toString();
      } catch {
        return ogImage;
      }
    })();
    base.assets.push({ id: "og-0", kind: "og_image", url: abs });
  }

  base.ok = Boolean(base.fields.name.value || base.fields.description.value);
  if (!base.ok) {
    base.errors.push("No og:title / title / description found on page.");
  } else {
    base.warnings.push(
      "Web capture is metadata-only (OG/title). Full page NLP not enabled."
    );
  }
  return base;
}
