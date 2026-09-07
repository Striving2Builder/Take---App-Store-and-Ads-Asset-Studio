/** OWNER: editor/device — shared inset/fit draw helpers for export (no bezel in store PNG) */
import {
  fitScreenshot,
  fullCanvasInset,
  getDevice,
  resolveExportSize,
  MAX_SCREENSHOT_UPSCALE,
  type DeviceFitMode,
  type FitRect,
} from "@take/device-catalog";
import { state } from "../../app/app-state";

/** Cover/contain both let a small source get stretched to fill the box; past
 *  MAX_SCREENSHOT_UPSCALE that reads as blur, so pull dest back to a capped,
 *  centered size instead — same source crop, just not smeared as wide. */
function capFitUpscale(fit: FitRect, inset: { x: number; y: number; w: number; h: number }): FitRect {
  if (fit.sw <= 0 || fit.sh <= 0 || fit.dw <= 0 || fit.dh <= 0) return fit;
  const scale = fit.dw / fit.sw;
  if (scale <= MAX_SCREENSHOT_UPSCALE) return fit;
  const dw = fit.sw * MAX_SCREENSHOT_UPSCALE;
  const dh = fit.sh * MAX_SCREENSHOT_UPSCALE;
  return {
    ...fit,
    dx: inset.x + (inset.w - dw) / 2,
    dy: inset.y + (inset.h - dh) / 2,
    dw,
    dh,
  };
}

export type ScreenFillPlan = {
  canvasW: number;
  canvasH: number;
  fit: FitRect;
  deviceId: string;
  fitMode: DeviceFitMode;
};

/**
 * Plan how to fill the store screenshot canvas with a source image.
 * Export path without a layout recipe: screen === exportPx (full-bleed shot).
 * With a recipe: paintStripSlice geometric shells + hardware chrome.
 */
export function planScreenFill(
  srcW: number,
  srcH: number,
  opts?: { deviceId?: string; fitMode?: DeviceFitMode; platform?: string }
): ScreenFillPlan {
  const deviceId = opts?.deviceId ?? state.deviceId;
  const fitMode = opts?.fitMode ?? state.fitMode;
  const platform = opts?.platform ?? state.platform;
  const resolved = resolveExportSize(deviceId, platform, state.orientation);
  const device = getDevice(resolved.deviceId);
  const inset = fullCanvasInset(resolved.size.w, resolved.size.h);
  const fit = capFitUpscale(
    fitScreenshot({
      srcW,
      srcH,
      inset,
      mode: fitMode,
      safeArea: device?.safeArea,
    }),
    inset
  );
  return {
    canvasW: resolved.size.w,
    canvasH: resolved.size.h,
    fit,
    deviceId: resolved.deviceId,
    fitMode,
  };
}

/** Draw image into ctx using a fit plan (source crop → dest). */
export function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  plan: ScreenFillPlan
) {
  const { fit } = plan;
  if (fit.sw <= 0 || fit.sh <= 0 || fit.dw <= 0 || fit.dh <= 0) return;
  ctx.drawImage(img, fit.sx, fit.sy, fit.sw, fit.sh, fit.dx, fit.dy, fit.dw, fit.dh);
}

/** CSS object-fit mapping for editor preview (safe-area ≈ cover). */
export function cssObjectFitForMode(mode: DeviceFitMode): "cover" | "contain" {
  return mode === "contain" ? "contain" : "cover";
}
