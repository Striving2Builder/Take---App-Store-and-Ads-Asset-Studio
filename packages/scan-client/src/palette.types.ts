/** OWNER: packages/scan-client — captured palette types (from icon/screens) */
export type PaletteSwatch = {
  hex: string;
  /** Population weight 0–1 */
  weight: number;
  role?: "primary" | "accent" | "neutral" | string;
  sourceAssetId?: string;
};

export type CapturedPalette = {
  swatches: PaletteSwatch[];
  provenance: "captured" | "user";
  source: string;
  extractedAt: string;
  /** Per-image extract failures (WebP, blocked, etc.) */
  warnings?: string[];
};
