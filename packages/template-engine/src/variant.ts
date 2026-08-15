/** OWNER: packages/template-engine — refresh copy only (geometry unchanged) */
import type { InferenceBrief } from "@take/core";
import { applyTemplate, type ApplyTemplateResult } from "./apply/apply-template";
import type { TemplateRecord } from "./template.types";

export function refreshVariantId(templateId: string): string {
  return `${templateId}::v${Date.now()}`;
}

export function refreshCopy(recipe: TemplateRecord, brief: InferenceBrief): ApplyTemplateResult {
  return applyTemplate({ recipe, brief, shotCount: recipe.frameCount });
}
