/** OWNER: editor/layout — write TemplateRecord onto the current ProjectSet */
import {
  applyStripPanorama,
  ensureIsolatedRecipe,
  type TemplateRecord,
} from "@take/template-engine";
import { currentSet, state } from "../../app/app-state";
import { stripRecipeOfSet } from "../../stages/export/paint-strip-slice";

export function attachRecipeToSet(recipe: TemplateRecord) {
  const set = currentSet();
  if (!set) return;
  set.composition = recipe.composition;
  set.layout = { composition: recipe.composition, recipe };
}

/** First Set view / panorama / extra slot — Wizard shares #layout-stage after this. */
export function ensureSetRecipe(): TemplateRecord | null {
  const set = currentSet();
  if (!set) return null;
  const recipe = ensureIsolatedRecipe({
    existing: stripRecipeOfSet(),
    frameCount: set.frames.length,
    deviceId: set.deviceId || state.deviceId,
    palette: set.palette,
  });
  attachRecipeToSet(recipe);
  return recipe;
}

export function applyPanoramaToSet(imageUrl: string): TemplateRecord | null {
  if (!imageUrl || imageUrl.startsWith("blob:")) return null;
  const base = ensureSetRecipe();
  if (!base) return null;
  const recipe = applyStripPanorama(base, imageUrl, "cover");
  attachRecipeToSet(recipe);
  return recipe;
}
