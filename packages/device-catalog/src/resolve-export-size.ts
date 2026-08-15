/** OWNER: packages/device-catalog — single place for export WxH */
import { getDevice } from "./catalog";
import { resolveDefaultDevice } from "./resolve-default";
import type { DeviceOrientation, PxSize } from "./device.types";

export type ResolveExportSizeResult = {
  size: PxSize;
  deviceId: string;
  orientation: DeviceOrientation;
  fellBack: boolean;
  warning?: string;
};

function landscapeSize(portrait: PxSize, explicit?: PxSize): PxSize {
  if (explicit?.w && explicit?.h) return { ...explicit };
  return { w: portrait.h, h: portrait.w };
}

/**
 * Resolve store screenshot size from catalog.
 * Never invents pixels — falls back to platform default device if id unknown.
 */
export function resolveExportSize(
  deviceId: string | undefined | null,
  platform = "ios",
  orientation: DeviceOrientation = "portrait"
): ResolveExportSizeResult {
  const found = deviceId ? getDevice(deviceId) : undefined;
  if (found) {
    const size =
      orientation === "landscape"
        ? landscapeSize(found.exportPx, found.exportPxLandscape)
        : { ...found.exportPx };
    return { size, deviceId: found.id, orientation, fellBack: false };
  }
  const fallback = resolveDefaultDevice(platform);
  if (fallback) {
    const size =
      orientation === "landscape"
        ? landscapeSize(fallback.exportPx, fallback.exportPxLandscape)
        : { ...fallback.exportPx };
    return {
      size,
      deviceId: fallback.id,
      orientation,
      fellBack: true,
      warning: deviceId
        ? `Unknown deviceId “${deviceId}” — using ${fallback.name}`
        : `No deviceId — using ${fallback.name}`,
    };
  }
  return {
    size: orientation === "landscape" ? { w: 2868, h: 1320 } : { w: 1320, h: 2868 },
    deviceId: "apple.iphone-16-pro-max",
    orientation,
    fellBack: true,
    warning: "Catalog empty — using 6.9-inch emergency fallback",
  };
}
