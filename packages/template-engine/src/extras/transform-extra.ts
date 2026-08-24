/** OWNER: packages/template-engine — move / resize / rotate ExtraSlot */
import type { ExtraSlot } from "../template.types";
import { moveDevice, resizeDevice, rotateDevice, type ResizeCorner } from "../constraints/transform-device";

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
    authored: slot.authored,
  };
}

function merge(slot: ExtraSlot, d: ReturnType<typeof moveDevice>): ExtraSlot {
  return { ...slot, x: d.x, y: d.y, w: d.w, h: d.h, rotationDeg: d.rotationDeg, authored: true };
}

export function moveExtra(slot: ExtraSlot, dxSliceW: number, dySliceH: number): ExtraSlot {
  return merge(slot, moveDevice(asDevice(slot), dxSliceW, dySliceH));
}

export function rotateExtra(slot: ExtraSlot, deltaDeg: number): ExtraSlot {
  return merge(slot, rotateDevice(asDevice(slot), deltaDeg));
}

export function resizeExtra(
  slot: ExtraSlot,
  corner: ResizeCorner,
  dxSliceW: number,
  dySliceH: number,
  sliceW: number,
  sliceH: number
): ExtraSlot {
  return merge(slot, resizeDevice(asDevice(slot), corner, dxSliceW, dySliceH, sliceW, sliceH));
}
