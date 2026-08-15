/** OWNER: packages/template-engine — bleed legality (visible fraction per slice) */
import type { DeviceInstance } from "../template.types";
import { deviceAabb, intersectArea, sliceRect } from "./aabb";
import { toWorldInstance } from "./world";

export const MIN_VISIBLE_FRAC = 0.28;

export function visibleFrac(
  inst: DeviceInstance,
  sliceIndex: number,
  sliceW: number,
  sliceH: number
): number {
  const world = toWorldInstance(inst, sliceW, sliceH);
  const box = deviceAabb(world.x, world.y, world.w, world.h, world.rotationDeg);
  const slice = sliceRect(sliceIndex, sliceW, sliceH);
  const area = world.w * world.h;
  if (area <= 0) return 0;
  return intersectArea(box, slice) / area;
}

export function slicesTouched(
  inst: DeviceInstance,
  frameCount: number,
  sliceW: number,
  sliceH: number
): number[] {
  const out: number[] = [];
  for (let i = 0; i < frameCount; i++) {
    if (visibleFrac(inst, i, sliceW, sliceH) > 0.001) out.push(i);
  }
  return out;
}

export function bleedLegal(
  inst: DeviceInstance,
  frameCount: number,
  sliceW: number,
  sliceH: number,
  minFrac = MIN_VISIBLE_FRAC
): boolean {
  const touched = slicesTouched(inst, frameCount, sliceW, sliceH);
  if (!touched.length) return false;
  if (inst.authored) {
    return touched.some((i) => visibleFrac(inst, i, sliceW, sliceH) >= Math.min(0.12, minFrac));
  }
  if (inst.placement === "bleed-next" || inst.placement === "bleed-prev") {
    if (touched.length < 2) return false;
  }
  return touched.every((i) => visibleFrac(inst, i, sliceW, sliceH) >= minFrac);
}
