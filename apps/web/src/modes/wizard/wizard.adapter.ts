/** OWNER: modes/wizard — mode adapter */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import {
  bindRecipeShell,
  recipeFromSaved,
  storeShellFromPlatform,
} from "@take/template-engine";
import { generateSets } from "./sets-builder";
import { wizardReviewPlugin } from "./wizard.plugin";
import { pickTemplate } from "../template/template-pick";
import { projectSetFromRecipe } from "../template/template-set";

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
    if (ctx.templateId) {
      const tpl = pickTemplate(ctx.templateId);
      let recipe = recipeFromSaved({ ...tpl, layout: tpl?.layout });
      if (recipe.devices.length) {
        const mobile =
          (recipe.tags || []).includes("mobile") || tpl?.platform === "mobile";
        if (mobile) {
          const shell = storeShellFromPlatform(brief.platform, ctx.deviceId);
          recipe = bindRecipeShell(recipe, shell);
        }
        const set = projectSetFromRecipe(recipe, brief, {
          deviceId: recipe.deviceId || ctx.deviceId,
          seedPalette: ctx.seedPalette,
        });
        return {
          inference: { ...brief, mode: "wizard" },
          sets: [set],
          deviceId: set.deviceId,
          orientation: recipe.defaultOrientation,
        };
      }
    }
    const sets = generateSets(brief, input.qty, ctx.deviceId, {
      seedPalette: ctx.seedPalette,
    });
    return { inference: { ...brief, mode: "wizard" }, sets };
  },
  getEditorPlugins: () => [wizardReviewPlugin],
  getExportHints: () => ({}),
};
