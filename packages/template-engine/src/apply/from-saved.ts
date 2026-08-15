/** OWNER: packages/template-engine — hydrate library cards into TemplateRecord */
import type { TemplateRecord } from "../template.types";
import { listSeedRecipes } from "../seeds/strip-bleed-hook";

export type RecipeSource = {
  id: string;
  name: string;
  tags?: string[];
  version?: number;
  deviceId?: string;
  defaultOrientation?: "portrait" | "landscape";
  frames?: number;
  style?: string;
  palette?: string[];
  lockBrand?: boolean;
  composition?: "isolated" | "strip";
  /** Full recipe snapshot (generated layouts) */
  layout?: unknown;
};

export function recipeFromSaved(input: RecipeSource | null | undefined): TemplateRecord {
  if (input?.layout && typeof input.layout === "object") {
    const rec = input.layout as TemplateRecord;
    if (rec.composition && Array.isArray(rec.devices) && rec.frameCount) {
      return {
        ...rec,
        id: rec.id || input.id,
        name: input.name || rec.name,
        lockBrand: input.lockBrand ?? rec.lockBrand,
      };
    }
  }
  if (input?.id) {
    const seed = listSeedRecipes().find((s) => s.id === input.id);
    if (seed) return seed;
  }
  if (input?.composition === "strip") {
    const base = listSeedRecipes()[0];
    if (base) {
      return {
        ...base,
        id: input.id,
        name: input.name || base.name,
        provenance: { source: "user" },
      };
    }
  }
  const frameCount = Math.min(12, Math.max(1, input?.frames || 5));
  return {
    id: input?.id || "isolated-default",
    name: input?.name || "Layout",
    tags: input?.tags || [],
    version: input?.version || 1,
    composition: "isolated",
    deviceId: input?.deviceId,
    defaultOrientation: input?.defaultOrientation,
    frameCount,
    typeFamily: "top",
    typeScale: "m",
    background: { kind: "solid", colorA: "#0c0d10" },
    devices: [],
    lockBrand: input?.lockBrand,
    style: input?.style,
    palette: input?.palette,
    provenance: { source: input?.id?.startsWith("sys-") || input?.id?.startsWith("seed-") ? "seed" : "user" },
  };
}
