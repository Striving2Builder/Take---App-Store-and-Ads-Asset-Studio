/** OWNER: stages/export — map catalog shellPx rects into local device paint space */
import type { PxSize, ScreenInset } from "@take/device-catalog";

export type LocalRect = { x: number; y: number; w: number; h: number };

/** ShellPx rect → local coords with origin at shell top-left (x,y). */
export function shellRectToLocal(
  rect: ScreenInset,
  shell: PxSize,
  localW: number,
  localH: number,
  originX: number,
  originY: number
): LocalRect {
  const sw = Math.max(1, shell.w);
  const sh = Math.max(1, shell.h);
  return {
    x: originX + (rect.x / sw) * localW,
    y: originY + (rect.y / sh) * localH,
    w: (rect.w / sw) * localW,
    h: (rect.h / sh) * localH,
  };
}

/** UV of a shellPx point (0–1 across shell). */
export function shellUv(x: number, y: number, shell: PxSize): { u: number; v: number } {
  return { u: x / Math.max(1, shell.w), v: y / Math.max(1, shell.h) };
}
