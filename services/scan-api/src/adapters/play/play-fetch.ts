/**
 * OWNER: services/scan-api/adapters/play — fetch listing via google-play-scraper
 * Retries with backoff; caller may fall back to HTML when exhausted.
 */
import gplay from "google-play-scraper";

export type PlayRawListing = {
  appId: string;
  title?: string;
  summary?: string;
  description?: string;
  developer?: string;
  genre?: string;
  icon?: string;
  headerImage?: string;
  screenshots?: string[];
  score?: number;
  ratings?: number;
  url?: string;
  /** Which fetch path produced this listing */
  fetchPath?: "scraper" | "html-fallback" | "cache";
};

const BACKOFF_MS = [400, 1200, 2500];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/not found|404|invalid|ENOENT/i.test(msg)) return false;
  return true;
}

export async function fetchPlayListing(input: {
  appId: string;
  language: string;
  country: string;
}): Promise<PlayRawListing> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
    try {
      const data = await gplay.app({
        appId: input.appId,
        lang: input.language,
        country: input.country,
      });
      return {
        appId: data.appId || input.appId,
        title: data.title,
        summary: data.summary,
        description: data.description,
        developer: data.developer,
        genre: data.genre,
        icon: data.icon,
        headerImage: data.headerImage,
        screenshots: data.screenshots || [],
        score: data.score,
        ratings: data.ratings,
        url: data.url,
        fetchPath: "scraper",
      };
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === BACKOFF_MS.length - 1) break;
      await sleep(BACKOFF_MS[attempt]);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Play scraper failed");
}
