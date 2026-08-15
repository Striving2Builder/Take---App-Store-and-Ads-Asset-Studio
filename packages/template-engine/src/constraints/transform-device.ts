/** OWNER: packages/template-engine — user move / resize / rotate of a device slot */
import type { DeviceInstance } from "../template.types";

export type ResizeCorner = "nw" | "ne" | "sw" | "se";

const MIN_W = 0.18;

function heightSliceH(inst: DeviceInstance, sliceW: number, sliceH: number): number {
  return (inst.h * sliceW) / Math.max(1, sliceH);
}

export function moveDevice(inst: DeviceInstance, dxSliceW: number, dySliceH: number): DeviceInstance {
  return {
    ...inst,
    x: inst.x + dxSliceW,
    y: inst.y + dySliceH,
    authored: true,
  };
}

export function rotateDevice(inst: DeviceInstance, deltaDeg: number): DeviceInstance {
  return {
    ...inst,
    rotationDeg: inst.rotationDeg + deltaDeg,
    authored: true,
  };
}

export function resizeDevice(
  inst: DeviceInstance,
  corner: ResizeCorner,
  dxSliceW: number,
  dySliceH: number,
  sliceW: number,
  sliceH: number
): DeviceInstance {
  const h0 = heightSliceH(inst, sliceW, sliceH);
  let left = inst.x - inst.w / 2;
  let right = inst.x + inst.w / 2;
  let top = inst.y - h0 / 2;
  let bottom = inst.y + h0 / 2;
  if (corner.includes("e")) right += dxSliceW;
  if (corner.includes("w")) left += dxSliceW;
  if (corner.includes("s")) bottom += dySliceH;
  if (corner.includes("n")) top += dySliceH;

  const minH = (MIN_W * sliceW) / Math.max(1, sliceH);
  let w = Math.max(MIN_W, right - left);
  let hSlice = Math.max(minH, bottom - top);

  if (corner === "se") {
    right = left + w;
    bottom = top + hSlice;
  } else if (corner === "sw") {
    left = right - w;
    bottom = top + hSlice;
  } else if (corner === "ne") {
    right = left + w;
    top = bottom - hSlice;
  } else {
    left = right - w;
    top = bottom - hSlice;
  }

  w = right - left;
  hSlice = bottom - top;
  const h = (hSlice * sliceH) / Math.max(1, sliceW);
  return {
    ...inst,
    x: (left + right) / 2,
    y: (top + bottom) / 2,
    w,
    h,
    authored: true,
  };
}
