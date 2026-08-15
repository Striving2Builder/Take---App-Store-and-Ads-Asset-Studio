/** OWNER: modes/template — generateLayout × qty; library apply is the inspector */
import type { CreationMode } from "@take/modes-sdk";
import { scanApp } from "@take/scan-client";
import { generateLayout } from "@take/template-engine";
import { resolveTemplateBind } from "./template-bind";
import { pickTemplate } from "./template-pick";
import { projectSetFromRecipe } from "./template-set";
import { templateInspectorPlugin, templateReviewPlugin } from "./template.plugin";

export const templateMode: CreationMode = {
  id: "template",
  label: "Template",
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
      ? { ...ctx.priorBrief, mode: "template" as const }
      : (await scanApp(input)).brief;
    const tpl = pickTemplate(ctx.templateId);
    const bind = resolveTemplateBind(tpl);
    const deviceId = bind?.deviceId || ctx.deviceId || "apple.iphone-16-pro-max";
    const orientation = bind?.orientation || ctx.orientation || "portrait";
    const qty = Math.min(5, Math.max(1, input.qty || 1));
    const shotCount = ctx.shotCount && ctx.shotCount > 0 ? ctx.shotCount : 5;
    const lockBrand = !!tpl?.lockBrand;
    const palette = lockBrand && tpl?.palette?.length ? tpl.palette : ctx.seedPalette;
    const baseSeed = `${Date.now().toString(16)}-${Math.floor(Math.random() * 0xffffffff).toString(16)}`;
    const sets = Array.from({ length: qty }, (_, i) => {
      const recipe = generateLayout({
        deviceId,
        orientation,
        platform: brief.platform || "ios",
        shotCount,
        seed: qty === 1 ? baseSeed : `${baseSeed}:${i}`,
        palette,
        lockBrand,
        name: brief.name ? `${brief.name} · layout ${i + 1}` : undefined,
      });
      return projectSetFromRecipe(recipe, brief, {
        deviceId,
        seedPalette: lockBrand ? undefined : ctx.seedPalette,
        index: i,
      });
    });
    return {
      inference: { ...brief, mode: "template" },
      sets,
      deviceId,
      orientation,
    };
  },
  getEditorPlugins: () => [templateReviewPlugin, templateInspectorPlugin],
  getExportHints: () => ({}),
};
