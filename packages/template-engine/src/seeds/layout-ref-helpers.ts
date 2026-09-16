/** OWNER: packages/template-engine — shared geometry for layout-ref recipes */
import type { DeviceInstance, ExtraSlot, ExtraShape, ExtraWidget, TemplateRecord } from "../template.types";

export const IOS = "apple.iphone-16-pro-max";
export const ASPECT = 844 / 390;

export const layoutBase = {
  /** Dual-store geometry — Edit store-target toggles iOS ↔ Android shell */
  tags: ["mobile", "layout", "screenshots"],
  version: 1 as const,
  deviceId: IOS,
  defaultOrientation: "portrait" as const,
  typeScale: "m" as const,
  lockBrand: false,
  provenance: { source: "seed" as const, grammarVersion: "2026.08" },
};

export function phone(
  id: string,
  x: number,
  y: number,
  w: number,
  shotIndex: number,
  extra: Partial<DeviceInstance> = {}
): DeviceInstance {
  return {
    id,
    x,
    y,
    w,
    h: extra.orientation === "landscape" ? w / ASPECT : w * ASPECT,
    rotationDeg: extra.rotationDeg ?? 0,
    rotateXDeg: extra.rotateXDeg,
    rotateYDeg: extra.rotateYDeg,
    depth: extra.depth,
    z: extra.z ?? 1,
    shotIndex,
    placement: extra.placement ?? "center",
    authored: extra.authored ?? true,
    orientation: extra.orientation,
  };
}

export function shapeSlot(
  id: string,
  sliceIndex: number,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  shape: ExtraShape = "blob"
): ExtraSlot {
  return {
    id,
    kind: "visual",
    sliceIndex,
    x,
    y,
    w,
    h,
    rotationDeg: 0,
    z: 0,
    fill,
    shape,
    authored: true,
  };
}

export function copyMark(
  id: string,
  sliceIndex: number,
  text: string,
  face?: ExtraSlot["face"],
  y = 0.16,
  sample = false
): ExtraSlot {
  return {
    id,
    kind: "copy",
    sliceIndex,
    x: sliceIndex + 0.5,
    y,
    w: 0.84,
    h: 0.12,
    rotationDeg: 0,
    z: 22,
    fill: "#f3f1ec",
    text,
    face,
    authored: true,
    sample,
  };
}

/** Empty visual plate — user drops a photo. Not TAKE stock. */
export function photoPlate(
  id: string,
  sliceIndex: number,
  x: number,
  y: number,
  w: number,
  h: number
): ExtraSlot {
  return {
    id,
    kind: "visual",
    sliceIndex,
    x,
    y,
    w,
    h,
    rotationDeg: 0,
    z: 12,
    fill: "rgba(243,241,236,0.22)",
    authored: true,
  };
}

export function miniScreen(
  id: string,
  sliceIndex: number,
  x: number,
  y: number,
  shotIndex: number,
  z = 8
): ExtraSlot {
  return {
    id,
    kind: "visual",
    sliceIndex,
    x,
    y,
    w: 0.22,
    h: 0.28,
    rotationDeg: 0,
    z,
    fill: "#14151a",
    shotIndex,
    authored: true,
  };
}

export function widgetSlot(
  id: string,
  sliceIndex: number,
  widget: ExtraWidget,
  x: number,
  y: number,
  w: number,
  h: number,
  extra: Partial<ExtraSlot> = {}
): ExtraSlot {
  const kind = widget === "rating" ? "visual" : "copy";
  return {
    id,
    kind,
    sliceIndex,
    x,
    y,
    w,
    h,
    rotationDeg: 0,
    z: 22,
    fill: "#f3f1ec",
    widget,
    authored: true,
    ...extra,
  };
}

export function rec(partial: {
  id: string;
  name: string;
  composition: TemplateRecord["composition"];
  frameCount: number;
  typeFamily: TemplateRecord["typeFamily"];
  typeBand?: TemplateRecord["typeBand"];
  style: string;
  background: TemplateRecord["background"];
  palette: string[];
  devices: DeviceInstance[];
  extras: ExtraSlot[];
}): TemplateRecord {
  return { ...layoutBase, ...partial };
}
