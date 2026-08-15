/** OWNER: packages/export-presets — social presets */
import type { ExportPreset } from "./preset.types";

export const socialPresets: ExportPreset[] = [
  { id: "ig", label: "Instagram feed / stories", sizes: "1080×1350 · 1080×1920", destination: "Instagram" },
  { id: "tiktok", label: "TikTok / Reels / Shorts", sizes: "1080×1920", destination: "TikTok" },
  { id: "yt", label: "YouTube thumb", sizes: "1280×720", destination: "YouTube" },
  { id: "pin", label: "Pinterest", sizes: "1000×1500", destination: "Pinterest" },
];
