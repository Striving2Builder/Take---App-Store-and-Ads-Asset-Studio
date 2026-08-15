/** OWNER: packages/export-presets — iOS presets */
import type { ExportPreset } from "./preset.types";

export const iosPresets: ExportPreset[] = [
  {
    id: "ios-screens",
    label: "iOS App Store screenshots",
    sizes: "from device catalog",
    destination: "App Store",
    defaultOn: true,
    kind: "store",
    targets: [],
  },
  {
    id: "ios-feature",
    label: "iOS feature graphic",
    sizes: "1024×1024",
    destination: "App Store",
    defaultOn: true,
    kind: "sized",
    emit: "hero",
    folder: "feature",
    targets: [{ id: "ios-1024", w: 1024, h: 1024, fit: "contain" }],
  },
];
