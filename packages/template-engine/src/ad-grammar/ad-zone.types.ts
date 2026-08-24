/** OWNER: packages/template-engine/ad-grammar — ad wireframe zone types (NOT phone placements) */

/** Mirrors packages/ad-unit-catalog AdUnitFamily as a plain string union — kept decoupled, same
 *  loose-coupling convention as TemplateRecord.deviceId (a string, not an imported enum). */
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

export type AdZoneKind =
  | "image"
  | "logo"
  | "headline"
  | "body"
  | "cta"
  | "legal"
  | "badge"
  /** Solid contrasting card background behind other zones — not text content itself. */
  | "panel";

/** Fractions of the ad unit's own W×H (0..1) — same convention as device screenInset, scaled to unit space. */
export type AdZone = {
  kind: AdZoneKind;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type AdWireframe = {
  id: string;
  name: string;
  family: AdUnitFamily;
  zones: AdZone[];
  /** Structure only, derived from documented layout conventions — never traced from a real ad. */
  source: "generated";
};
