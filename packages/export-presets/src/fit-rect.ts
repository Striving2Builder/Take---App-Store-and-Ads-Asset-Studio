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

/**
 * Place src into dest. Cover crops source; contain letterboxes dest.
 * Pass maxUpscale to cap how far a smaller-than-dest source gets stretched —
 * past that ratio, stretching reads as visible blur, so the placed rect is
 * pulled back to a smaller, centered size instead (same source crop).
 */
export function fitRect(
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
  fit: ExportFit,
  maxUpscale?: number
): FitRect {
  if (srcW <= 0 || srcH <= 0 || destW <= 0 || destH <= 0) {
    return { sx: 0, sy: 0, sw: Math.max(0, srcW), sh: Math.max(0, srcH), dx: 0, dy: 0, dw: destW, dh: destH };
  }
  const srcA = srcW / srcH;
  const destA = destW / destH;
  let r: FitRect;
  if (fit === "cover") {
    if (srcA > destA) {
      const sw = srcH * destA;
      r = { sx: round((srcW - sw) / 2), sy: 0, sw: round(sw), sh: srcH, dx: 0, dy: 0, dw: destW, dh: destH };
    } else {
      const sh = srcW / destA;
      r = { sx: 0, sy: round((srcH - sh) / 2), sw: srcW, sh: round(sh), dx: 0, dy: 0, dw: destW, dh: destH };
    }
  } else if (srcA > destA) {
    const dw = destW;
    const dh = destW / srcA;
    r = { sx: 0, sy: 0, sw: srcW, sh: srcH, dx: 0, dy: round((destH - dh) / 2), dw, dh: round(dh) };
  } else {
    const dh = destH;
    const dw = destH * srcA;
    r = { sx: 0, sy: 0, sw: srcW, sh: srcH, dx: round((destW - dw) / 2), dy: 0, dw: round(dw), dh };
  }
  if (maxUpscale && r.sw > 0 && r.sh > 0) {
    const scale = Math.max(r.dw / r.sw, r.dh / r.sh);
    if (scale > maxUpscale) {
      const dw = r.sw * maxUpscale;
      const dh = r.sh * maxUpscale;
      r = {
        ...r,
        dx: round(r.dx + (r.dw - dw) / 2),
        dy: round(r.dy + (r.dh - dh) / 2),
        dw: round(dw),
        dh: round(dh),
      };
    }
  }
  return r;
}
