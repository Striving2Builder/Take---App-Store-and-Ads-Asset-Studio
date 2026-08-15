/** OWNER: packages/export-presets — IAB + packs */
import type { ExportPreset } from "./preset.types";

export const iabPresets: ExportPreset[] = [
  { id: "iab", label: "IAB display units", sizes: "300×250 · 728×90 · 160×600", destination: "Ads" },
  { id: "slideshow", label: "Slideshow / promo video", sizes: "MP4 · 15s", destination: "Motion" },
  { id: "layered", label: "Layered editable pack", sizes: "JSON + PNG layers", destination: "Local" },
  { id: "bundle", label: "Full project bundle", sizes: "Local ZIP manifest", destination: "Local" },
];
