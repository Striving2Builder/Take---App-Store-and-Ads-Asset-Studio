/** OWNER: packages/template-engine — catalog sizes for the solver (no SVG) */
import { getDevice, resolveExportSize } from "@take/device-catalog";
import type { DeviceMetrics } from "./types";

export function resolveMetrics(
  deviceId: string,
  platform = "ios",
  orientation: "portrait" | "landscape" = "portrait"
): DeviceMetrics {
  const resolved = resolveExportSize(deviceId, platform, orientation);
  const device = getDevice(resolved.deviceId);
  const landscape = orientation === "landscape";
  let shellW = device?.shellPx.w ?? resolved.size.w;
  let shellH = device?.shellPx.h ?? resolved.size.h;
  if (landscape) {
    if (device?.shellPxLandscape) {
      shellW = device.shellPxLandscape.w;
      shellH = device.shellPxLandscape.h;
    } else {
      shellW = device?.shellPx.h ?? resolved.size.w;
      shellH = device?.shellPx.w ?? resolved.size.h;
    }
  }
  let inset = { x: 0.055, y: 0.06, w: 0.89, h: 0.88 };
  const si = landscape
    ? device?.screenInsetLandscape ||
      (device?.screenInset
        ? { x: device.screenInset.y, y: device.screenInset.x, w: device.screenInset.h, h: device.screenInset.w }
        : undefined)
    : device?.screenInset;
  if (si) {
    inset = {
      x: si.x / shellW,
      y: si.y / shellH,
      w: si.w / shellW,
      h: si.h / shellH,
    };
  }
  return {
    sliceW: resolved.size.w,
    sliceH: resolved.size.h,
    shellAspect: shellH / Math.max(1, shellW),
    inset,
  };
}
