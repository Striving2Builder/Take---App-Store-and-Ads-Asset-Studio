/** OWNER: packages/export-presets — IAB + packs */
import type { ExportPreset } from "./preset.types";

export const iabPresets: ExportPreset[] = [
  {
    id: "iab",
    label: "IAB display units",
    sizes: "300×250 · 728×90 · 160×600",
    destination: "Ads",
    kind: "sized",
    emit: "hero",
    folder: "iab",
    targets: [
      { id: "mpu", w: 300, h: 250, fit: "contain" },
      { id: "leaderboard", w: 728, h: 90, fit: "contain" },
      { id: "skyscraper", w: 160, h: 600, fit: "contain" },
    ],
  },
  {
    id: "slideshow",
    label: "Slideshow / promo video",
    sizes: "MP4 · 15s",
    destination: "Motion",
    kind: "motion",
    targets: [],
  },
];
