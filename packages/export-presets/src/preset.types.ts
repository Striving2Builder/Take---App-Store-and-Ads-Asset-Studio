/** OWNER: packages/export-presets — preset types */
export type ExportFit = "cover" | "contain";
export type PresetKind = "store" | "sized" | "motion" | "fake";
/** sized: every frame vs frame 0 only. Store frames are always per-frame. */
export type EmitPolicy = "per-frame" | "hero";

export type ExportTarget = {
  id: string;
  w: number;
  h: number;
  fit: ExportFit;
};

export type ExportPreset = {
  id: string;
  label: string;
  sizes: string;
  destination: string;
  defaultOn?: boolean;
  kind: PresetKind;
  targets: ExportTarget[];
  emit?: EmitPolicy;
  /** ZIP folder under the destination root (e.g. social, feature, iab). */
  folder?: string;
};
