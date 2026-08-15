/** OWNER: packages/export-presets — iOS presets */
import type { ExportPreset } from "./preset.types";

export const iosPresets: ExportPreset[] = [
  { id: "ios-screens", label: "iOS App Store screenshots", sizes: "1290×2796", destination: "App Store", defaultOn: true },
  { id: "ios-feature", label: "iOS feature graphic", sizes: "1024×1024", destination: "App Store", defaultOn: true },
];
