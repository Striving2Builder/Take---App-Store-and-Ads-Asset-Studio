/** OWNER: packages/template-engine — layout recipe types (Phase 4) */
export type CompositionKind = "isolated" | "strip";
export type TypeFamily = "top" | "bottom" | "split";
export type TypeScale = "s" | "m" | "l";
export type DevicePlacement = "center" | "left" | "right" | "bleed-next" | "bleed-prev";

export type BackgroundLayer = {
  kind: "solid" | "gradient";
  colorA: string;
  colorB?: string;
};

export type DeviceInstance = {
  id: string;
  /** Center X in slice-widths (1 = one exportPx.w). Bleed-next sits near an integer. */
  x: number;
  /** Center Y in slice-heights (1 = exportPx.h). */
  y: number;
  /** Width in slice-widths. */
  w: number;
  /** Height in slice-widths (same unit as w so aspect is explicit). */
  h: number;
  rotationDeg: number;
  z: number;
  shotIndex: number;
  placement: DevicePlacement;
  /** User dragged/resized this instance — solver span rules relax. */
  authored?: boolean;
};

export type LayoutProvenance = {
  source: "seed" | "user" | "generated";
  seed?: string;
  grammarVersion?: string;
  fallback?: boolean;
};

export type TemplateRecord = {
  id: string;
  name: string;
  tags: string[];
  version: number;
  composition: CompositionKind;
  deviceId?: string;
  defaultOrientation?: "portrait" | "landscape";
  frameCount: number;
  typeFamily: TypeFamily;
  typeScale: TypeScale;
  background: BackgroundLayer;
  devices: DeviceInstance[];
  lockBrand?: boolean;
  style?: string;
  palette?: string[];
  provenance?: LayoutProvenance;
};

/** @deprecated identity-only alias — use TemplateRecord */
export type TemplateIdentity = Pick<
  TemplateRecord,
  "id" | "name" | "deviceId" | "defaultOrientation" | "tags" | "version"
>;
