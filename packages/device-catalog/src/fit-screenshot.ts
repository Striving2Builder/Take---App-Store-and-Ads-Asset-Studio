/** OWNER: packages/device-catalog — pure screenshot fit math (no DOM) */
import type { DeviceFitMode, SafeArea, ScreenInset } from "./device.types";

export type FitRect = {
  /** Source crop in image pixels */
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  /** Destination rect in target/inset pixels */
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

export type FitInput = {
  srcW: number;
  srcH: number;
  inset: ScreenInset;
  mode: DeviceFitMode;
  /** Used by safe-area mode (cover then bias crop toward safe region) */
  safeArea?: SafeArea;
};

function coverCrop(
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  focusX = 0.5,
  focusY = 0.5
): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(destW / srcW, destH / srcH);
  const sw = destW / scale;
  const sh = destH / scale;
  const sx = Math.max(0, Math.min(srcW - sw, srcW * focusX - sw / 2));
  const sy = Math.max(0, Math.min(srcH - sh, srcH * focusY - sh / 2));
  return { sx, sy, sw, sh };
}

function containLetterbox(
  srcW: number,
  srcH: number,
  destW: number,
  destH: number
): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.min(destW / srcW, destH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return {
    dx: (destW - dw) / 2,
    dy: (destH - dh) / 2,
    dw,
    dh,
  };
}

/**
 * Compute how to draw a screenshot into an inset rect.
 * Geometry only — does not convert OS UI chrome.
 */
export function fitScreenshot(input: FitInput): FitRect {
  const { srcW, srcH, inset, mode, safeArea } = input;
  if (srcW <= 0 || srcH <= 0 || inset.w <= 0 || inset.h <= 0) {
    return { sx: 0, sy: 0, sw: 0, sh: 0, dx: inset.x, dy: inset.y, dw: 0, dh: 0 };
  }

  if (mode === "contain") {
    const box = containLetterbox(srcW, srcH, inset.w, inset.h);
    return {
      sx: 0,
      sy: 0,
      sw: srcW,
      sh: srcH,
      dx: inset.x + box.dx,
      dy: inset.y + box.dy,
      dw: box.dw,
      dh: box.dh,
    };
  }

  let focusX = 0.5;
  let focusY = 0.5;
  if (mode === "safe-area" && safeArea) {
    const safeW = Math.max(1, inset.w - safeArea.left - safeArea.right);
    const safeH = Math.max(1, inset.h - safeArea.top - safeArea.bottom);
    focusX = (safeArea.left + safeW / 2) / inset.w;
    focusY = (safeArea.top + safeH / 2) / inset.h;
  }

  const crop = coverCrop(srcW, srcH, inset.w, inset.h, focusX, focusY);
  return {
    ...crop,
    dx: inset.x,
    dy: inset.y,
    dw: inset.w,
    dh: inset.h,
  };
}

/** Full-canvas inset helper when screen === exportPx (store PNG path). */
export function fullCanvasInset(w: number, h: number): ScreenInset {
  return { x: 0, y: 0, w, h };
}
