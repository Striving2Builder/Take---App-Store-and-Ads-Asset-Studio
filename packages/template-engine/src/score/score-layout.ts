/** OWNER: packages/template-engine — score a legal candidate */
import type { TemplateRecord } from "../template.types";
import { deviceAabb, intersectArea } from "../constraints/aabb";
import { slicesTouched, visibleFrac } from "../constraints/bleed";
import { toWorldInstance } from "../constraints/world";

export function scoreLayout(recipe: TemplateRecord, sliceW: number, sliceH: number): number {
  let s = 0;
  const placements = recipe.devices.map((d) => d.placement);
  const unique = new Set(placements);
  if ([...unique].some((p) => p !== "center")) s += 10;
  if (placements.some((p) => p === "bleed-next" || p === "bleed-prev")) s += 14;
  s += unique.size * 3;

  const n = recipe.frameCount;
  let minFrac = 1;
  for (const inst of recipe.devices) {
    const touched = slicesTouched(inst, n, sliceW, sliceH);
    for (const i of touched) {
      minFrac = Math.min(minFrac, visibleFrac(inst, i, sliceW, sliceH));
    }
  }
  s += minFrac * 8;

  for (let i = 0; i < n; i++) {
    const here = recipe.devices.filter((d) =>
      slicesTouched(d, n, sliceW, sliceH).includes(i)
    );
    for (let a = 0; a < here.length; a++) {
      for (let b = a + 1; b < here.length; b++) {
        const wa = toWorldInstance(here[a], sliceW, sliceH);
        const wb = toWorldInstance(here[b], sliceW, sliceH);
        const ia = deviceAabb(wa.x, wa.y, wa.w, wa.h, wa.rotationDeg);
        const ib = deviceAabb(wb.x, wb.y, wb.w, wb.h, wb.rotationDeg);
        const overlap = intersectArea(ia, ib);
        const minA = Math.min(wa.w * wa.h, wb.w * wb.h);
        s -= (overlap / Math.max(1, minA)) * 10;
      }
    }
  }
  return s;
}
