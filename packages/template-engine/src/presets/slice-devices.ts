/** OWNER: packages/template-engine — add/remove/fan/orient devices on one PNG */
import type { DeviceInstance, TemplateRecord } from "../template.types";
import type { DeviceMetrics } from "../generate/types";
import { slicesTouched } from "../constraints/bleed";
import { extrasInSlice } from "../ensure-isolated";
import { MAX_DEVICES_PER_SLICE } from "../constraints/limits";
import { validateLayout } from "../constraints/validate-layout";
import { resolveMetrics } from "../generate/metrics";

export type SliceDeviceResult =
  | { ok: true; recipe: TemplateRecord }
  | { ok: false; error: string };

function cloneRecipe(recipe: TemplateRecord): TemplateRecord {
  return {
    ...recipe,
    devices: recipe.devices.map((d) => ({ ...d })),
    extras: recipe.extras?.map((e) => ({ ...e })),
    typeBand: recipe.typeBand?.slice(),
    background: { ...recipe.background },
  };
}

function localsOnSlice(
  recipe: TemplateRecord,
  sliceIndex: number,
  metrics: Pick<DeviceMetrics, "sliceW" | "sliceH">
): DeviceInstance[] {
  return recipe.devices.filter((d) => {
    if (d.placement === "bleed-next" || d.placement === "bleed-prev") return false;
    return slicesTouched(d, recipe.frameCount, metrics.sliceW, metrics.sliceH).includes(sliceIndex);
  });
}

function check(recipe: TemplateRecord, metrics: DeviceMetrics): SliceDeviceResult {
  const result = validateLayout(recipe, metrics.sliceW, metrics.sliceH, { inset: metrics.inset });
  if (!result.ok) return { ok: false, error: result.errors[0] || "Layout would be illegal" };
  return { ok: true, recipe };
}

function shellAspectFor(
  recipe: TemplateRecord,
  orientation: "portrait" | "landscape",
  setMetrics: DeviceMetrics
): number {
  const setOrient = recipe.defaultOrientation === "landscape" ? "landscape" : "portrait";
  if (orientation === setOrient) return setMetrics.shellAspect;
  return resolveMetrics(recipe.deviceId || "apple.iphone-16-pro-max", "ios", orientation).shellAspect;
}

export function addDeviceOnSlice(opts: {
  recipe: TemplateRecord;
  sliceIndex: number;
  metrics: DeviceMetrics;
}): SliceDeviceResult {
  const recipe = cloneRecipe(opts.recipe);
  const slice = Math.max(0, Math.min(recipe.frameCount - 1, opts.sliceIndex));
  const locals = localsOnSlice(recipe, slice, opts.metrics);
  if (locals.length >= MAX_DEVICES_PER_SLICE) {
    return { ok: false, error: `Max ${MAX_DEVICES_PER_SLICE} phones on this PNG` };
  }
  const w = 0.5;
  recipe.devices.push({
    id: `iso-${slice}-${Date.now()}`,
    x: slice + 0.5 + locals.length * 0.08,
    y: 0.56,
    w,
    h: w * opts.metrics.shellAspect,
    rotationDeg: locals.length === 0 ? 0 : locals.length === 1 ? 8 : -8,
    z: locals.length + 1,
    shotIndex: slice,
    placement: "center",
    authored: true,
  });
  return check(recipe, opts.metrics);
}

export function removeLocalDevicesOnSlice(opts: {
  recipe: TemplateRecord;
  sliceIndex: number;
  metrics: DeviceMetrics;
  instanceId?: string;
}): SliceDeviceResult {
  const recipe = cloneRecipe(opts.recipe);
  const slice = Math.max(0, Math.min(recipe.frameCount - 1, opts.sliceIndex));
  const locals = localsOnSlice(recipe, slice, opts.metrics);
  if (!locals.length) return { ok: false, error: "No phone on this PNG to remove" };
  const target = opts.instanceId ? locals.find((d) => d.id === opts.instanceId) : locals[locals.length - 1];
  if (!target) return { ok: false, error: "That phone is not on this PNG" };
  const nextLocals = locals.length - 1;
  if (nextLocals < 1 && extrasInSlice(recipe, slice).length < 1) {
    return { ok: false, error: "Add a widget or extra before a PNG with no phone" };
  }
  recipe.devices = recipe.devices.filter((d) => d.id !== target.id);
  return check(recipe, opts.metrics);
}

export function stampFan3OnSlice(opts: {
  recipe: TemplateRecord;
  sliceIndex: number;
  metrics: DeviceMetrics;
}): SliceDeviceResult {
  const recipe = cloneRecipe(opts.recipe);
  const slice = Math.max(0, Math.min(recipe.frameCount - 1, opts.sliceIndex));
  const locals = localsOnSlice(recipe, slice, opts.metrics);
  const keep = recipe.devices.filter((d) => !locals.includes(d));
  const aspect = opts.metrics.shellAspect;
  const trio: DeviceInstance[] = [
    {
      id: locals[0]?.id || `fan-${slice}-l`,
      x: slice + 0.32,
      y: 0.58,
      w: 0.4,
      h: 0.4 * aspect,
      rotationDeg: -12,
      z: 1,
      shotIndex: locals[0]?.shotIndex ?? slice,
      placement: "center",
      authored: true,
    },
    {
      id: locals[1]?.id || `fan-${slice}-c`,
      x: slice + 0.5,
      y: 0.6,
      w: 0.46,
      h: 0.46 * aspect,
      rotationDeg: 4,
      z: 3,
      shotIndex: locals[1]?.shotIndex ?? slice,
      placement: "center",
      authored: true,
    },
    {
      id: locals[2]?.id || `fan-${slice}-r`,
      x: slice + 0.68,
      y: 0.58,
      w: 0.4,
      h: 0.4 * aspect,
      rotationDeg: 12,
      z: 2,
      shotIndex: locals[2]?.shotIndex ?? slice,
      placement: "center",
      authored: true,
    },
  ];
  recipe.devices = [...keep, ...trio];
  return check(recipe, opts.metrics);
}

export function setInstanceOrientation(opts: {
  recipe: TemplateRecord;
  instanceId: string;
  orientation: "portrait" | "landscape";
  metrics: DeviceMetrics;
}): SliceDeviceResult {
  const recipe = cloneRecipe(opts.recipe);
  const inst = recipe.devices.find((d) => d.id === opts.instanceId);
  if (!inst) return { ok: false, error: "No device selected" };
  const aspect = shellAspectFor(recipe, opts.orientation, opts.metrics);
  const w = opts.orientation === "landscape" ? Math.max(inst.w, 0.62) : Math.min(inst.w, 0.58);
  inst.orientation = opts.orientation;
  inst.w = w;
  inst.h = w * aspect;
  inst.authored = true;
  return check(recipe, opts.metrics);
}
