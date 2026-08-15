/** OWNER: packages/export-presets — public API */
export type { ExportPreset } from "./preset.types";
export { iosPresets } from "./ios.presets";
export { playPresets } from "./play.presets";
export { socialPresets } from "./social.presets";
export { iabPresets } from "./iab.presets";

import { iosPresets } from "./ios.presets";
import { playPresets } from "./play.presets";
import { socialPresets } from "./social.presets";
import { iabPresets } from "./iab.presets";

export function allPresets() {
  return [...iosPresets, ...playPresets, ...socialPresets, ...iabPresets];
}
