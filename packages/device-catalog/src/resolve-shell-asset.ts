/** OWNER: packages/device-catalog — resolve shell asset URL for view/orientation */
import type { DeviceOrientation, DeviceProfile, ShellView } from "./device.types";

export function resolveShellAsset(
  device: DeviceProfile | undefined,
  view: ShellView,
  orientation: DeviceOrientation = "portrait"
): string | undefined {
  if (!device) return undefined;
  if (view === "back") {
    if (orientation === "landscape" && device.shellAssetBackLandscape) {
      return device.shellAssetBackLandscape;
    }
    return device.shellAssetBack || undefined;
  }
  if (orientation === "landscape" && device.shellAssetFrontLandscape) {
    return device.shellAssetFrontLandscape;
  }
  return device.shellAssetFront || device.shellAsset || undefined;
}
