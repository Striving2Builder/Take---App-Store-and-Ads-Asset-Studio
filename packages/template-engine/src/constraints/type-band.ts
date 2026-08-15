/** OWNER: packages/template-engine — type band per slice (type does not bleed) */
import type { TypeFamily, TypeScale } from "../template.types";
import type { Rect } from "./aabb";

export function typeBandRect(
  family: TypeFamily,
  sliceW: number,
  sliceH: number,
  scale: TypeScale
): Rect {
  const hFrac = scale === "s" ? 0.16 : scale === "l" ? 0.28 : 0.22;
  const h = sliceH * hFrac;
  if (family === "bottom") return { x: 0, y: sliceH - h, w: sliceW, h };
  return { x: 0, y: 0, w: sliceW, h };
}
