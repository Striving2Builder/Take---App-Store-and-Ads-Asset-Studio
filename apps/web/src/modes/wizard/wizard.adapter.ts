/** OWNER: modes/wizard — mode adapter */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import { generateSets } from "./sets-builder";

export const wizardMode: CreationMode = {
  id: "wizard",
  label: "Wizard",
  capabilities: {
    needsUrl: true,
    needsUploads: false,
    supportsStorySequence: true,
    supportsVideo: false,
    supportsTrace: false,
  },
  validateIntake(input) {
    const missing: string[] = [];
    if (!input.url && input.uploads === 0) missing.push("URL or uploads required");
    return missing;
  },
  async run(input, ctx) {
    const brief = ctx.priorBrief
      ? { ...ctx.priorBrief, mode: "wizard" as const }
      : (await scanApp(input)).brief;
    const sets = generateSets(brief, input.qty, undefined, {
      seedPalette: ctx.seedPalette,
    });
    return { inference: { ...brief, mode: "wizard" }, sets };
  },
};
