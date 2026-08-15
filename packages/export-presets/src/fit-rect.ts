/** OWNER: packages/export-presets — cover / contain placement math (no canvas) */
import type { ExportFit } from "./preset.types";

export type FitRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

function round(n: number): number {
  return Math.round(n);
}

/** Place src into dest. Cover crops source; contain letterboxes dest. */
export function fitRect(
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  fit: ExportFit
): FitRect {
  if (srcW <= 0 || srcH <= 0 || destW <= 0 || destH <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(0, srcW), sh: Math.max(0, srcH), dx: 0, dy: 0, dw: destW, dh: destH };
  }
  const srcA = srcW / srcH;
  const destA = destW / destH;
  if (fit === "cover") {
    if (srcA > destA) {
      const sw = srcH * destA;
      return { sx: round((srcW - sw) / 2), sy: 0, sw: round(sw), sh: srcH, dx: 0, dy: 0, dw: destW, dh: destH };
    }
    const sh = srcW / destA;
    return { sx: 0, sy: round((srcH - sh) / 2), sw: srcW, sh: round(sh), dx: 0, dy: 0, dw: destW, dh: destH };
  }
  if (srcA > destA) {
    const dw = destW;
    const dh = destW / srcA;
    return { sx: 0, sy: 0, sw: srcW, sh: srcH, dx: 0, dy: round((destH - dh) / 2), dw, dh: round(dh) };
  }
  const dh = destH;
  const dw = destH * srcA;
  return { sx: 0, sy: 0, sw: srcW, sh: srcH, dx: round((destW - dw) / 2), dy: 0, dw: round(dw), dh };
}
