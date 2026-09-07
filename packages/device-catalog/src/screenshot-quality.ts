/** OWNER: packages/device-catalog — shared upscale math for screenshot quality checks */
import { getDevice } from "./catalog";
import { resolveExportSize } from "./resolve-export-size";

/** Above this, stretching a screenshot to fill the screen would look visibly soft —
 *  painters pad/letterbox instead of upscaling past this point. */
export const MAX_SCREENSHOT_UPSCALE = 1.5;

/**
 * How much a srcW×srcH screenshot would need to be scaled up to fully cover
 * deviceId's store screen. <=1 means no upscale needed (sharp); >1 is blur risk,
 * and >MAX_SCREENSHOT_UPSCALE is what painters treat as "pad instead of stretch".
 */
export function screenshotUpscaleFactor(
  deviceId: string | undefined | null,
  platform: string,
  srcW: number,
  srcH: number
): number {
  if (srcW <= 0 || srcH <= 0) return 1;
  const resolved = resolveExportSize(deviceId, platform, "portrait");
  const device = getDevice(resolved.deviceId);
  const shellW = device?.shellPx.w ?? resolved.size.w;
  const shellH = device?.shellPx.h ?? resolved.size.h;
  const si = device?.screenInset;
  const screenW = si ? resolved.size.w * (si.w / shellW) : resolved.size.w;
  const screenH = si ? resolved.size.h * (si.h / shellH) : resolved.size.h;
  return Math.max(screenW / srcW, screenH / srcH);
}
