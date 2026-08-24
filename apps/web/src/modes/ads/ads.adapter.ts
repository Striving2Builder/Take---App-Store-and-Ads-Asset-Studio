/** OWNER: modes/ads — mode adapter (IAB display/video/social ad units) */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import { buildAdSets, DEFAULT_AD_UNIT_ID } from "./ads-builder";
import { adsInspectorPlugin, adsReviewPlugin } from "./ads.plugin";

export const adsMode: CreationMode = {
  id: "ads",
  label: "Ads",
  capabilities: {
    needsUrl: false,
    needsUploads: true,
    supportsStorySequence: false,
    supportsVideo: true,
    supportsTrace: false,
  },
  validateIntake(input) {
    const missing: string[] = [];
    if (!input.url && input.uploads === 0) {
      missing.push("Upload creative imagery, or scan a URL first, for Ads mode");
    }
    return missing;
  },
  async run(input, ctx) {
    const brief = ctx.priorBrief
      ? { ...ctx.priorBrief, mode: "ads" as const }
      : (await scanApp(input)).brief;
    const adUnitIds = ctx.adUnitIds?.length ? ctx.adUnitIds : [DEFAULT_AD_UNIT_ID];
    const sets = buildAdSets(brief, adUnitIds, { seedPalette: ctx.seedPalette });
    return { inference: { ...brief, mode: "ads" }, sets };
  },
  getEditorPlugins: () => [adsReviewPlugin, adsInspectorPlugin],
  getExportHints: () => ({}),
};
