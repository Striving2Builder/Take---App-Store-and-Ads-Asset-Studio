/** OWNER: modes/slideshow — storyboard / pacing adapter */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import { buildSlideshowSets } from "./slideshow-builder";
import { slideshowInspectorPlugin, slideshowReviewPlugin } from "./slideshow.plugin";

export const slideshowMode: CreationMode = {
  id: "slideshow",
  label: "Slideshow",
  capabilities: {
    needsUrl: true,
    needsUploads: false,
    supportsStorySequence: true,
    supportsVideo: true,
    supportsTrace: false,
  },
  validateIntake(input) {
    const missing: string[] = [];
    if (!input.url && input.uploads === 0) missing.push("URL or uploads required");
    return missing;
  },
  async run(input, ctx) {
    const brief = ctx.priorBrief
      ? { ...ctx.priorBrief, mode: "slideshow" as const }
      : (await scanApp(input)).brief;
    const sets = buildSlideshowSets(brief, {
      seedPalette: ctx.seedPalette,
      deviceId: ctx.deviceId,
    });
    return { inference: { ...brief, mode: "slideshow" }, sets };
  },
  getEditorPlugins: () => [slideshowReviewPlugin, slideshowInspectorPlugin],
  getExportHints: () => ({ preferMotion: true, defaultPresets: ["slideshow"] }),
};
