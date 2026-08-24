/** OWNER: packages/template-engine — ExtraSlot create / cap */
import type { ExtraKind, ExtraSlot, TemplateRecord } from "../template.types";
import { extrasInSlice, MAX_EXTRAS_PER_SLICE } from "../ensure-isolated";
import { shapeDefaults, widgetDefaults } from "./widget-defaults";

export function addExtraSlot(
  recipe: TemplateRecord,
  kind: ExtraKind,
  sliceIndex: number,
  partial?: Partial<ExtraSlot>
): { ok: true; recipe: TemplateRecord } | { ok: false; error: string } {
  const slice = Math.max(0, Math.min(recipe.frameCount - 1, sliceIndex));
  if (extrasInSlice(recipe, slice).length >= MAX_EXTRAS_PER_SLICE) {
    return { ok: false, error: `Max ${MAX_EXTRAS_PER_SLICE} extras on this slice` };
  }
  const fromWidget = partial?.widget ? widgetDefaults(partial.widget) : {};
  const fromShape = partial?.shape ? shapeDefaults(partial.shape) : {};
  const merged: Partial<ExtraSlot> = { ...fromWidget, ...fromShape, ...partial };
  const isCopy = kind === "copy" && !merged.widget && !merged.shape;
  const slot: ExtraSlot = {
    id: merged.id || `ex-${kind}-${Date.now()}`,
    kind,
    sliceIndex: slice,
    x: merged.x ?? slice + 0.5,
    y: merged.y ?? (isCopy ? 0.18 : merged.widget === "rating" ? 0.86 : 0.78),
    w: merged.w ?? (isCopy ? 0.72 : 0.28),
    h: merged.h ?? (isCopy ? 0.1 : 0.16),
    rotationDeg: merged.rotationDeg ?? 0,
    z: merged.z ?? 20,
    text: kind === "copy" ? merged.text ?? "New copy" : merged.text,
    imageUrl: merged.imageUrl,
    fill: merged.fill ?? "#f3f1ec",
    authored: true,
    shape: merged.shape,
    widget: merged.widget,
    score: merged.score,
    storeLabel: merged.storeLabel,
    quote: merged.quote,
    attribution: merged.attribution,
    stars: merged.stars,
    pills: merged.pills ? [...merged.pills] : undefined,
    shotIndex: merged.shotIndex,
    face: merged.face,
  };
  return { ok: true, recipe: { ...recipe, extras: [...(recipe.extras || []), slot] } };
}
