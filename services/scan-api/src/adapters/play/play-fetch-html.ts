/**
 * OWNER: services/scan-api/adapters/play — HTML fallback when scraper fails
 * Best-effort parse of Play Store page meta + common JSON blobs.
 */
import { fetchSafe } from "../../security/allowlist";
import type { PlayRawListing } from "./play-fetch";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function metaContent(html: string, prop: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
    "i"
  );
  return html.match(re)?.[1] || html.match(re2)?.[1];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractScreenshots(html: string): string[] {
  const urls = new Set<string>();
  const re = /https:\/\/play-lh\.googleusercontent\.com\/[^"'\\\s>]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && urls.size < 12) {
    const u = m[0].replace(/=.*/, "=w512");
    if (!/favicon|icon/i.test(u)) urls.add(u);
  }
  return [...urls];
}

function extractIcon(html: string): string | undefined {
  const og = metaContent(html, "og:image");
  if (og) return decodeEntities(og);
  const m = html.match(/https:\/\/play-lh\.googleusercontent\.com\/[^"'\\\s>]+=w[0-9]+/);
  return m?.[0];
}

/** Fetch Play listing HTML and map to PlayRawListing. Throws on hard failure. */
export async function fetchPlayListingHtml(input: {
  url: string;
  appId: string;
}): Promise<PlayRawListing> {
  const res = await fetchSafe(input.url, {
    headers: {
      "user-agent": UA,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`Play HTML fetch ${res.status}`);
  const html = await res.text();
  if (html.length < 500) throw new Error("Play HTML too short");

  const title =
    metaContent(html, "og:title") ||
    html.match(/<h1[^>]*itemprop=["']name["'][^>]*>([^<]+)</i)?.[1] ||
    html.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/\s*-\s*Apps on Google Play.*/i, "");
  const description =
    metaContent(html, "og:description") || metaContent(html, "description");
  const icon = extractIcon(html);
  const screenshots = extractScreenshots(html).filter((u) => u !== icon);

  if (!title && !description && !icon) {
    throw new Error("Play HTML parse found no listing fields");
  }

  return {
    appId: input.appId,
    title: title ? decodeEntities(title) : undefined,
    summary: description ? decodeEntities(description).slice(0, 160) : undefined,
    description: description ? decodeEntities(description) : undefined,
    icon,
    screenshots,
    url: input.url,
    fetchPath: "html-fallback",
  };
}
