/** OWNER: packages/export-presets — Play presets */
import type { ExportPreset } from "./preset.types";

export const playPresets: ExportPreset[] = [
  {
    id: "play-screens",
    label: "Google Play screenshots",
    sizes: "from device catalog",
    destination: "Google Play",
    defaultOn: true,
    kind: "store",
    targets: [],
  },
  {
    id: "play-feature",
    label: "Play feature graphic",
    sizes: "1024×500",
    destination: "Google Play",
    kind: "sized",
    emit: "hero",
    folder: "feature",
    targets: [{ id: "play-1024x500", w: 1024, h: 500, fit: "contain" }],
  },
];
