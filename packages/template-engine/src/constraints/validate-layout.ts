/** OWNER: packages/template-engine — AND of layout legality rules */
import type { DeviceInstance, TemplateRecord } from "../template.types";
import type { DeviceMetrics } from "../generate/types";
import { resolveMetrics } from "../generate/metrics";
import { intersectArea } from "./aabb";
import { bleedLegal, slicesTouched } from "./bleed";
import { MAX_DEVICES_PER_SLICE } from "./limits";
import { hasPerspective, instanceAabb, instanceScreenAabb } from "../project/perspective";
import { typeBandForSlice, typeBandRect } from "./type-band";

export type ValidateLayoutResult = { ok: boolean; errors: string[] };

const TYPE_OVERLAP_MAX = 0.2;
const MIN_SCREEN_FRAC = 0.22;
const DEFAULT_INSET = { x: 0.055, y: 0.06, w: 0.89, h: 0.88 };

function insetOk(inset: { x: number; y: number; w: number; h: number }): boolean {
  return (
    inset.x >= 0 &&
    inset.y >= 0 &&
    inset.w > 0.4 &&
    inset.h > 0.4 &&
    inset.x + inset.w <= 1.02 &&
    inset.y + inset.h <= 1.02
  );
}

function extrasOnSlice(recipe: TemplateRecord, sliceIndex: number) {
  return (recipe.extras || []).filter(
    (e) => e.sliceIndex === sliceIndex || Math.floor(e.x) === sliceIndex
  );
}

function insetFor(
  recipe: TemplateRecord,
  inst: DeviceInstance,
  fallback: { x: number; y: number; w: number; h: number }
) {
  const setOrient = recipe.defaultOrientation === "landscape" ? "landscape" : "portrait";
  const orient = inst.orientation || setOrient;
  if (orient === setOrient) return fallback;
  return resolveMetrics(recipe.deviceId || "apple.iphone-16-pro-max", "ios", orient).inset;
}

export function validateLayout(
  recipe: TemplateRecord,
  sliceW: number,
  sliceH: number,
  metrics?: Pick<DeviceMetrics, "inset">
): ValidateLayoutResult {
  const errors: string[] = [];
  const n = recipe.frameCount;
  if (n < 1) errors.push("no frames");
  const inset = metrics?.inset || DEFAULT_INSET;
  if (!insetOk(inset)) errors.push("catalog screenInset outside shell");

  const perSlice = Array.from({ length: n }, () => 0);
  for (const inst of recipe.devices) {
    if (!bleedLegal(inst, n, sliceW, sliceH)) {
      errors.push(`illegal bleed/visibleFrac ${inst.id}`);
    }
    const touched = slicesTouched(inst, n, sliceW, sliceH);
    const maySpan =
      inst.authored || inst.placement === "bleed-next" || inst.placement === "bleed-prev";
    if (
      (inst.placement === "bleed-next" || inst.placement === "bleed-prev") &&
      !inst.authored &&
      touched.length < 2
    ) {
      errors.push(`bleed ${inst.id} does not cross a cut`);
    }
    if (!maySpan && touched.length > 1) {
      errors.push(`local ${inst.id} spilled into ${touched.length} slices`);
    }
    for (const i of touched) perSlice[i] += 1;

    const usedInset = insetFor(recipe, inst, inset);
    const shell = instanceAabb(inst, sliceW, sliceH);
    const screen = instanceScreenAabb(inst, sliceW, sliceH, usedInset);
    const screenArea = Math.max(1, screen.w * screen.h);
    if (!hasPerspective(inst) && intersectArea(screen, shell) / screenArea < 0.97) {
      errors.push(`screenInset outside shell ${inst.id}`);
    }
    if (!inst.authored) {
      for (const i of touched) {
        const slice = { x: i * sliceW, y: 0, w: sliceW, h: sliceH };
        if (intersectArea(screen, slice) / screenArea < MIN_SCREEN_FRAC) {
          errors.push(`screen sliver ${inst.id} slice ${i}`);
        }
      }
    }
  }

  perSlice.forEach((c, i) => {
    if (c > MAX_DEVICES_PER_SLICE) errors.push(`slice ${i} has ${c} devices`);
    if (c < 1 && extrasOnSlice(recipe, i).length < 1) errors.push(`slice ${i} empty`);
  });

  for (const inst of recipe.devices) {
    const box = instanceAabb(inst, sliceW, sliceH);
    const touched = slicesTouched(inst, n, sliceW, sliceH);
    for (const i of touched) {
      const family = typeBandForSlice(recipe, i);
      if (family === "none") continue;
      const band = typeBandRect(family, sliceW, sliceH, recipe.typeScale);
      const bandWorld = { x: i * sliceW + band.x, y: band.y, w: band.w, h: band.h };
      const overlap = intersectArea(box, bandWorld);
      if (!inst.authored && overlap / Math.max(1, box.w * box.h) > TYPE_OVERLAP_MAX) {
        errors.push(`type-band overlap ${inst.id} slice ${i}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
