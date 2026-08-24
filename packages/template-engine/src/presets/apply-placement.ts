/** OWNER: packages/template-engine — named device stamps (same fields as drag) */
import type { DeviceInstance, DevicePlacement, TemplateRecord } from "../template.types";
import type { DeviceMetrics } from "../generate/types";
import { slicesTouched } from "../constraints/bleed";
import { validateLayout } from "../constraints/validate-layout";

export type PlacementPresetId =
  | "center"
  | "inset"
  | "low"
  | "crop-top"
  | "crop-bottom"
  | "tilt-left"
  | "tilt-right"
  | "yaw-left"
  | "yaw-right"
  | "pitch"
  | "bleed-next"
  | "bleed-prev";

export const PLACEMENT_PRESETS: Array<{
  id: PlacementPresetId;
  label: string;
  kind: "slice" | "cut";
}> = [
  { id: "center", label: "Center", kind: "slice" },
  { id: "inset", label: "Inset", kind: "slice" },
  { id: "low", label: "Float bottom", kind: "slice" },
  { id: "crop-top", label: "Crop top", kind: "slice" },
  { id: "crop-bottom", label: "Crop bottom", kind: "slice" },
  { id: "tilt-left", label: "Tilt left", kind: "slice" },
  { id: "tilt-right", label: "Tilt right", kind: "slice" },
  { id: "yaw-left", label: "Yaw left", kind: "slice" },
  { id: "yaw-right", label: "Yaw right", kind: "slice" },
  { id: "pitch", label: "Pitch", kind: "slice" },
  { id: "bleed-next", label: "Bleed next", kind: "cut" },
  { id: "bleed-prev", label: "Bleed prev", kind: "cut" },
];

export const MAX_BLEEDS = 3;

export type ApplyPlacementResult =
  | { ok: true; recipe: TemplateRecord }
  | { ok: false; error: string };

function cloneRecipe(recipe: TemplateRecord): TemplateRecord {
  return {
    ...recipe,
    devices: recipe.devices.map((d) => ({ ...d })),
    extras: recipe.extras?.map((e) => ({ ...e })),
    background: { ...recipe.background },
  };
}

function bleedCount(recipe: TemplateRecord, exceptId: string): number {
  return recipe.devices.filter(
    (d) =>
      d.id !== exceptId && (d.placement === "bleed-next" || d.placement === "bleed-prev")
  ).length;
}

function instanceShell(inst: DeviceInstance, aspect: number): number {
  return inst.orientation === "landscape" ? 1 / aspect : aspect;
}

function localStamp(
  inst: DeviceInstance,
  sliceIndex: number,
  aspect: number,
  opts: {
    w: number;
    y: number;
    rotationDeg: number;
    rotateXDeg?: number;
    rotateYDeg?: number;
    depth?: number;
  }
): DeviceInstance {
  const shell = instanceShell(inst, aspect);
  return {
    ...inst,
    x: sliceIndex + 0.5,
    y: opts.y,
    w: opts.w,
    h: opts.w * shell,
    rotationDeg: opts.rotationDeg,
    rotateXDeg: opts.rotateXDeg ?? 0,
    rotateYDeg: opts.rotateYDeg ?? 0,
    depth: opts.depth,
    z: inst.z || 1,
    placement: "center",
    authored: true,
  };
}

function cutStamp(
  inst: DeviceInstance,
  cutX: number,
  aspect: number,
  placement: Extract<DevicePlacement, "bleed-next" | "bleed-prev">
): DeviceInstance {
  const w = 0.76;
  return {
    ...inst,
    x: cutX,
    y: 0.62,
    w,
    h: w * instanceShell(inst, aspect),
    rotationDeg: placement === "bleed-next" ? -12 : 12,
    z: 1,
    placement,
    authored: true,
  };
}

function stamp(
  inst: DeviceInstance,
  preset: PlacementPresetId,
  sliceIndex: number,
  n: number,
  aspect: number
): { inst: DeviceInstance; error?: string; strip?: boolean } {
  switch (preset) {
    case "center":
      return { inst: localStamp(inst, sliceIndex, aspect, { w: 0.58, y: 0.52, rotationDeg: 0 }) };
    case "inset":
      return { inst: localStamp(inst, sliceIndex, aspect, { w: 0.46, y: 0.52, rotationDeg: 0 }) };
    case "low":
      return { inst: localStamp(inst, sliceIndex, aspect, { w: 0.58, y: 0.62, rotationDeg: 0 }) };
    case "crop-top":
      return { inst: localStamp(inst, sliceIndex, aspect, { w: 0.58, y: 0.28, rotationDeg: 0 }) };
    case "crop-bottom":
      return { inst: localStamp(inst, sliceIndex, aspect, { w: 0.58, y: 0.78, rotationDeg: 0 }) };
    case "tilt-left":
      return { inst: localStamp(inst, sliceIndex, aspect, { w: 0.58, y: 0.52, rotationDeg: -12 }) };
    case "tilt-right":
      return { inst: localStamp(inst, sliceIndex, aspect, { w: 0.58, y: 0.52, rotationDeg: 12 }) };
    case "yaw-left":
      return {
        inst: localStamp(inst, sliceIndex, aspect, {
          w: 0.58,
          y: 0.52,
          rotationDeg: 0,
          rotateYDeg: -28,
          depth: 0.045,
        }),
      };
    case "yaw-right":
      return {
        inst: localStamp(inst, sliceIndex, aspect, {
          w: 0.58,
          y: 0.52,
          rotationDeg: 0,
          rotateYDeg: 28,
          depth: 0.045,
        }),
      };
    case "pitch":
      return {
        inst: localStamp(inst, sliceIndex, aspect, {
          w: 0.58,
          y: 0.52,
          rotationDeg: 0,
          rotateXDeg: 12,
          depth: 0.045,
        }),
      };
    case "bleed-next":
      if (sliceIndex >= n - 1) return { inst, error: "Last slice has no next PNG to bleed into" };
      return { inst: cutStamp(inst, sliceIndex + 1, aspect, "bleed-next"), strip: true };
    case "bleed-prev":
      if (sliceIndex <= 0) return { inst, error: "First slice has no previous PNG to bleed from" };
      return { inst: cutStamp(inst, sliceIndex, aspect, "bleed-prev"), strip: true };
    default:
      return { inst, error: "Unknown preset" };
  }
}

/** Stamp one device. Bleed tiles require strip composition (one world behind both halves). */
export function applyPlacementPreset(opts: {
  recipe: TemplateRecord;
  instanceId: string;
  preset: PlacementPresetId;
  sliceIndex: number;
  metrics: DeviceMetrics;
}): ApplyPlacementResult {
  const recipe = cloneRecipe(opts.recipe);
  const i = recipe.devices.findIndex((d) => d.id === opts.instanceId);
  if (i < 0) return { ok: false, error: "No device selected" };
  const slice = Math.max(0, Math.min(recipe.frameCount - 1, opts.sliceIndex));
  const isCut = opts.preset === "bleed-next" || opts.preset === "bleed-prev";
  if (isCut && bleedCount(recipe, opts.instanceId) >= MAX_BLEEDS) {
    return { ok: false, error: `This set already has ${MAX_BLEEDS} bleeds (max)` };
  }
  const stamped = stamp(
    recipe.devices[i],
    opts.preset,
    slice,
    recipe.frameCount,
    opts.metrics.shellAspect
  );
  if (stamped.error) return { ok: false, error: stamped.error };
  recipe.devices[i] = stamped.inst;
  if (stamped.strip) recipe.composition = "strip";
  const check = validateLayout(recipe, opts.metrics.sliceW, opts.metrics.sliceH, {
    inset: opts.metrics.inset,
  });
  if (!check.ok) return { ok: false, error: check.errors[0] || "Layout would be illegal" };
  return { ok: true, recipe };
}

export function deviceOnSlice(
  recipe: TemplateRecord,
  sliceIndex: number,
  metrics: Pick<DeviceMetrics, "sliceW" | "sliceH">
): DeviceInstance | undefined {
  return recipe.devices.find((d) =>
    slicesTouched(d, recipe.frameCount, metrics.sliceW, metrics.sliceH).includes(sliceIndex)
  );
}
