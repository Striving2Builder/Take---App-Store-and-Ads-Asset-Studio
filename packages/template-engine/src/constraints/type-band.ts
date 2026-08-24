/** OWNER: packages/template-engine — type band per slice (type does not bleed) */
import type { TemplateRecord, TypeBandKind, TypeFamily, TypeScale } from "../template.types";
import type { Rect } from "./aabb";

export function typeBandForSlice(
  recipe: Pick<TemplateRecord, "typeFamily" | "typeBand">,
  sliceIndex: number
): TypeBandKind {
  const v = recipe.typeBand?.[sliceIndex];
  if (v === "top" || v === "bottom" || v === "split" || v === "none") return v;
  return recipe.typeFamily;
}

export function setSliceTypeBand(
  recipe: TemplateRecord,
  sliceIndex: number,
  kind: TypeBandKind
): TemplateRecord {
  const n = Math.max(1, recipe.frameCount);
  const i = Math.max(0, Math.min(n - 1, sliceIndex));
  const bands: TypeBandKind[] = Array.from({ length: n }, (_, k) => typeBandForSlice(recipe, k));
  bands[i] = kind;
  return { ...recipe, typeBand: bands };
}

export function typeBandRect(
  family: TypeBandKind | TypeFamily,
  sliceW: number,
  sliceH: number,
  scale: TypeScale
): Rect {
  if (family === "none") return { x: 0, y: 0, w: 0, h: 0 };
  const hFrac = scale === "s" ? 0.16 : scale === "l" ? 0.28 : 0.22;
  const h = sliceH * hFrac;
  if (family === "bottom") return { x: 0, y: sliceH - h, w: sliceW, h };
  return { x: 0, y: 0, w: sliceW, h };
}
