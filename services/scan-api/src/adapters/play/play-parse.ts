/**
 * OWNER: services/scan-api/adapters/play — validate/clean raw listing
 */
import type { PlayRawListing } from "./play-fetch";

export function parsePlayListing(raw: PlayRawListing): PlayRawListing {
  const screenshots = (raw.screenshots || [])
    .filter((u) => typeof u === "string" && /^https?:\/\//i.test(u))
    .slice(0, 12);

  return {
    ...raw,
    title: raw.title?.trim() || undefined,
    summary: raw.summary?.trim() || undefined,
    description: raw.description?.trim() || undefined,
    developer: raw.developer?.trim() || undefined,
    genre: raw.genre?.trim() || undefined,
    icon: raw.icon && /^https?:\/\//i.test(raw.icon) ? raw.icon : undefined,
    headerImage:
      raw.headerImage && /^https?:\/\//i.test(raw.headerImage)
        ? raw.headerImage
        : undefined,
    screenshots,
  };
}
