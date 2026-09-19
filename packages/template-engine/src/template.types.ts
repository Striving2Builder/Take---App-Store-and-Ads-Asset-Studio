/** OWNER: packages/template-engine — layout recipe types (Phase 4) */
export type CompositionKind = "isolated" | "strip";
export type TypeFamily = "top" | "bottom" | "split";
export type TypeScale = "s" | "m" | "l";
export type DevicePlacement = "center" | "left" | "right" | "bleed-next" | "bleed-prev";
export type ExtraKind = "copy" | "visual";
export type ImageFit = "cover" | "contain";
export type TypeBandKind = TypeFamily | "none";
export const EXTRA_SHAPES = ["blob", "wave", "star", "dots", "scribble"] as const;
export type ExtraShape = (typeof EXTRA_SHAPES)[number];
export const EXTRA_WIDGETS = ["rating", "review", "pills", "award"] as const;
export type ExtraWidget = (typeof EXTRA_WIDGETS)[number];
export const EXTRA_FACES = ["display", "script"] as const;
export type ExtraFace = (typeof EXTRA_FACES)[number];

export type BackgroundLayer = {
  kind: "solid" | "gradient" | "image";
  colorA: string;
  colorB?: string;
  /** data-URL or https — world panorama when composition is strip */
  imageUrl?: string;
  fit?: ImageFit;
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
  /** In-plane Z rotation (picture plane). */
  rotationDeg: number;
  /** Lean toward/away (top recedes when positive). */
  rotateXDeg?: number;
  /** Yaw — positive shows the right edge. */
  rotateYDeg?: number;
  /** Box thickness in slice-widths. Default 0.045 when yaw/pitch is set. */
  depth?: number;
  z: number;
  shotIndex: number;
  placement: DevicePlacement;
  /** User dragged/resized this instance — solver span rules relax. */
  authored?: boolean;
  /** Shell orientation; default = recipe defaultOrientation. Export PNG size stays the set's. */
  orientation?: "portrait" | "landscape";
  /** Screenshot fill inside this device's screen inset. Default "cover". */
  fit?: "cover" | "contain";
};

/** Extra copy/visual on the export slice — not kicker/headline/caption, not world bg. */
export type ExtraSlot = {
  id: string;
  kind: ExtraKind;
  /** Home slice (0-based). x is still world slice-widths like devices. */
  sliceIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rotationDeg: number;
  z: number;
  text?: string;
  imageUrl?: string;
  fill?: string;
  authored?: boolean;
  /** Procedural chrome — not an uploaded competitor asset. */
  shape?: ExtraShape;
  widget?: ExtraWidget;
  score?: number;
  storeLabel?: string;
  quote?: string;
  attribution?: string;
  stars?: number;
  pills?: string[];
  /** "award" widget only — e.g. label "EDITOR'S CHOICE", sublabel "App Store 2026". */
  label?: string;
  sublabel?: string;
  /** Mini-screen extra: scan shot index (not a DeviceInstance). */
  shotIndex?: number;
  /** Extra copy face only — not kicker/headline. */
  face?: ExtraFace;
  /** Authored placeholder ("Your photo spans this cut") — dim + mark it so
   *  it never ships as if it were real copy. */
  sample?: boolean;
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
  /** Per-PNG type band; missing index falls back to typeFamily. */
  typeBand?: TypeBandKind[];
  typeScale: TypeScale;
  background: BackgroundLayer;
  devices: DeviceInstance[];
  extras?: ExtraSlot[];
  lockBrand?: boolean;
  style?: string;
  palette?: string[];
  provenance?: LayoutProvenance;
};

/** A recipe has real content — a device, or a real extra (a full-bleed
 *  screenshot, an award badge, ...) — and isn't just an empty shell. Every
 *  "does this card have a layout" check in the app used to test
 *  `devices.length` alone, which was correct back when every template
 *  always painted a device — but device-free compositions (full-bleed raw
 *  screenshots, trust/award-only frames) are real, intentional designs,
 *  not broken ones, so that check would have rejected them outright
 *  (Library "Use" refusing them with "no layout", thumbnails silently
 *  blank). Use this instead of checking `.devices.length` directly. */
export function hasRealLayout(recipe: Pick<TemplateRecord, "devices" | "extras">): boolean {
  return recipe.devices.length > 0 || (recipe.extras?.length ?? 0) > 0;
}

/** @deprecated identity-only alias — use TemplateRecord */
export type TemplateIdentity = Pick<
  TemplateRecord,
  "id" | "name" | "deviceId" | "defaultOrientation" | "tags" | "version"
>;
