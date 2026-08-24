/** OWNER: packages/template-engine — pointer hit-test for extra slots */
import type { ExtraSlot } from "../template.types";
import { pointHitsDevice } from "../constraints/hit-device";

function asDevice(slot: ExtraSlot) {
  return {
    id: slot.id,
    x: slot.x,
    y: slot.y,
    w: slot.w,
    h: slot.h,
    rotationDeg: slot.rotationDeg,
    z: slot.z,
    shotIndex: 0,
    placement: "center" as const,
  };
}

export function hitExtra(
  extras: ExtraSlot[],
  sliceIndex: number,
  nx: number,
  ny: number,
  sliceW: number,
  sliceH: number
): ExtraSlot | null {
  const worldX = (sliceIndex + nx) * sliceW;
  const worldY = ny * sliceH;
  const ordered = [...extras].sort((a, b) => b.z - a.z);
  for (const slot of ordered) {
    if (pointHitsDevice(asDevice(slot), worldX, worldY, sliceW, sliceH)) return slot;
  }
  return null;
}
