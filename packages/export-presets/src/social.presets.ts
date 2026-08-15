/** OWNER: packages/export-presets — social presets */
import type { ExportPreset } from "./preset.types";

export const socialPresets: ExportPreset[] = [
  {
    id: "ig",
    label: "Instagram feed / stories",
    sizes: "1080×1350 · 1080×1920",
    destination: "Instagram",
    kind: "sized",
    emit: "per-frame",
    folder: "social",
    targets: [
      { id: "ig-feed", w: 1080, h: 1350, fit: "contain" },
      { id: "ig-story", w: 1080, h: 1920, fit: "cover" },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok / Reels / Shorts",
    sizes: "1080×1920",
    destination: "TikTok",
    kind: "sized",
    emit: "per-frame",
    folder: "social",
    targets: [{ id: "tiktok-9x16", w: 1080, h: 1920, fit: "cover" }],
  },
  {
    id: "yt",
    label: "YouTube thumb",
    sizes: "1280×720",
    destination: "YouTube",
    kind: "sized",
    emit: "hero",
    folder: "social",
    targets: [{ id: "yt-thumb", w: 1280, h: 720, fit: "contain" }],
  },
  {
    id: "pin",
    label: "Pinterest",
    sizes: "1000×1500",
    destination: "Pinterest",
    kind: "sized",
    emit: "per-frame",
    folder: "social",
    targets: [{ id: "pin-2x3", w: 1000, h: 1500, fit: "contain" }],
  },
];
