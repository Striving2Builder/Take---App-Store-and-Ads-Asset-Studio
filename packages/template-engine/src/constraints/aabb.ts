/** OWNER: packages/template-engine — axis-aligned + rotated bounds */
export type Rect = { x: number; y: number; w: number; h: number };

export function sliceRect(sliceIndex: number, sliceW: number, sliceH: number): Rect {
  return { x: sliceIndex * sliceW, y: 0, w: sliceW, h: sliceH };
}

export function worldSize(frameCount: number, sliceW: number, sliceH: number): { w: number; h: number } {
  return { w: Math.max(1, frameCount) * sliceW, h: sliceH };
}

export function intersectArea(a: Rect, b: Rect): number {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const r = Math.min(a.x + a.w, b.x + b.w);
  const btm = Math.min(a.y + a.h, b.y + b.h);
  const w = r - x;
  const h = btm - y;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

/** AABB of a device centered at (cx,cy) before rotation — rotation uses this as conservative bound. */
export function deviceAabb(cx: number, cy: number, w: number, h: number, rotationDeg: number): Rect {
  const rad = (rotationDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const bw = w * c + h * s;
  const bh = w * s + h * c;
  return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
}

/** Screen hole inside a device, catalog inset as fractions of the shell. */
export function screenAabb(
  cx: number,
  cy: number,
  shellW: number,
  shellH: number,
  rotationDeg: number,
  inset: { x: number; y: number; w: number; h: number }
): Rect {
  const ox = (inset.x + inset.w / 2 - 0.5) * shellW;
  const oy = (inset.y + inset.h / 2 - 0.5) * shellH;
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rx = ox * cos - oy * sin;
  const ry = ox * sin + oy * cos;
  return deviceAabb(cx + rx, cy + ry, shellW * inset.w, shellH * inset.h, rotationDeg);
}
