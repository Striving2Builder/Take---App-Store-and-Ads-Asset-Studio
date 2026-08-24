/** OWNER: packages/ad-unit-catalog — IAB + named-platform ad unit specs (NOT device-catalog, NOT export-presets) */

/** The shape family that actually drives composition — not the exact pixel count.
 *  Meta's own consolidation of Reels+Stories into one safe zone is the precedent: layout is
 *  aspect-driven, not platform-driven. Platform identity + duration/file limits live on the
 *  AdUnit instead (see below) — several units can share one family. */
export type AdUnitFamily =
  | "leaderboard"
  | "billboard"
  | "mpu"
  | "skyscraper"
  | "mobile-banner"
  | "interstitial"
  | "video-landscape"
  | "video-vertical"
  | "social-feed"
  | "pinterest";

export type AdUnitKind = "display" | "video" | "social";
export type AdUnitContext =
  | "desktop-web"
  | "mobile-web"
  | "mobile-app"
  | "video"
  | "social";
export type AdUnitStatus = "current" | "legacy";

export type PxSize = { w: number; h: number };

/** A closed range of milliseconds, e.g. TikTok in-feed's real 9–15s engagement sweet spot —
 *  distinct from the hard min/max the platform will even accept. */
export type MsRange = { min: number; max: number };

export type AdUnit = {
  id: string;
  label: string;
  family: AdUnitFamily;
  kind: AdUnitKind;
  context: AdUnitContext;
  exportPx: PxSize;
  /** Named destination this unit actually traffics to — "TikTok", "Instagram", "YouTube",
   *  "Pinterest" — or "Generic" for an IAB/VAST unit not tied to one platform's ad manager. */
  platform: string;
  /** Video/social-video only — hard floor the platform will accept. */
  minDurationMs?: number;
  /** Video/social-video only — hard ceiling the platform will accept. */
  maxDurationMs?: number;
  /** Video/social-video only — the engagement sweet spot, not the technical limit. */
  recommendedDurationMs?: MsRange;
  /** Video/social-video only — upload cap. */
  maxFileSizeBytes?: number;
  iabName?: string;
  status: AdUnitStatus;
  source: string;
  updatedAt: string;
  version: string;
};

export type ListAdUnitsOpts = {
  family?: AdUnitFamily;
  kind?: AdUnitKind;
  includeLegacy?: boolean;
};
