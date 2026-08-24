/** OWNER: packages/template-engine — Wizard → isolated recipe so world coords exist */
import type { CompositionKind, DeviceInstance, TemplateRecord } from "./template.types";
import { resolveMetrics } from "./generate/metrics";

export const MAX_EXTRAS_PER_SLICE = 6;

function centeredDevice(i: number, n: number, shellAspect: number): DeviceInstance {
  const w = 0.58;
  return {
    id: `iso-${i}`,
    x: i + 0.5,
    y: 0.52,
    w,
    h: w * shellAspect,
    rotationDeg: 0,
    z: 1,
    shotIndex: Math.min(i, Math.max(0, n - 1)),
    placement: "center",
  };
}

function metricsOf(recipe: Partial<TemplateRecord>, deviceId?: string) {
  return resolveMetrics(
    deviceId || recipe.deviceId || "apple.iphone-16-pro-max",
    "ios",
    recipe.defaultOrientation === "landscape" ? "landscape" : "portrait"
  );
}

function syncDevices(recipe: TemplateRecord, n: number, deviceId?: string): DeviceInstance[] {
  const m = metricsOf(recipe, deviceId);
  const kept = recipe.devices.filter((d) => Math.floor(d.x) < n || d.placement === "bleed-next");
  const out = [...kept];
  for (let i = 0; i < n; i++) {
    if (out.some((d) => Math.floor(d.x) === i)) continue;
    if (extrasInSlice({ ...recipe, extras: recipe.extras }, i).length) continue;
    out.push(centeredDevice(i, n, m.shellAspect));
  }
  return out;
}

/** Create or refresh an isolated (or keep strip) recipe for the current frame count. */
export function ensureIsolatedRecipe(opts: {
  existing?: TemplateRecord | null;
  frameCount: number;
  deviceId?: string;
  palette?: string[];
  composition?: CompositionKind;
}): TemplateRecord {
  const n = Math.min(12, Math.max(1, opts.frameCount));
  const existing = opts.existing;
  if (existing && (existing.devices?.length || existing.extras?.length)) {
    const composition = opts.composition || existing.composition;
    return {
      ...existing,
      frameCount: n,
      deviceId: opts.deviceId || existing.deviceId,
      composition,
      devices: syncDevices({ ...existing, frameCount: n }, n, opts.deviceId || existing.deviceId),
      extras: (existing.extras || []).filter((e) => e.sliceIndex < n),
      typeBand: existing.typeBand?.slice(0, n),
    };
  }
  const m = metricsOf({ deviceId: opts.deviceId }, opts.deviceId);
  const colorA = opts.palette?.[1] || "#0c0d10";
  const devices = Array.from({ length: n }, (_, i) => centeredDevice(i, n, m.shellAspect));
  return {
    id: `iso-${Date.now()}`,
    name: "Layout",
    tags: [],
    version: 1,
    composition: opts.composition || "isolated",
    deviceId: opts.deviceId,
    frameCount: n,
    typeFamily: "top",
    typeScale: "m",
    background: { kind: "solid", colorA },
    devices,
    extras: [],
    palette: opts.palette,
    provenance: { source: "user" },
  };
}

export function applyStripPanorama(
  recipe: TemplateRecord,
  imageUrl: string,
  fit: "cover" | "contain" = "cover"
): TemplateRecord {
  return {
    ...recipe,
    composition: "strip",
    background: {
      kind: "image",
      colorA: recipe.background.colorA || "#0c0d10",
      imageUrl,
      fit,
    },
  };
}

export function extrasInSlice(recipe: TemplateRecord, sliceIndex: number) {
  return (recipe.extras || []).filter((e) => e.sliceIndex === sliceIndex || Math.floor(e.x) === sliceIndex);
}
