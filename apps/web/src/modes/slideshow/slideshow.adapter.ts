/** OWNER: modes/slideshow — ordered sequence optimized for export strip */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import { generateSets } from "../wizard/sets-builder";

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
    const sets = generateSets({ ...brief, mode: "slideshow" }, 1, undefined, {
      seedPalette: ctx.seedPalette,
    });
    const set = sets[0];
    set.name = "Slideshow sequence";
    set.styleLabel = "Slideshow · ordered beats";
    set.blurb =
      "Single ordered rail for PNG + motion export (WebM/MP4 via MediaRecorder). Hook → proof → close.";
    const roles = ["HOOK", "VALUE", "PROOF", "FEATURE", "SOCIAL", "CTA"];
    set.frames = set.frames.slice(0, roles.length).map((f, i) => ({
      ...f,
      role: roles[i] || f.role,
      index: i,
      kicker: `${String(i + 1).padStart(2, "0")} · ${roles[i] || f.role}`,
    }));
    return { inference: { ...brief, mode: "slideshow" }, sets };
  },
};
