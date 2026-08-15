/** OWNER: packages/template-engine — world units for strip recipes */
import type { DeviceInstance } from "../template.types";

/**
 * Recipe coords (normalized):
 * - x, w, h in **slice-widths** (1 = one exportPx.w)
 * - y in **slice-heights** (1 = exportPx.h)
 */
export function toWorldInstance(
  inst: DeviceInstance,
  sliceW: number,
  sliceH: number
): DeviceInstance {
  return {
    ...inst,
    x: inst.x * sliceW,
    y: inst.y * sliceH,
    w: inst.w * sliceW,
    h: inst.h * sliceW,
  };
}
