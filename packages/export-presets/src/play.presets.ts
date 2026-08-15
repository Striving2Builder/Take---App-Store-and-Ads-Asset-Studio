/** OWNER: packages/export-presets — Play presets */
import type { ExportPreset } from "./preset.types";

export const playPresets: ExportPreset[] = [
  { id: "play-screens", label: "Google Play screenshots", sizes: "1080×1920", destination: "Google Play", defaultOn: true },
  { id: "play-feature", label: "Play feature graphic", sizes: "1024×500", destination: "Google Play" },
];
