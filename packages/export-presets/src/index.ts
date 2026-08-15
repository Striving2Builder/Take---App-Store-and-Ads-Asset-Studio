/** OWNER: packages/export-presets — public API */
export type { EmitPolicy, ExportFit, ExportPreset, ExportTarget, PresetKind } from "./preset.types";
export { iosPresets } from "./ios.presets";
export { playPresets } from "./play.presets";
export { socialPresets } from "./social.presets";
export { iabPresets } from "./iab.presets";
export { fitRect, type FitRect } from "./fit-rect";
export {
  planExportFiles,
  planMatchesTargets,
  sizedPresetsHaveTargets,
  type ExportPlan,
  type PlanExportInput,
  type PlannedExportFile,
  type StorePlatform,
} from "./plan-export";
export { defaultPresetIds, resolvePresetIds } from "./resolve-ids";

import { iosPresets } from "./ios.presets";
import { playPresets } from "./play.presets";
import { socialPresets } from "./social.presets";
import { iabPresets } from "./iab.presets";
import type { ExportTarget } from "./preset.types";

export function allPresets() {
  return [...iosPresets, ...playPresets, ...socialPresets, ...iabPresets];
}

/** Cover (or first) target for a stretch motion file — TikTok 1080×1920. */
export function motionStretchTarget(presetId = "tiktok"): ExportTarget | null {
  const p = allPresets().find((x) => x.id === presetId);
  if (!p?.targets.length) return null;
  return p.targets.find((t) => t.fit === "cover") || p.targets[0];
}

